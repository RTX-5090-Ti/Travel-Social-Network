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

function buildUserPayload(user) {
  const payload = {
    _id: user._id,
    id: user._id,
    name: user.name || "Traveler",
    email: user.email || "",
    avatarUrl: user.avatarUrl || "",
    coverUrl: user.coverUrl || "",
    bio: user.bio || "",
    location: user.location || "",
    travelStyle: user.travelStyle || "",
  };

  if (typeof user.role === "string" && user.role) {
    payload.role = user.role;
  }

  return payload;
}

export async function uploadAvatarController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No avatar uploaded" });
    }

    const userId = req.user?.userId;
    const user = await User.findById(userId).select(
      "_id name email role avatarUrl coverUrl bio location travelStyle",
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
      user: buildUserPayload(user),
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

async function buildProfileTrips({ ownerId, viewerId, limit = 50 }) {
  const trips = await Trip.find({ ownerId })
    .select(
      "ownerId title caption privacy coverUrl counts createdAt feedPreview",
    )
    .populate("ownerId", "name email avatarUrl")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const tripIds = trips.map((trip) => trip._id);

  const [myReactions, tripItems, milestones] = await Promise.all([
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
      ? TripItem.find({ tripId: { $in: tripIds } })
          .select("tripId milestoneId media order createdAt")
          .sort({ tripId: 1, milestoneId: 1, order: 1, createdAt: 1 })
          .lean()
      : [],
    tripIds.length
      ? Milestone.find({ tripId: { $in: tripIds } })
          .select("_id title")
          .lean()
      : [],
  ]);

  const heartedSet = new Set(
    myReactions.map((item) => item.targetId.toString()),
  );

  const milestoneTitleMap = new Map(
    milestones.map((milestone) => [
      milestone._id.toString(),
      milestone.title || null,
    ]),
  );

  const mediaByTripId = new Map();
  const seenByTripId = new Map();

  for (const item of tripItems) {
    const tripKey = item?.tripId?.toString?.();
    if (!tripKey) continue;

    if (!mediaByTripId.has(tripKey)) {
      mediaByTripId.set(tripKey, []);
    }

    if (!seenByTripId.has(tripKey)) {
      seenByTripId.set(tripKey, new Set());
    }

    const tripMedia = mediaByTripId.get(tripKey);
    const tripSeen = seenByTripId.get(tripKey);

    for (const media of item.media || []) {
      const url = safeUrl(media?.url);
      if (!url) continue;
      if (tripSeen.has(url)) continue;

      tripSeen.add(url);

      tripMedia.push({
        url,
        type: normalizeMediaType(media?.type),
        width: media?.width ?? null,
        height: media?.height ?? null,
        duration: media?.duration ?? null,
        milestoneTitle: item?.milestoneId
          ? milestoneTitleMap.get(item.milestoneId.toString()) || null
          : null,
      });
    }
  }

  return trips.map((trip) => ({
    ...trip,
    hearted: heartedSet.has(trip._id.toString()),
    profileMedia: mediaByTripId.get(trip._id.toString()) || [],
  }));
}

export async function getMyTripsController(req, res, next) {
  try {
    const userId = req.user?.userId;

    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 50;

    const [items, total] = await Promise.all([
      buildProfileTrips({
        ownerId: userId,
        viewerId: userId,
        limit,
      }),
      Trip.countDocuments({ ownerId: userId }),
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

    const profileUser = await User.findById(profileUserId)
      .select("_id name email avatarUrl coverUrl  bio location travelStyle")
      .lean();

    if (!profileUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const [trips, followDoc, followersCount, followingCount, totalTrips] =
      await Promise.all([
        buildProfileTrips({
          ownerId: profileUserId,
          viewerId,
          limit,
        }),
        viewerId && viewerId !== profileUserId
          ? Follow.findOne({
              followerId: viewerId,
              followingId: profileUserId,
            })
              .select("_id")
              .lean()
          : null,
        Follow.countDocuments({ followingId: profileUserId }),
        Follow.countDocuments({ followerId: profileUserId }),
        Trip.countDocuments({ ownerId: profileUserId }),
      ]);

    res.json({
      user: buildUserPayload(profileUser),
      trips,
      follow: {
        followed: !!followDoc,
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

    const [profileUser, followDoc, followersCount, followingCount, postsCount] =
      await Promise.all([
        User.findById(profileUserId)
          .select("_id name email avatarUrl coverUrl bio location travelStyle")
          .lean(),
        viewerId && viewerId !== profileUserId
          ? Follow.findOne({
              followerId: viewerId,
              followingId: profileUserId,
            })
              .select("_id")
              .lean()
          : null,
        Follow.countDocuments({ followingId: profileUserId }),
        Follow.countDocuments({ followerId: profileUserId }),
        Trip.countDocuments({ ownerId: profileUserId }),
      ]);

    if (!profileUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: buildUserPayload(profileUser),
      follow: {
        followed: !!followDoc,
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
        new: true,
        runValidators: true,
      },
    ).select("_id name email role avatarUrl coverUrl bio location travelStyle");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: buildUserPayload(user),
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
      "_id name email role avatarUrl coverUrl bio location travelStyle",
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
      user: buildUserPayload(user),
    });
  } catch (err) {
    next(err);
  }
}
