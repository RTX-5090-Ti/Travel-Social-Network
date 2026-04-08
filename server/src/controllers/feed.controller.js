import Trip from "../models/Trip.js";
import Follow from "../models/Follow.js";
import HiddenTrip from "../models/HiddenTrip.js";
import Reaction from "../models/Reaction.js";
import SavedTrip from "../models/SavedTrip.js";

const FOLLOWER_VISIBLE_PRIVACIES = ["public", "followers"];

function dedupeAndSortTrips(items, limit) {
  const seen = new Set();
  const unique = [];

  for (const item of items) {
    const id = item?._id?.toString();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(item);
  }

  unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return unique.slice(0, limit);
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
      select: "name email avatarUrl",
      match: { isActive: { $ne: false } },
    })
    .sort({ createdAt: -1 });
}

export async function getFeed(req, res, next) {
  try {
    const userId = req.user?.userId;
    const now = new Date();

    const limitRaw = Number(req.query.limit ?? 20);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 20;

    const ownCount = Math.min(2, limit);

    const follows = await Follow.find({ followerId: userId })
      .select("followingId")
      .lean();

    const followingIds = follows.map((f) => f.followingId);

    const remainingAfterOwn = Math.max(0, limit - ownCount);

    const followingCount = followingIds.length
      ? Math.min(
          remainingAfterOwn,
          Math.max(1, Math.round(remainingAfterOwn * 0.45)),
        )
      : 0;

    const communityCount = Math.max(0, limit - ownCount - followingCount);

    const hiddenDocs = await HiddenTrip.find({
      userId,
      hideExpiresAt: { $gt: now },
    })
      .select("tripId")
      .lean();

    const hiddenTripIds = hiddenDocs.map((item) => item.tripId);

    const [ownTrips, followingTrips, communityTrips] = await Promise.all([
      buildFeedQuery({
        ownerId: userId,
        _id: { $nin: hiddenTripIds },
      })
        .limit(ownCount)
        .lean(),

      followingIds.length
        ? buildFeedQuery({
            ownerId: { $in: followingIds },
            _id: { $nin: hiddenTripIds },
            privacy: { $in: FOLLOWER_VISIBLE_PRIVACIES },
          })
            .limit(followingCount)
            .lean()
        : [],

      buildFeedQuery({
        _id: { $nin: hiddenTripIds },
        privacy: "public",
        ownerId: { $nin: [userId, ...followingIds] },
      })
        .limit(communityCount)
        .lean(),
    ]);

    const items = dedupeAndSortTrips(
      [...ownTrips, ...followingTrips, ...communityTrips].filter(
        (item) => item?.ownerId?._id,
      ),
      limit,
    );

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
      meta: {
        limit,
        includedOwnTrips: ownTrips.length,
        ratio: {
          own: ownCount,
          following: followingCount,
          community: communityCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
