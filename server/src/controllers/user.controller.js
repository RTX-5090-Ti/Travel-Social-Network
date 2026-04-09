import fs from "fs";
import { unlink } from "fs/promises";
import mongoose from "mongoose";

import User from "../models/User.js";
import { cloudinary } from "../config/cloudinary.js";
import Trip from "../models/Trip.js";
import Reaction from "../models/Reaction.js";
import Milestone from "../models/Milestone.js";
import TripItem from "../models/TripItem.js";
import Follow from "../models/Follow.js";
import SavedTrip from "../models/SavedTrip.js";
import { buildOwnerTripVisibilityFilter } from "../utils/tripVisibility.js";

function uploadFilePathToCloudinary(filePath, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );

    const readStream = fs.createReadStream(filePath);
    readStream.on("error", reject);
    readStream.pipe(uploadStream);
  });
}

function normalizeProfileValue(value = "") {
  return typeof value === "string" ? value.trim() : "";
}

function buildUserPayload(
  user,
  { includeEmail = false, includeRole = false } = {},
) {
  const payload = {
    _id: user._id,
    id: user._id,
    name: user.name || "Traveler",
    avatarUrl: user.avatarUrl || "",
    coverUrl: user.coverUrl || "",
    bio: user.bio || "",
    location: user.location || "",
    travelStyle: user.travelStyle || "",
    pinnedTripId: user.pinnedTripId || null,
  };

  if (includeEmail) {
    payload.email = user.email || "";
  }

  if (includeRole && typeof user.role === "string" && user.role) {
    payload.role = user.role;
  }

  return payload;
}

async function resolveVisiblePinnedTripId({
  ownerId,
  viewerId,
  isFollowingOwner = false,
  pinnedTripId,
}) {
  const normalizedPinnedTripId =
    typeof pinnedTripId === "string"
      ? pinnedTripId
      : pinnedTripId?._id?.toString?.() || pinnedTripId?.toString?.() || "";

  if (!normalizedPinnedTripId) {
    return null;
  }

  if (!mongoose.isValidObjectId(normalizedPinnedTripId)) {
    return null;
  }

  const exists = await Trip.exists({
    _id: normalizedPinnedTripId,
    ...buildOwnerTripVisibilityFilter({
      ownerId,
      viewerId,
      isFollowingOwner,
    }),
  });

  return exists ? normalizedPinnedTripId : null;
}

async function countActiveFollowRelations({ matchField, targetUserId, joinField }) {
  const results = await Follow.aggregate([
    {
      $match: {
        [matchField]: new mongoose.Types.ObjectId(targetUserId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: joinField,
        foreignField: "_id",
        as: "relatedUser",
      },
    },
    { $unwind: "$relatedUser" },
    { $match: { "relatedUser.isActive": { $ne: false } } },
    { $count: "total" },
  ]);

  return results[0]?.total || 0;
}

export async function uploadAvatarController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No avatar uploaded" });
    }

    const userId = req.user?.userId;
    const user = await User.findById(userId).select(
      "_id name email role avatarUrl coverUrl bio location travelStyle pinnedTripId",
    );

    if (!user) {
      await unlink(req.file.path).catch(() => {});
      res.status(404);
      throw new Error("User not found");
    }

    let result;

    try {
      result = await uploadFilePathToCloudinary(req.file.path, {
        folder: `avatars/${userId}`,
        public_id: "avatar",
        overwrite: true,
        invalidate: true,
        resource_type: "image",
      });
    } finally {
      await unlink(req.file.path).catch(() => {});
    }

    user.avatarUrl = result?.secure_url || "";
    await user.save();

    res.json({
      message: "Avatar updated successfully",
      user: buildUserPayload(user, { includeEmail: true, includeRole: true }),
    });
  } catch (err) {
    next(err);
  }
}

function normalizeMediaType(type) {
  return type === "video" ? "video" : "image";
}

function safeUrl(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function buildProfileTrips({
  ownerId,
  viewerId,
  isFollowingOwner = false,
  limit = 50,
}) {
  const visibilityFilter = buildOwnerTripVisibilityFilter({
    ownerId,
    viewerId,
    isFollowingOwner,
  });

  const trips = await Trip.find(visibilityFilter)
    .select(
      "ownerId title caption privacy coverUrl counts createdAt feedPreview",
    )
    .populate({
      path: "ownerId",
      select: "name avatarUrl",
      match: { isActive: { $ne: false } },
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const tripIds = trips.map((trip) => trip._id);

  const [myReactions, mySavedTrips] = await Promise.all([
    tripIds.length
      ? Reaction.find({
          targetType: "trip",
          userId: viewerId,
          targetId: { $in: tripIds },
        })
          .select("targetId")
          .lean()
      : [],
    tripIds.length
      ? SavedTrip.find({
          userId: viewerId,
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

  return trips
    .filter((trip) => trip?.ownerId?._id)
    .map((trip) => ({
      ...trip,
      hearted: heartedSet.has(trip._id.toString()),
      saved: savedSet.has(trip._id.toString()),
    }));
}

async function buildProfileMediaItems({
  ownerId,
  viewerId,
  isFollowingOwner = false,
  limit = null,
}) {
  const visibilityFilter = buildOwnerTripVisibilityFilter({
    ownerId,
    viewerId,
    isFollowingOwner,
  });

  const trips = await Trip.find(visibilityFilter)
    .select("_id title privacy createdAt")
    .sort({ createdAt: -1 })
    .lean();

  if (!trips.length) {
    return [];
  }

  const tripIds = trips.map((trip) => trip._id);
  const tripItems = await TripItem.find({ tripId: { $in: tripIds } })
    .select("tripId milestoneId media order createdAt")
    .sort({ createdAt: -1, order: 1, _id: -1 })
    .lean();

  if (!tripItems.length) {
    return [];
  }

  const milestoneIds = [
    ...new Set(
      tripItems
        .map((item) => item?.milestoneId?.toString?.())
        .filter(Boolean),
    ),
  ];

  const milestones = milestoneIds.length
    ? await Milestone.find({ _id: { $in: milestoneIds } })
        .select("_id title")
        .lean()
    : [];

  const milestoneTitleMap = new Map(
    milestones.map((milestone) => [
      milestone._id.toString(),
      milestone.title || null,
    ]),
  );

  const tripItemsByTripId = new Map();

  tripItems.forEach((item) => {
    const tripKey = item?.tripId?.toString?.();
    if (!tripKey) return;

    if (!tripItemsByTripId.has(tripKey)) {
      tripItemsByTripId.set(tripKey, []);
    }

    tripItemsByTripId.get(tripKey).push(item);
  });

  const output = [];
  const seen = new Set();
  const shouldLimit = Number.isFinite(limit) && limit > 0;

  for (const trip of trips) {
    const tripKey = trip?._id?.toString?.();
    if (!tripKey) continue;

    const tripMediaItems = tripItemsByTripId.get(tripKey) || [];

    for (const item of tripMediaItems) {
      for (const media of item.media || []) {
        const url = safeUrl(media?.url);
        if (!url) continue;

        const mediaId = `${tripKey}:${url}`;
        if (seen.has(mediaId)) continue;

        seen.add(mediaId);
        output.push({
          id: mediaId,
          url,
          type: normalizeMediaType(media?.type),
          tripId: tripKey,
          tripTitle: trip?.title || "Untitled journey",
          privacy: trip?.privacy || "public",
          createdAt: item?.createdAt || trip?.createdAt || null,
          milestoneTitle: item?.milestoneId
            ? milestoneTitleMap.get(item.milestoneId.toString()) || null
            : null,
        });

        if (shouldLimit && output.length >= limit) {
          return output;
        }
      }
    }
  }

  return output;
}

export async function getMyTripsController(req, res, next) {
  try {
    const userId = req.user?.userId;

    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 50;

    const visibilityFilter = buildOwnerTripVisibilityFilter({
      ownerId: userId,
      viewerId: userId,
      isFollowingOwner: false,
    });

    const [items, total] = await Promise.all([
      buildProfileTrips({
        ownerId: userId,
        viewerId: userId,
        isFollowingOwner: false,
        limit,
      }),
      Trip.countDocuments(visibilityFilter),
    ]);

    res.json({
      items,
      meta: {
        total,
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserProfileController(req, res, next) {
  try {
    const viewerId = req.user?.userId;
    const profileUserId = req.params.id;

    if (!mongoose.isValidObjectId(profileUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 50;

    const [profileUser, followDoc, followersCount, followingCount] =
      await Promise.all([
        User.findById(profileUserId)
          .select(
            "_id name email avatarUrl coverUrl bio location travelStyle pinnedTripId isActive",
          )
          .lean(),
        viewerId && viewerId !== profileUserId
          ? Follow.findOne({
              followerId: viewerId,
              followingId: profileUserId,
            })
              .select("_id")
              .lean()
          : null,
        countActiveFollowRelations({
          matchField: "followingId",
          targetUserId: profileUserId,
          joinField: "followerId",
        }),
        countActiveFollowRelations({
          matchField: "followerId",
          targetUserId: profileUserId,
          joinField: "followingId",
        }),
      ]);

    if (!profileUser || profileUser.isActive === false) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowingOwner = !!followDoc;

    const visibilityFilter = buildOwnerTripVisibilityFilter({
      ownerId: profileUserId,
      viewerId,
      isFollowingOwner,
    });

    const [trips, totalTrips, visiblePinnedTripId] = await Promise.all([
      buildProfileTrips({
        ownerId: profileUserId,
        viewerId,
        isFollowingOwner,
        limit,
      }),
      Trip.countDocuments(visibilityFilter),
      resolveVisiblePinnedTripId({
        ownerId: profileUserId,
        viewerId,
        isFollowingOwner,
        pinnedTripId: profileUser?.pinnedTripId,
      }),
    ]);

    const profileUserPayload = buildUserPayload(
      {
        ...profileUser,
        pinnedTripId: visiblePinnedTripId,
      },
      { includeEmail: true },
    );

    res.json({
      user: profileUserPayload,
      trips,
      follow: {
        followed: isFollowingOwner,
        followersCount,
        followingCount,
      },
      meta: {
        totalTrips,
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserSummaryController(req, res, next) {
  try {
    const viewerId = req.user?.userId;
    const profileUserId = req.params.id;

    if (!mongoose.isValidObjectId(profileUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const [profileUser, followDoc, followersCount, followingCount] =
      await Promise.all([
        User.findById(profileUserId)
          .select(
            "_id name email avatarUrl coverUrl bio location travelStyle pinnedTripId isActive",
          )
          .lean(),
        viewerId && viewerId !== profileUserId
          ? Follow.findOne({
              followerId: viewerId,
              followingId: profileUserId,
            })
              .select("_id")
              .lean()
          : null,
        countActiveFollowRelations({
          matchField: "followingId",
          targetUserId: profileUserId,
          joinField: "followerId",
        }),
        countActiveFollowRelations({
          matchField: "followerId",
          targetUserId: profileUserId,
          joinField: "followingId",
        }),
      ]);

    if (!profileUser || profileUser.isActive === false) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowingOwner = !!followDoc;

    const [postsCount, visiblePinnedTripId] = await Promise.all([
      Trip.countDocuments(
        buildOwnerTripVisibilityFilter({
          ownerId: profileUserId,
          viewerId,
          isFollowingOwner,
        }),
      ),
      resolveVisiblePinnedTripId({
        ownerId: profileUserId,
        viewerId,
        isFollowingOwner,
        pinnedTripId: profileUser?.pinnedTripId,
      }),
    ]);

    const profileUserPayload = buildUserPayload(
      {
        ...profileUser,
        pinnedTripId: visiblePinnedTripId,
      },
      { includeEmail: true },
    );

    res.json({
      user: profileUserPayload,
      follow: {
        followed: isFollowingOwner,
        followersCount,
        followingCount,
      },
      stats: {
        postsCount,
        followersCount,
        followingCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserProfileMediaController(req, res, next) {
  try {
    const viewerId = req.user?.userId;
    const profileUserId = req.params.id;

    if (!mongoose.isValidObjectId(profileUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const limitRaw = Number(req.query.limit ?? 0);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.max(limitRaw, 1), 200)
        : null;

    const [profileUser, followDoc] = await Promise.all([
      User.findById(profileUserId).select("_id isActive").lean(),
      viewerId && viewerId !== profileUserId
        ? Follow.findOne({
            followerId: viewerId,
            followingId: profileUserId,
          })
            .select("_id")
            .lean()
        : null,
    ]);

    if (!profileUser || profileUser.isActive === false) {
      return res.status(404).json({ message: "User not found" });
    }

    const items = await buildProfileMediaItems({
      ownerId: profileUserId,
      viewerId,
      isFollowingOwner: !!followDoc,
      limit,
    });

    res.json({
      items,
      meta: {
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfileController(req, res, next) {
  try {
    const userId = req.user?.userId;
    const body = req.validated?.body ?? req.body ?? {};

    const updateData = {};

    if (Object.prototype.hasOwnProperty.call(body, "name")) {
      updateData.name = normalizeProfileValue(body.name);
    }

    if (Object.prototype.hasOwnProperty.call(body, "bio")) {
      updateData.bio = normalizeProfileValue(body.bio);
    }

    if (Object.prototype.hasOwnProperty.call(body, "location")) {
      updateData.location = normalizeProfileValue(body.location);
    }

    if (Object.prototype.hasOwnProperty.call(body, "travelStyle")) {
      updateData.travelStyle = normalizeProfileValue(body.travelStyle);
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ message: "No profile fields provided" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).select(
      "_id name email role avatarUrl coverUrl bio location travelStyle pinnedTripId",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: buildUserPayload(user, { includeEmail: true, includeRole: true }),
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadCoverController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No cover uploaded" });
    }

    const userId = req.user?.userId;
    const user = await User.findById(userId).select(
      "_id name email role avatarUrl coverUrl bio location travelStyle pinnedTripId",
    );

    if (!user) {
      await unlink(req.file.path).catch(() => {});
      res.status(404);
      throw new Error("User not found");
    }

    let result;

    try {
      result = await uploadFilePathToCloudinary(req.file.path, {
        folder: `covers/${userId}`,
        public_id: "profile-cover",
        overwrite: true,
        invalidate: true,
        resource_type: "image",
      });
    } finally {
      await unlink(req.file.path).catch(() => {});
    }

    user.coverUrl = result?.secure_url || "";
    await user.save();

    res.json({
      message: "Cover updated successfully",
      user: buildUserPayload(user, { includeEmail: true, includeRole: true }),
    });
  } catch (err) {
    next(err);
  }
}
