import Trip from "../models/Trip.js";
import Follow from "../models/Follow.js";
import HiddenTrip from "../models/HiddenTrip.js";
import Reaction from "../models/Reaction.js";
import SavedTrip from "../models/SavedTrip.js";

const FOLLOWER_VISIBLE_PRIVACIES = ["public", "followers"];

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?.toString?.() || "";
}

function encodeFeedCursor(trip) {
  const createdAt =
    trip?.createdAt instanceof Date
      ? trip.createdAt.toISOString()
      : typeof trip?.createdAt === "string"
        ? trip.createdAt
        : "";
  const tripId = toIdString(trip?._id);

  if (!createdAt || !tripId) {
    return null;
  }

  return `${createdAt}__${tripId}`;
}

function decodeFeedCursor(rawCursor) {
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
    id: idRaw,
  };
}

function buildFeedQuery(filter) {
  return Trip.find({
    ...filter,
    deletedAt: null,
  })
    .select(
      "ownerId title caption privacy coverUrl counts createdAt feedPreview",
    )
    .populate({
      path: "ownerId",
      select: "name avatarUrl",
      match: { isActive: { $ne: false } },
    })
    .sort({ createdAt: -1, _id: -1 });
}

export async function getFeed(req, res, next) {
  try {
    const userId = req.user?.userId;
    const now = new Date();

    const limitRaw = Number(req.query.limit ?? 20);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 20;
    const cursor = decodeFeedCursor(req.query.cursor);

    const follows = await Follow.find({ followerId: userId })
      .select("followingId")
      .lean();

    const followingIds = follows.map((f) => f.followingId);

    const hiddenDocs = await HiddenTrip.find({
      userId,
      hideExpiresAt: { $gt: now },
    })
      .select("tripId")
      .lean();

    const hiddenTripIds = hiddenDocs.map((item) => item.tripId);

    const filter = {
      deletedAt: null,
      _id: { $nin: hiddenTripIds },
      $or: [
        { ownerId: userId },
        ...(followingIds.length
          ? [
              {
                ownerId: { $in: followingIds },
                privacy: { $in: FOLLOWER_VISIBLE_PRIVACIES },
              },
            ]
          : []),
        {
          ownerId: { $nin: [userId, ...followingIds] },
          privacy: "public",
        },
      ],
    };

    if (cursor?.createdAt) {
      if (cursor.id) {
        filter.$and = [
          {
            $or: [
              { createdAt: { $lt: cursor.createdAt } },
              {
                createdAt: cursor.createdAt,
                _id: { $lt: cursor.id },
              },
            ],
          },
        ];
      } else {
        filter.createdAt = { $lt: cursor.createdAt };
      }
    }

    const docs = await buildFeedQuery(filter).limit(limit + 1).lean();
    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;

    const items = pageDocs.filter((item) => item?.ownerId?._id);

    const tripIds = items.map((item) => item._id);

    const [myReactions, mySavedTrips] = await Promise.all([
      tripIds.length
        ? Reaction.find({
            targetType: "trip",
            userId,
            targetId: { $in: tripIds },
          })
            .select("targetId")
            .lean()
        : [],
      tripIds.length
        ? SavedTrip.find({
            userId,
            tripId: { $in: tripIds },
          })
            .select("tripId")
            .lean()
        : [],
    ]);

    const heartedSet = new Set(
      myReactions.map((item) => item.targetId.toString()),
    );
    const savedSet = new Set(mySavedTrips.map((item) => item.tripId.toString()));

    const hydratedItems = items.map((item) => ({
      ...item,
      hearted: heartedSet.has(item._id.toString()),
      saved: savedSet.has(item._id.toString()),
    }));

    res.json({
      items: hydratedItems,
      page: {
        limit,
        hasMore,
        nextCursor: pageDocs.length
          ? encodeFeedCursor(pageDocs[pageDocs.length - 1])
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}
