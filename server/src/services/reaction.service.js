import Comment from "../models/Comment.js";
import Reaction from "../models/Reaction.js";
import Trip from "../models/Trip.js";
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

export async function toggleTripHeart({ userId, tripId }) {
  try {
    const { trip, canView } = await getTripAccessContext({
      tripId,
      viewerId: userId,
      select: "_id ownerId privacy counts.reactions",
    });

    if (!trip || !canView) {
      throw createHttpError(404, "Trip not found");
    }

    const existed = await Reaction.findOne({
      targetType: "trip",
      targetId: tripId,
      userId,
    })
      .select("_id")
      .lean();

    let hearted = false;

    if (existed) {
      await Reaction.deleteOne({ _id: existed._id });
      await Trip.updateOne({ _id: tripId }, { $inc: { "counts.reactions": -1 } });
      hearted = false;
    } else {
      await Reaction.create({
        targetType: "trip",
        targetId: tripId,
        userId,
      });

      await Trip.updateOne({ _id: tripId }, { $inc: { "counts.reactions": 1 } });
      hearted = true;

      await createNotification({
        recipientUserId: trip.ownerId,
        actorUserId: userId,
        type: "trip_like",
        tripId,
      });
    }

    const latestTrip = await Trip.findById(tripId).select("counts.reactions").lean();

    return {
      hearted,
      count: Math.max(0, latestTrip?.counts?.reactions || 0),
    };
  } catch (err) {
    if (err?.code === 11000) {
      try {
        const [accessContext, mine] = await Promise.all([
          getTripAccessContext({
            tripId,
            viewerId: userId,
            select: "_id ownerId privacy counts.reactions",
          }),
          Reaction.findOne({
            targetType: "trip",
            targetId: tripId,
            userId,
          })
            .select("_id")
            .lean(),
        ]);

        if (!accessContext.trip || !accessContext.canView) {
          throw createHttpError(404, "Trip not found");
        }

        return {
          hearted: !!mine,
          count: Math.max(0, accessContext.trip?.counts?.reactions || 0),
        };
      } catch (fallbackError) {
        if (fallbackError?.status) {
          throw fallbackError;
        }
        throw createHttpError(409, "Duplicate reaction");
      }
    }

    throw err;
  }
}

export async function getTripHeartSummary({ userId, tripId }) {
  const { trip, canView } = await getTripAccessContext({
    tripId,
    viewerId: userId,
    select: "_id ownerId privacy counts.reactions",
  });

  if (!trip || !canView) {
    throw createHttpError(404, "Trip not found");
  }

  let hearted = false;
  if (userId) {
    const mine = await Reaction.findOne({
      targetType: "trip",
      targetId: tripId,
      userId,
    })
      .select("_id")
      .lean();

    hearted = !!mine;
  }

  return {
    count: trip.counts?.reactions || 0,
    hearted,
  };
}

export async function toggleCommentLike({ userId, commentId }) {
  try {
    const comment = await Comment.findById(commentId)
      .select("_id userId parentCommentId targetType targetId counts.reactions")
      .lean();

    if (!comment || comment.targetType !== "trip") {
      throw createHttpError(404, "Comment not found");
    }

    const { trip, canView } = await getTripAccessContext({
      tripId: comment.targetId,
      viewerId: userId,
      select: "_id ownerId privacy",
    });

    if (!trip || !canView) {
      throw createHttpError(404, "Comment not found");
    }

    const existed = await Reaction.findOne({
      targetType: "comment",
      targetId: commentId,
      userId,
    })
      .select("_id")
      .lean();

    let liked = false;

    if (existed) {
      await Reaction.deleteOne({ _id: existed._id });
      await Comment.updateOne(
        { _id: commentId },
        { $inc: { "counts.reactions": -1 } },
      );
      liked = false;
    } else {
      await Reaction.create({
        targetType: "comment",
        targetId: commentId,
        userId,
      });

      await Comment.updateOne(
        { _id: commentId },
        { $inc: { "counts.reactions": 1 } },
      );
      liked = true;

      await createNotification({
        recipientUserId: comment.userId,
        actorUserId: userId,
        type: "comment_like",
        tripId: comment.targetId,
        commentId,
        payload: {
          focusCommentId: toIdString(commentId),
          threadCommentId:
            (await resolveRootCommentId(comment)) || toIdString(commentId),
        },
      });
    }

    const latestComment = await Comment.findById(commentId)
      .select("counts.reactions")
      .lean();

    return {
      liked,
      count: Math.max(0, latestComment?.counts?.reactions || 0),
    };
  } catch (err) {
    if (err?.code === 11000) {
      try {
        const [comment, mine] = await Promise.all([
          Comment.findById(commentId).select("counts.reactions").lean(),
          Reaction.findOne({
            targetType: "comment",
            targetId: commentId,
            userId,
          })
            .select("_id")
            .lean(),
        ]);

        if (!comment) {
          throw createHttpError(404, "Comment not found");
        }

        return {
          liked: !!mine,
          count: Math.max(0, comment?.counts?.reactions || 0),
        };
      } catch (fallbackError) {
        if (fallbackError?.status) {
          throw fallbackError;
        }
        throw createHttpError(409, "Duplicate reaction");
      }
    }

    throw err;
  }
}
