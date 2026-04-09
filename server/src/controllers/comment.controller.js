import mongoose from "mongoose";

import Comment from "../models/Comment.js";
import Reaction from "../models/Reaction.js";
import Trip from "../models/Trip.js";
import { createNotification } from "../services/notification.service.js";
import { getTripAccessContext } from "../utils/tripVisibility.js";

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?.toString?.() || "";
}

function encodeCommentCursor(comment) {
  const createdAt =
    comment?.createdAt instanceof Date
      ? comment.createdAt.toISOString()
      : typeof comment?.createdAt === "string"
        ? comment.createdAt
        : "";
  const commentId = toIdString(comment?._id);

  if (!createdAt || !commentId) {
    return null;
  }

  return `${createdAt}__${commentId}`;
}

function decodeCommentCursor(rawCursor) {
  if (typeof rawCursor !== "string" || !rawCursor.trim()) {
    return null;
  }

  const trimmedCursor = rawCursor.trim();
  const separatorIndex = trimmedCursor.lastIndexOf("__");

  if (separatorIndex === -1) {
    const legacyDate = new Date(trimmedCursor);
    return Number.isNaN(legacyDate.getTime())
      ? null
      : {
          createdAt: legacyDate,
          id: "",
        };
  }

  const createdAtRaw = trimmedCursor.slice(0, separatorIndex);
  const idRaw = trimmedCursor.slice(separatorIndex + 2);
  const createdAt = new Date(createdAtRaw);

  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return {
    createdAt,
    id: mongoose.isValidObjectId(idRaw) ? idRaw : "",
  };
}

function countDescendants(replies = []) {
  return replies.reduce(
    (total, reply) => total + 1 + countDescendants(reply?.replies || []),
    0,
  );
}

function normalizeCommentUser(user) {
  if (!user || user?.scheduledDeletionAt || user?.isDeletedUser) {
    return {
      _id: null,
      name: "Unavailable user",
      avatarUrl: "",
      unavailable: true,
      isDeletedUser: true,
    };
  }

  return {
    ...user,
    unavailable: false,
    isDeletedUser: false,
  };
}

function normalizeCommentPayload(comment, replies = [], options = {}) {
  const likeCount = Math.max(
    0,
    Number(comment?.likeCount ?? comment?.counts?.reactions ?? 0),
  );

  const normalizedAuthor = normalizeCommentUser(comment?.userId || comment?.user);
  const normalizedReplyToUser = normalizeCommentUser(
    comment?.replyToUser || comment?.replyToUserId,
  );

  return {
    ...comment,
    userId: normalizedAuthor,
    user: normalizedAuthor,
    replyToUserId: comment?.replyToUserId ? normalizedReplyToUser : null,
    replyToUser: comment?.replyToUserId ? normalizedReplyToUser : null,
    liked: !!comment?.liked,
    likeCount,
    replyCount: Number.isFinite(options?.replyCount)
      ? Number(options.replyCount)
      : countDescendants(replies),
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

function collectCommentIds(items = [], collector = []) {
  items.forEach((comment) => {
    const currentId = toIdString(comment?._id);
    if (currentId) {
      collector.push(currentId);
    }

    if (Array.isArray(comment?.replies) && comment.replies.length) {
      collectCommentIds(comment.replies, collector);
    }
  });

  return collector;
}

function decorateCommentTreeWithLikes(items = [], likedSet = new Set()) {
  return items.map((comment) => ({
    ...comment,
    liked: likedSet.has(toIdString(comment?._id)),
    likeCount: Math.max(0, Number(comment?.counts?.reactions ?? comment?.likeCount ?? 0)),
    replies: Array.isArray(comment?.replies)
      ? decorateCommentTreeWithLikes(comment.replies, likedSet)
      : [],
  }));
}

async function buildReplyCountMap(rootCommentIds = [], tripId) {
  if (!rootCommentIds.length) {
    return new Map();
  }

  const replyCounts = await Comment.aggregate([
    {
      $match: {
        _id: { $in: rootCommentIds.map((id) => new mongoose.Types.ObjectId(id)) },
      },
    },
    {
      $graphLookup: {
        from: Comment.collection.name,
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parentCommentId",
        as: "descendants",
        restrictSearchWithMatch: {
          targetType: "trip",
          targetId: new mongoose.Types.ObjectId(tripId),
        },
      },
    },
    {
      $project: {
        _id: 1,
        replyCount: { $size: "$descendants" },
      },
    },
  ]);

  return new Map(
    replyCounts.map((item) => [toIdString(item?._id), Number(item?.replyCount || 0)]),
  );
}

async function collectCommentSubtreeIds(rootCommentId) {
  const collectedIds = [];
  const queue = [toIdString(rootCommentId)];

  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId) continue;

    collectedIds.push(currentId);

    const children = await Comment.find({ parentCommentId: currentId })
      .select("_id")
      .lean();

    children.forEach((child) => {
      const childId = toIdString(child?._id);
      if (childId) {
        queue.push(childId);
      }
    });
  }

  return collectedIds;
}

async function resolveRootCommentId(commentOrId) {
  let currentId =
    typeof commentOrId === "string"
      ? commentOrId
      : toIdString(commentOrId?._id || commentOrId);

  if (!currentId) {
    return "";
  }

  let currentParentId =
    typeof commentOrId === "object" && commentOrId
      ? toIdString(commentOrId?.parentCommentId)
      : "";

  while (currentParentId) {
    const parent = await Comment.findById(currentParentId)
      .select("_id parentCommentId")
      .lean();

    if (!parent) {
      break;
    }

    currentId = toIdString(parent._id) || currentId;
    currentParentId = toIdString(parent.parentCommentId);
  }

  return currentId;
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
        .select("_id userId parentCommentId")
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

    if (!parentComment?._id) {
      await createNotification({
        recipientUserId: trip.ownerId,
        actorUserId: userId,
        type: "trip_comment",
        tripId,
        commentId: created._id,
        payload: {
          focusCommentId: toIdString(created._id),
          threadCommentId: toIdString(created._id),
        },
      });
    } else {
      const threadCommentId = await resolveRootCommentId(parentComment);

      await createNotification({
        recipientUserId: parentComment.userId,
        actorUserId: userId,
        type: "comment_reply",
        tripId,
        commentId: created._id,
        payload: {
          focusCommentId: toIdString(created._id),
          threadCommentId: threadCommentId || toIdString(parentComment._id),
        },
      });
    }

    const comment = await Comment.findById(created._id)
      .populate("userId", "name avatarUrl scheduledDeletionAt")
      .populate("replyToUserId", "name avatarUrl scheduledDeletionAt")
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

    const cursor = decodeCommentCursor(req.query.cursor);

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

    if (cursor?.createdAt) {
      if (cursor.id) {
        filter.$or = [
          { createdAt: { $lt: cursor.createdAt } },
          {
            createdAt: cursor.createdAt,
            _id: { $lt: new mongoose.Types.ObjectId(cursor.id) },
          },
        ];
      } else {
        filter.createdAt = { $lt: cursor.createdAt };
      }
    }

    const docs = await Comment.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("userId", "name avatarUrl scheduledDeletionAt")
      .populate("replyToUserId", "name avatarUrl scheduledDeletionAt")
      .lean();

    const hasMore = docs.length > limit;
    const topLevelItems = hasMore ? docs.slice(0, limit) : docs;
    const topLevelIds = topLevelItems.map((item) => toIdString(item._id)).filter(Boolean);
    const replyCountMap = await buildReplyCountMap(topLevelIds, tripId);

    const nextCursor = topLevelItems.length
      ? encodeCommentCursor(topLevelItems[topLevelItems.length - 1])
      : null;

    const items = topLevelItems
      .map((comment) =>
        normalizeCommentPayload(
          comment,
          [],
          {
            replyCount: replyCountMap.get(toIdString(comment?._id)) || 0,
          },
        ),
      )
      .reverse();

    const commentIds = topLevelIds;
    const likedSet = new Set(
      commentIds.length
        ? (
            await Reaction.find({
              targetType: "comment",
              userId: viewerId,
              targetId: { $in: commentIds },
            })
              .select("targetId")
              .lean()
          ).map((item) => toIdString(item.targetId))
        : [],
    );

    res.json({
      comments: decorateCommentTreeWithLikes(items, likedSet),
      page: { limit, hasMore, nextCursor },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/comments/:commentId/replies
export async function listCommentReplies(req, res, next) {
  try {
    const commentId = req.params.commentId;
    const viewerId = req.user.userId;

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const rootComment = await Comment.findById(commentId)
      .select("_id targetType targetId")
      .lean();

    if (!rootComment || rootComment.targetType !== "trip") {
      return res.status(404).json({ message: "Comment not found" });
    }

    const { trip, canView } = await getTripAccessContext({
      tripId: rootComment.targetId,
      viewerId,
    });

    if (!trip || !canView) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const subtreeIds = await collectCommentSubtreeIds(commentId);
    const replyIds = subtreeIds.filter((id) => id && id !== toIdString(commentId));

    if (!replyIds.length) {
      return res.json({ replies: [] });
    }

    const replyDocs = await Comment.find({
      _id: { $in: replyIds },
      targetType: "trip",
      targetId: rootComment.targetId,
    })
      .sort({ createdAt: 1 })
      .populate("userId", "name avatarUrl scheduledDeletionAt")
      .populate("replyToUserId", "name avatarUrl scheduledDeletionAt")
      .lean();

    const repliesByParentId = new Map();

    replyDocs.forEach((reply) => {
      const parentId = toIdString(reply?.parentCommentId);
      if (!parentId) return;

      if (!repliesByParentId.has(parentId)) {
        repliesByParentId.set(parentId, []);
      }

      repliesByParentId.get(parentId).push(reply);
    });

    const replies = buildReplyTree(commentId, repliesByParentId);
    const likedSet = new Set(
      (
        await Reaction.find({
          targetType: "comment",
          userId: viewerId,
          targetId: { $in: replyIds },
        })
          .select("targetId")
          .lean()
      ).map((item) => toIdString(item.targetId)),
    );

    res.json({
      replies: decorateCommentTreeWithLikes(replies, likedSet),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/comments/:commentId/context
export async function getCommentContext(req, res, next) {
  try {
    const commentId = req.params.commentId;
    const viewerId = req.user.userId;

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const comment = await Comment.findById(commentId)
      .select("_id targetType targetId parentCommentId")
      .lean();

    if (!comment || comment.targetType !== "trip") {
      return res.status(404).json({ message: "Comment not found" });
    }

    const { trip, canView } = await getTripAccessContext({
      tripId: comment.targetId,
      viewerId,
    });

    if (!trip || !canView) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const threadCommentId =
      (await resolveRootCommentId(comment)) || toIdString(comment._id);

    res.json({
      tripId: toIdString(comment.targetId),
      focusCommentId: toIdString(comment._id),
      threadCommentId,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/comments/:commentId
export async function updateComment(req, res, next) {
  try {
    const userId = req.user.userId;
    const commentId = req.params.commentId;
    const content = req.body?.content?.trim();

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const existingComment = await Comment.findById(commentId)
      .select("_id userId targetType targetId")
      .lean();

    if (!existingComment || existingComment.targetType !== "trip") {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (toIdString(existingComment.userId) !== toIdString(userId)) {
      return res.status(403).json({ message: "You can only edit your own comment" });
    }

    const { trip, canView } = await getTripAccessContext({
      tripId: existingComment.targetId,
      viewerId: userId,
    });

    if (!trip || !canView) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const updatedComment = await Comment.findOneAndUpdate(
      { _id: commentId, userId },
      { $set: { content } },
      { returnDocument: "after" },
    )
      .populate("userId", "name avatarUrl scheduledDeletionAt")
      .populate("replyToUserId", "name avatarUrl scheduledDeletionAt")
      .lean();

    if (!updatedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({
      comment: normalizeCommentPayload(updatedComment, []),
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/comments/:commentId
export async function deleteComment(req, res, next) {
  try {
    const userId = req.user.userId;
    const commentId = req.params.commentId;

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const existingComment = await Comment.findById(commentId)
      .select("_id userId targetType targetId")
      .lean();

    if (!existingComment || existingComment.targetType !== "trip") {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (toIdString(existingComment.userId) !== toIdString(userId)) {
      return res.status(403).json({ message: "You can only delete your own comment" });
    }

    const { trip, canView } = await getTripAccessContext({
      tripId: existingComment.targetId,
      viewerId: userId,
    });

    if (!trip || !canView) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const subtreeIds = await collectCommentSubtreeIds(existingComment._id);
    const deleteCount = subtreeIds.length;

    if (!deleteCount) {
      return res.status(404).json({ message: "Comment not found" });
    }

    await Comment.deleteMany({
      _id: { $in: subtreeIds },
      targetType: "trip",
      targetId: existingComment.targetId,
    });

    await Reaction.deleteMany({
      targetType: "comment",
      targetId: { $in: subtreeIds },
    });

    await Trip.updateOne(
      { _id: existingComment.targetId },
      { $inc: { "counts.comments": -deleteCount } },
    );

    res.json({
      deletedCommentId: toIdString(existingComment._id),
      deletedCount: deleteCount,
    });
  } catch (err) {
    next(err);
  }
}
