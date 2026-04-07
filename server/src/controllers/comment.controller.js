import mongoose from "mongoose";

import Comment from "../models/Comment.js";
import Trip from "../models/Trip.js";
import { getTripAccessContext } from "../utils/tripVisibility.js";

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?.toString?.() || "";
}

function countDescendants(replies = []) {
  return replies.reduce(
    (total, reply) => total + 1 + countDescendants(reply?.replies || []),
    0,
  );
}

function normalizeCommentPayload(comment, replies = []) {
  return {
    ...comment,
    replyToUser: comment?.replyToUserId || null,
    replyCount: countDescendants(replies),
    replies,
  };
}

function buildReplyTree(parentId, repliesByParentId) {
  const key = toIdString(parentId);
  const directReplies = repliesByParentId.get(key) || [];

  return directReplies.map((reply) =>
    normalizeCommentPayload(
      reply,
      buildReplyTree(reply?._id, repliesByParentId),
    ),
  );
}

// POST /api/trips/:id/comments
export async function createTripComment(req, res, next) {
  try {
    const userId = req.user.userId;
    const tripId = req.params.id;
    const content = req.body?.content?.trim();
    const parentCommentId =
      typeof req.body?.parentCommentId === "string"
        ? req.body.parentCommentId.trim()
        : "";

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const { trip, canView } = await getTripAccessContext({
      tripId,
      viewerId: userId,
    });

    if (!trip || !canView) {
      return res.status(404).json({ message: "Trip not found" });
    }

    let parentComment = null;

    if (parentCommentId) {
      if (!mongoose.isValidObjectId(parentCommentId)) {
        return res.status(400).json({ message: "Invalid parent comment id" });
      }

      parentComment = await Comment.findOne({
        _id: parentCommentId,
        targetType: "trip",
        targetId: tripId,
      })
        .select("_id userId")
        .lean();

      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
    }

    const created = await Comment.create({
      targetType: "trip",
      targetId: tripId,
      userId,
      content,
      parentCommentId: parentComment?._id || null,
      replyToUserId: parentComment?.userId || null,
    });

    await Trip.updateOne({ _id: tripId }, { $inc: { "counts.comments": 1 } });

    const comment = await Comment.findById(created._id)
      .populate("userId", "name avatarUrl")
      .populate("replyToUserId", "name avatarUrl")
      .lean();

    res.status(201).json({
      comment: normalizeCommentPayload(comment, []),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/trips/:id/comments?limit=20&cursor=...
export async function listTripComments(req, res, next) {
  try {
    const tripId = req.params.id;
    const viewerId = req.user.userId;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const limitRaw = Number(req.query.limit ?? 20);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 20;

    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const { trip, canView } = await getTripAccessContext({
      tripId,
      viewerId,
    });

    if (!trip || !canView) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const filter = {
      targetType: "trip",
      targetId: tripId,
      parentCommentId: null,
    };

    if (cursor && !Number.isNaN(cursor.getTime())) {
      filter.createdAt = { $lt: cursor };
    }

    const docs = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("userId", "name avatarUrl")
      .populate("replyToUserId", "name avatarUrl")
      .lean();

    const hasMore = docs.length > limit;
    const topLevelItems = hasMore ? docs.slice(0, limit) : docs;
    const topLevelIds = new Set(topLevelItems.map((item) => toIdString(item._id)));

    const replyDocs = topLevelItems.length
      ? await Comment.find({
          targetType: "trip",
          targetId: tripId,
          parentCommentId: { $ne: null },
        })
          .sort({ createdAt: 1 })
          .populate("userId", "name avatarUrl")
          .populate("replyToUserId", "name avatarUrl")
          .lean()
      : [];

    const rawRepliesByParentId = new Map();

    replyDocs.forEach((reply) => {
      const parentId = toIdString(reply?.parentCommentId);
      if (!parentId) return;

      if (!rawRepliesByParentId.has(parentId)) {
        rawRepliesByParentId.set(parentId, []);
      }

      rawRepliesByParentId.get(parentId).push(reply);
    });

    const allowedCommentIds = new Set([...topLevelIds]);

    function collectDescendantIds(parentId) {
      const children = rawRepliesByParentId.get(parentId) || [];
      children.forEach((child) => {
        const childId = toIdString(child?._id);
        if (!childId || allowedCommentIds.has(childId)) return;
        allowedCommentIds.add(childId);
        collectDescendantIds(childId);
      });
    }

    topLevelIds.forEach((commentId) => {
      collectDescendantIds(commentId);
    });

    const repliesByParentId = new Map();

    rawRepliesByParentId.forEach((children, parentId) => {
      const filteredChildren = children.filter((child) =>
        allowedCommentIds.has(toIdString(child?._id)),
      );

      if (filteredChildren.length) {
        repliesByParentId.set(parentId, filteredChildren);
      }
    });

    const nextCursor = topLevelItems.length
      ? topLevelItems[topLevelItems.length - 1].createdAt.toISOString()
      : null;

    const items = topLevelItems
      .map((comment) =>
        normalizeCommentPayload(
          comment,
          buildReplyTree(comment?._id, repliesByParentId),
        ),
      )
      .reverse();

    res.json({
      comments: items,
      page: { limit, hasMore, nextCursor },
    });
  } catch (err) {
    next(err);
  }
}
