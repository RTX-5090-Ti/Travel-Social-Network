import Trip from "../models/Trip.js";
import Follow from "../models/Follow.js";
import HiddenTrip from "../models/HiddenTrip.js";
import Reaction from "../models/Reaction.js";
import SavedTrip from "../models/SavedTrip.js";

const FOLLOWER_VISIBLE_PRIVACIES = ["public", "followers"];
export const FEED_MODE = {
  TRENDING: "trending",
  LATEST: "latest",
};
const TRENDING_WINDOW_DAYS = 7;
export const TRENDING_PHASE = {
  RECENT: "recent",
  FALLBACK: "fallback",
};

export function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?.toString?.() || "";
}

export function encodeLatestCursor(trip) {
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

  return `latest__${createdAt}__${tripId}`;
}

export function encodeTrendingCursor(
  trip,
  phase = TRENDING_PHASE.RECENT,
) {
  const createdAt =
    trip?.createdAt instanceof Date
      ? trip.createdAt.toISOString()
      : typeof trip?.createdAt === "string"
        ? trip.createdAt
        : "";
  const tripId = toIdString(trip?._id);
  const trendScore = Number(trip?.trendScore ?? 0);

  if (!createdAt || !tripId) {
    return null;
  }

  if (phase === TRENDING_PHASE.FALLBACK) {
    return `trending__${TRENDING_PHASE.FALLBACK}__${createdAt}__${tripId}`;
  }

  return `trending__${TRENDING_PHASE.RECENT}__${trendScore}__${createdAt}__${tripId}`;
}

export function decodeFeedCursor(rawCursor, mode = FEED_MODE.TRENDING) {
  if (typeof rawCursor !== "string" || !rawCursor.trim()) {
    return null;
  }

  const trimmedCursor = rawCursor.trim();
  const parts = trimmedCursor.split("__");

  if (parts[0] === FEED_MODE.LATEST && parts.length >= 3) {
    const createdAt = new Date(parts[1]);
    if (Number.isNaN(createdAt.getTime())) return null;
    return {
      mode: FEED_MODE.LATEST,
      createdAt,
      id: parts[2],
    };
  }

  if (
    parts[0] === FEED_MODE.TRENDING &&
    parts[1] === TRENDING_PHASE.FALLBACK &&
    parts.length >= 4
  ) {
    const createdAt = new Date(parts[2]);

    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }

    return {
      mode: FEED_MODE.TRENDING,
      phase: TRENDING_PHASE.FALLBACK,
      createdAt,
      id: parts[3],
    };
  }

  if (
    parts[0] === FEED_MODE.TRENDING &&
    parts[1] === TRENDING_PHASE.RECENT &&
    parts.length >= 5
  ) {
    const createdAt = new Date(parts[3]);
    const trendScore = Number(parts[2]);

    if (Number.isNaN(createdAt.getTime()) || !Number.isFinite(trendScore)) {
      return null;
    }

    return {
      mode: FEED_MODE.TRENDING,
      phase: TRENDING_PHASE.RECENT,
      trendScore,
      createdAt,
      id: parts[4],
    };
  }

  const separatorIndex = trimmedCursor.lastIndexOf("__");
  if (separatorIndex === -1) {
    const legacyDate = new Date(trimmedCursor);
    return Number.isNaN(legacyDate.getTime())
      ? null
      : {
          mode,
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
    mode,
    createdAt,
    id: idRaw,
  };
}

export function buildBaseFeedFilter({ userId, followingIds, hiddenTripIds }) {
  return {
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
}

function buildLatestFeedQuery(filter) {
  return Trip.find({
    ...filter,
    deletedAt: null,
  })
    .select(
      "ownerId title caption privacy coverUrl counts createdAt feedPreview",
    )
    .populate({
      path: "ownerId",
      select: "name email avatarUrl",
      match: { isActive: { $ne: false } },
    })
    .sort({ createdAt: -1, _id: -1 });
}

async function loadLatestFeed({ filter, limit }) {
  const docs = await buildLatestFeedQuery(filter).limit(limit + 1).lean();
  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;

  return {
    items: pageDocs.filter((item) => item?.ownerId?._id),
    hasMore,
    nextCursor: pageDocs.length
      ? encodeLatestCursor(pageDocs[pageDocs.length - 1])
      : null,
  };
}

export function buildLatestCursorFilter(cursor) {
  if (!cursor?.createdAt) {
    return {};
  }

  if (cursor.id) {
    return {
      $or: [
        { createdAt: { $lt: cursor.createdAt } },
        {
          createdAt: cursor.createdAt,
          _id: { $lt: cursor.id },
        },
      ],
    };
  }

  return {
    createdAt: { $lt: cursor.createdAt },
  };
}

async function loadTrendingFeed({ filter, limit, cursor }) {
  const trendingWindowStart = new Date(
    Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  if (cursor?.phase === TRENDING_PHASE.FALLBACK) {
    const fallbackFilter = {
      ...filter,
      createdAt: { $lt: trendingWindowStart },
      ...buildLatestCursorFilter(cursor),
    };

    const fallbackPage = await loadLatestFeed({
      filter: fallbackFilter,
      limit,
    });

    return {
      items: fallbackPage.items,
      hasMore: fallbackPage.hasMore,
      nextCursor: fallbackPage.nextCursor
        ? encodeTrendingCursor(
            fallbackPage.items[fallbackPage.items.length - 1],
            TRENDING_PHASE.FALLBACK,
          )
        : null,
    };
  }

  const matchStage = {
    ...filter,
    deletedAt: null,
    createdAt: { $gte: trendingWindowStart },
  };

  if (cursor?.createdAt && Number.isFinite(cursor?.trendScore)) {
    matchStage.$and = [
      {
        $or: [
          {
            $expr: {
              $lt: [
                {
                  $add: [
                    "$counts.reactions",
                    { $multiply: ["$counts.comments", 2] },
                  ],
                },
                cursor.trendScore,
              ],
            },
          },
          {
            $expr: {
              $and: [
                {
                  $eq: [
                    {
                      $add: [
                        "$counts.reactions",
                        { $multiply: ["$counts.comments", 2] },
                      ],
                    },
                    cursor.trendScore,
                  ],
                },
                { $lt: ["$createdAt", cursor.createdAt] },
              ],
            },
          },
          {
            $expr: {
              $and: [
                {
                  $eq: [
                    {
                      $add: [
                        "$counts.reactions",
                        { $multiply: ["$counts.comments", 2] },
                      ],
                    },
                    cursor.trendScore,
                  ],
                },
                { $eq: ["$createdAt", cursor.createdAt] },
                { $lt: [{ $toString: "$_id" }, cursor.id || ""] },
              ],
            },
          },
        ],
      },
    ];
  }

  const docs = await Trip.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        let: { ownerId: "$ownerId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$ownerId"] },
              isActive: { $ne: false },
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              avatarUrl: 1,
            },
          },
        ],
        as: "owner",
      },
    },
    {
      $addFields: {
        ownerId: { $arrayElemAt: ["$owner", 0] },
      },
    },
    {
      $match: {
        ownerId: { $ne: null },
      },
    },
    {
      $addFields: {
        trendScore: {
          $add: [
            "$counts.reactions",
            { $multiply: ["$counts.comments", 2] },
          ],
        },
      },
    },
    { $sort: { trendScore: -1, createdAt: -1, _id: -1 } },
    { $limit: limit + 1 },
    {
      $project: {
        title: 1,
        caption: 1,
        privacy: 1,
        coverUrl: 1,
        counts: 1,
        createdAt: 1,
        feedPreview: 1,
        ownerId: 1,
        trendScore: 1,
      },
    },
  ]);

  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;

  if (pageDocs.length === limit || hasMore) {
    return {
      items: pageDocs,
      hasMore,
      nextCursor: pageDocs.length
        ? encodeTrendingCursor(pageDocs[pageDocs.length - 1])
        : null,
    };
  }

  const remainingSlots = limit - pageDocs.length;
  const fallbackPage = await loadLatestFeed({
    filter: {
      ...filter,
      createdAt: { $lt: trendingWindowStart },
    },
    limit: remainingSlots,
  });

  const combinedItems = [...pageDocs, ...fallbackPage.items];

  return {
    items: combinedItems,
    hasMore: fallbackPage.hasMore,
    nextCursor: fallbackPage.items.length
      ? encodeTrendingCursor(
          fallbackPage.items[fallbackPage.items.length - 1],
          TRENDING_PHASE.FALLBACK,
        )
      : null,
  };
}

export async function getFeedForUser({
  userId,
  limit = 20,
  mode = FEED_MODE.TRENDING,
  cursor: rawCursor = null,
  now = new Date(),
}) {
  const cursor = decodeFeedCursor(rawCursor, mode);

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

  const filter = buildBaseFeedFilter({
    userId,
    followingIds,
    hiddenTripIds,
  });

  if (mode === FEED_MODE.LATEST && cursor?.createdAt) {
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

  const feedPage =
    mode === FEED_MODE.LATEST
      ? await loadLatestFeed({ filter, limit })
      : await loadTrendingFeed({ filter, limit, cursor });

  const items = feedPage.items;
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

  return {
    items: hydratedItems,
    page: {
      limit,
      mode,
      hasMore: feedPage.hasMore,
      nextCursor: feedPage.nextCursor,
    },
  };
}

export const __testables = {
  FEED_MODE,
  TRENDING_PHASE,
  toIdString,
  encodeLatestCursor,
  encodeTrendingCursor,
  decodeFeedCursor,
  buildBaseFeedFilter,
  buildLatestCursorFilter,
};
