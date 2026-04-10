import mongoose from "mongoose";
import { unlink } from "fs/promises";

import Comment from "../models/Comment.js";
import Reaction from "../models/Reaction.js";
import Trip from "../models/Trip.js";
import { cloudinary } from "../config/cloudinary.js";
import { createNotification } from "./notification.service.js";
import { getTripAccessContext } from "../utils/tripVisibility.js";

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

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
    image:
      comment?.image?.url
        ? {
            url: comment.image.url,
            publicId: comment.image.publicId || "",
            width: comment.image.width ?? null,
            height: comment.image.height ?? null,
            mediaType: comment.image.mediaType || "image",
          }
        : null,
    liked: !!comment?.liked,
    likeCount,
    replyCount: Number.isFinite(options?.replyCount)
      ? Number(options.replyCount)
      : countDescendants(replies),
    replies,
  };
}

async function uploadFilePathToCloudinary(filePath, options) {
  return cloudinary.uploader.upload(filePath, options);
}

async function resolveTripCommentContext({ tripId, userId, parentCommentId = "" }) {
  if (!mongoose.isValidObjectId(tripId)) {
    throw createHttpError(400, "Invalid trip id");
  }

  const { trip, canView } = await getTripAccessContext({
    tripId,
    viewerId: userId,
  });

  if (!trip || !canView) {
    throw createHttpError(404, "Trip not found");
  }

  let parentComment = null;

  if (parentCommentId) {
    if (!mongoose.isValidObjectId(parentCommentId)) {
      throw createHttpError(400, "Invalid parent comment id");
    }

    parentComment = await Comment.findOne({
      _id: parentCommentId,
      targetType: "trip",
      targetId: tripId,
    })
      .select("_id userId parentCommentId")
      .lean();

    if (!parentComment) {
      throw createHttpError(404, "Parent comment not found");
    }
  }

  return {
    trip,
    parentComment,
  };
}

async function finalizeCreatedTripComment({
  createdCommentId,
  parentComment,
  trip,
  tripId,
  userId,
}) {
  await Trip.updateOne({ _id: tripId }, { $inc: { "counts.comments": 1 } });

  if (!parentComment?._id) {
    await createNotification({
      recipientUserId: trip.ownerId,
      actorUserId: userId,
      type: "trip_comment",
      tripId,
      commentId: createdCommentId,
      payload: {
        focusCommentId: toIdString(createdCommentId),
        threadCommentId: toIdString(createdCommentId),
      },
    });
  } else {
    const threadCommentId = await resolveRootCommentId(parentComment);

    await createNotification({
      recipientUserId: parentComment.userId,
      actorUserId: userId,
      type: "comment_reply",
      tripId,
      commentId: createdCommentId,
      payload: {
        focusCommentId: toIdString(createdCommentId),
        threadCommentId: threadCommentId || toIdString(parentComment._id),
      },
    });
  }

  const comment = await Comment.findById(createdCommentId)
    .populate("userId", "name avatarUrl scheduledDeletionAt")
    .populate("replyToUserId", "name avatarUrl scheduledDeletionAt")
    .lean();

  return normalizeCommentPayload(comment, []);
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

function decorateCommentTreeWithLikes(items = [], likedSet = new Set()) {
  return items.map((comment) => ({
    ...comment,
    liked: likedSet.has(toIdString(comment?._id)),
    likeCount: Math.max(
      0,
      Number(comment?.counts?.reactions ?? comment?.likeCount ?? 0),
    ),
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
    replyCounts.map((item) => [
      toIdString(item?._id),
      Number(item?.replyCount || 0),
    ]),
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

export async function createTripComment({
  userId,
  tripId,
  content,
  parentCommentId = "",
}) {
  const context = await resolveTripCommentContext({
    tripId,
    userId,
    parentCommentId,
  });

  if (!content) {
    throw createHttpError(400, "Content is required");
  }

  const created = await Comment.create({
    targetType: "trip",
    targetId: tripId,
    userId,
    content,
    parentCommentId: context.parentComment?._id || null,
    replyToUserId: context.parentComment?.userId || null,
  });

  return {
    comment: await finalizeCreatedTripComment({
      createdCommentId: created._id,
      parentComment: context.parentComment,
      trip: context.trip,
      tripId,
      userId,
    }),
  };
}

export async function createTripCommentGif({
  userId,
  tripId,
  content = "",
  gifUrl,
  parentCommentId = "",
  width = null,
  height = null,
}) {
  const context = await resolveTripCommentContext({
    tripId,
    userId,
    parentCommentId,
  });

  const created = await Comment.create({
    targetType: "trip",
    targetId: tripId,
    userId,
    content,
    parentCommentId: context.parentComment?._id || null,
    replyToUserId: context.parentComment?.userId || null,
    image: {
      url: gifUrl,
      publicId: "",
      width: Number.isFinite(width) ? width : null,
      height: Number.isFinite(height) ? height : null,
      mediaType: "gif",
    },
  });

  return {
    comment: await finalizeCreatedTripComment({
      createdCommentId: created._id,
      parentComment: context.parentComment,
      trip: context.trip,
      tripId,
      userId,
    }),
  };
}

export async function createTripCommentImage({
  userId,
  tripId,
  content = "",
  parentCommentId = "",
  imageFile,
}) {
  let uploadedImage = null;

  try {
    const context = await resolveTripCommentContext({
      tripId,
      userId,
      parentCommentId,
    });

    if (!imageFile) {
      throw createHttpError(400, "Image is required.");
    }

    try {
      const result = await uploadFilePathToCloudinary(imageFile.path, {
        folder: `comments/${tripId}`,
        resource_type: "image",
      });

      uploadedImage = {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width ?? null,
        height: result.height ?? null,
        mediaType: "image",
      };
    } finally {
      await unlink(imageFile.path).catch(() => {});
    }

    const created = await Comment.create({
      targetType: "trip",
      targetId: tripId,
      userId,
      content,
      parentCommentId: context.parentComment?._id || null,
      replyToUserId: context.parentComment?.userId || null,
      image: uploadedImage,
    });

    return {
      comment: await finalizeCreatedTripComment({
        createdCommentId: created._id,
        parentComment: context.parentComment,
        trip: context.trip,
        tripId,
        userId,
      }),
    };
  } catch (err) {
    if (uploadedImage?.publicId) {
      await cloudinary.uploader
        .destroy(uploadedImage.publicId, { resource_type: "image" })
        .catch(() => {});
    }

    if (imageFile?.path) {
      await unlink(imageFile.path).catch(() => {});
    }

    throw err;
  }
}

export async function listTripComments({
  tripId,
  viewerId,
  limit = 20,
  cursor: rawCursor,
}) {
  const cursor = decodeCommentCursor(rawCursor);

  const { trip, canView } = await getTripAccessContext({
    tripId,
    viewerId,
  });

  if (!trip || !canView) {
    throw createHttpError(404, "Trip not found");
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
      normalizeCommentPayload(comment, [], {
        replyCount: replyCountMap.get(toIdString(comment?._id)) || 0,
      }),
    )
    .reverse();

  const likedSet = new Set(
    topLevelIds.length
      ? (
          await Reaction.find({
            targetType: "comment",
            userId: viewerId,
            targetId: { $in: topLevelIds },
          })
            .select("targetId")
            .lean()
        ).map((item) => toIdString(item.targetId))
      : [],
  );

  return {
    comments: decorateCommentTreeWithLikes(items, likedSet),
    page: { limit, hasMore, nextCursor },
  };
}

export async function listCommentReplies({ commentId, viewerId }) {
  const rootComment = await Comment.findById(commentId)
    .select("_id targetType targetId")
    .lean();

  if (!rootComment || rootComment.targetType !== "trip") {
    throw createHttpError(404, "Comment not found");
  }

  const { trip, canView } = await getTripAccessContext({
    tripId: rootComment.targetId,
    viewerId,
  });

  if (!trip || !canView) {
    throw createHttpError(404, "Comment not found");
  }

  const subtreeIds = await collectCommentSubtreeIds(commentId);
  const replyIds = subtreeIds.filter((id) => id && id !== toIdString(commentId));

  if (!replyIds.length) {
    return { replies: [] };
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

  return {
    replies: decorateCommentTreeWithLikes(replies, likedSet),
  };
}

export async function getCommentContext({ commentId, viewerId }) {
  const comment = await Comment.findById(commentId)
    .select("_id targetType targetId parentCommentId")
    .lean();

  if (!comment || comment.targetType !== "trip") {
    throw createHttpError(404, "Comment not found");
  }

  const { trip, canView } = await getTripAccessContext({
    tripId: comment.targetId,
    viewerId,
  });

  if (!trip || !canView) {
    throw createHttpError(404, "Comment not found");
  }

  const threadCommentId =
    (await resolveRootCommentId(comment)) || toIdString(comment._id);

  return {
    tripId: toIdString(comment.targetId),
    focusCommentId: toIdString(comment._id),
    threadCommentId,
  };
}

export async function updateComment({ userId, commentId, content }) {
  const existingComment = await Comment.findById(commentId)
    .select("_id userId targetType targetId")
    .lean();

  if (!existingComment || existingComment.targetType !== "trip") {
    throw createHttpError(404, "Comment not found");
  }

  if (toIdString(existingComment.userId) !== toIdString(userId)) {
    throw createHttpError(403, "You can only edit your own comment");
  }

  const { trip, canView } = await getTripAccessContext({
    tripId: existingComment.targetId,
    viewerId: userId,
  });

  if (!trip || !canView) {
    throw createHttpError(404, "Trip not found");
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
    throw createHttpError(404, "Comment not found");
  }

  return {
    comment: normalizeCommentPayload(updatedComment, []),
  };
}

export async function deleteComment({ userId, commentId }) {
  const existingComment = await Comment.findById(commentId)
    .select("_id userId targetType targetId")
    .lean();

  if (!existingComment || existingComment.targetType !== "trip") {
    throw createHttpError(404, "Comment not found");
  }

  if (toIdString(existingComment.userId) !== toIdString(userId)) {
    throw createHttpError(403, "You can only delete your own comment");
  }

  const { trip, canView } = await getTripAccessContext({
    tripId: existingComment.targetId,
    viewerId: userId,
  });

  if (!trip || !canView) {
    throw createHttpError(404, "Trip not found");
  }

  const subtreeIds = await collectCommentSubtreeIds(existingComment._id);
  const deleteCount = subtreeIds.length;

  if (!deleteCount) {
    throw createHttpError(404, "Comment not found");
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

  return {
    deletedCommentId: toIdString(existingComment._id),
    deletedCount: deleteCount,
  };
}
