import fs from "fs";
import { unlink } from "fs/promises";
import User from "../models/User.js";
import { cloudinary } from "../config/cloudinary.js";
import Trip from "../models/Trip.js";
import Reaction from "../models/Reaction.js";
import Milestone from "../models/Milestone.js";
import TripItem from "../models/TripItem.js";

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

export async function uploadAvatarController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No avatar uploaded" });
    }

    const userId = req.user?.userId;
    const user = await User.findById(userId).select(
      "_id name email role avatarUrl",
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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || "",
      },
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

export async function getMyTripsController(req, res, next) {
  try {
    const userId = req.user?.userId;

    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 50;

    const trips = await Trip.find({ ownerId: userId })
      .select(
        "ownerId title caption privacy coverUrl counts createdAt feedPreview",
      )
      .populate("ownerId", "name avatarUrl")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const tripIds = trips.map((trip) => trip._id);

    const [myReactions, tripItems, milestones] = await Promise.all([
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

    const items = trips.map((trip) => ({
      ...trip,
      hearted: heartedSet.has(trip._id.toString()),
      profileMedia: mediaByTripId.get(trip._id.toString()) || [],
    }));

    res.json({
      items,
      meta: {
        total: items.length,
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
}
