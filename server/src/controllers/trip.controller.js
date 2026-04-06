import mongoose from "mongoose";
import Trip from "../models/Trip.js";
import Milestone from "../models/Milestone.js";
import TripItem from "../models/TripItem.js";
import { buildTripFeedPreview } from "../utils/buildTripFeedPreview.js";
import { cloudinary } from "../config/cloudinary.js";
import { getTripAccessContext } from "../utils/tripVisibility.js";
import User from "../models/User.js";

function getPermanentPublicId(oldPublicId, userId, tripId) {
  const tempPrefix = `trips/tmp/${userId}/`;

  if (typeof oldPublicId !== "string" || !oldPublicId.startsWith(tempPrefix)) {
    return oldPublicId;
  }

  return oldPublicId.replace(tempPrefix, `trips/${userId}/${tripId}/`);
}

async function moveMediaToPermanentFolder(mediaList = [], userId, tripId) {
  const movedMedia = [];
  const movedPublicIds = [];

  try {
    for (const media of mediaList) {
      if (!media?.publicId) {
        movedMedia.push(media);
        continue;
      }

      const nextPublicId = getPermanentPublicId(media.publicId, userId, tripId);

      if (nextPublicId === media.publicId) {
        movedMedia.push(media);
        continue;
      }

      const resourceType = media.type === "video" ? "video" : "image";

      const result = await cloudinary.uploader.rename(
        media.publicId,
        nextPublicId,
        {
          overwrite: true,
          resource_type: resourceType,
        },
      );

      movedPublicIds.push({
        publicId: result.public_id,
        type: resourceType,
      });

      movedMedia.push({
        ...media,
        publicId: result.public_id,
        url: result.secure_url,
        type: resourceType,
      });
    }

    return {
      movedMedia,
      movedPublicIds,
    };
  } catch (err) {
    await cleanupCloudinaryFiles(movedPublicIds);
    throw err;
  }
}

async function cleanupCloudinaryFiles(files = []) {
  if (!files.length) return;

  await Promise.allSettled(
    files.map((file) =>
      cloudinary.uploader.destroy(file.publicId, {
        resource_type: file.type === "video" ? "video" : "image",
      }),
    ),
  );
}

// Tạo trip mới
export async function createTrip(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  const movedFilesForCleanup = [];

  try {
    const userId = req.user.userId;

    const {
      title,
      caption,
      privacy = "public",
      participantIds = [],
      milestones = [],
      items = [],
    } = req.body;

    const trip = await Trip.create(
      [
        {
          ownerId: userId,
          title,
          caption,
          privacy,
          participantIds,
          coverUrl: "",
          feedPreview: {
            milestoneCount: 0,
            mediaCount: 0,
            imageCount: 0,
            videoCount: 0,
            hasMoreMedia: false,
            previewMedia: [],
          },
        },
      ],
      { session },
    );

    const tripDoc = trip[0];

    // 1) move media từ tmp sang folder thật theo tripId
    const normalizedItems = [];

    for (const it of items) {
      const { movedMedia, movedPublicIds } = await moveMediaToPermanentFolder(
        it.media ?? [],
        userId,
        tripDoc._id.toString(),
      );

      movedFilesForCleanup.push(...movedPublicIds);

      normalizedItems.push({
        ...it,
        media: movedMedia,
      });
    }

    // 2) tạo milestones, map tempId -> real _id
    const tempMap = new Map();

    if (milestones.length > 0) {
      const createdMilestones = await Milestone.insertMany(
        milestones.map((m) => ({
          tripId: tripDoc._id,
          title: m.title,
          time: m.time ?? null,
          order: m.order ?? 0,
        })),
        { session },
      );

      milestones.forEach((m, idx) => {
        tempMap.set(m.tempId, createdMilestones[idx]._id);
      });
    }

    // 3) tạo trip items bằng normalizedItems
    if (normalizedItems.length > 0) {
      await TripItem.insertMany(
        normalizedItems.map((it) => ({
          tripId: tripDoc._id,
          milestoneId: it.milestoneTempId
            ? tempMap.get(it.milestoneTempId)
            : null,
          authorId: userId,
          content: it.content ?? "",
          media: it.media ?? [],
          order: it.order ?? 0,
        })),
        { session },
      );
    }

    // 4) build feed preview từ normalizedItems
    const feedPreview = buildTripFeedPreview(
      {
        milestones,
        items: normalizedItems,
      },
      { maxPreviewMedia: 6 },
    );

    tripDoc.feedPreview = feedPreview;
    tripDoc.coverUrl = feedPreview.previewMedia?.[0]?.url || "";
    await tripDoc.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ tripId: tripDoc._id.toString() });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();

    await cleanupCloudinaryFiles(movedFilesForCleanup);

    next(err);
  }
}

export async function updateTripPrivacy(req, res, next) {
  try {
    const tripId = req.params.id;
    const userId = req.user?.userId;
    const privacy = req.validated?.body?.privacy || req.body?.privacy;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const trip = await Trip.findById(tripId).select(
      "_id ownerId privacy updatedAt",
    );

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.ownerId.toString() !== userId?.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền chỉnh sửa đối tượng của journey này.",
      });
    }

    trip.privacy = privacy;
    await trip.save();

    res.json({
      message: "Trip privacy updated successfully",
      trip: {
        _id: trip._id,
        privacy: trip.privacy,
        updatedAt: trip.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function pinTrip(req, res, next) {
  try {
    const tripId = req.params.id;
    const userId = req.user?.userId;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const [trip, user] = await Promise.all([
      Trip.findById(tripId).select("_id ownerId"),
      User.findById(userId).select("_id pinnedTripId"),
    ]);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (trip.ownerId.toString() !== userId?.toString()) {
      return res.status(403).json({
        message: "Bạn chỉ có thể ghim journey của chính mình.",
      });
    }

    const previousPinnedTripId = user.pinnedTripId?.toString() || "";
    const nextPinnedTripId = trip._id.toString();

    user.pinnedTripId = trip._id;
    await user.save();

    const replacedTripId =
      previousPinnedTripId && previousPinnedTripId !== nextPinnedTripId
        ? previousPinnedTripId
        : null;

    res.json({
      message: replacedTripId
        ? "Pinned trip replaced successfully"
        : "Trip pinned successfully",
      pinnedTripId: nextPinnedTripId,
      replacedTripId,
    });
  } catch (err) {
    next(err);
  }
}

export async function unpinTrip(req, res, next) {
  try {
    const tripId = req.params.id;
    const userId = req.user?.userId;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const [trip, user] = await Promise.all([
      Trip.findById(tripId).select("_id ownerId"),
      User.findById(userId).select("_id pinnedTripId"),
    ]);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (trip.ownerId.toString() !== userId?.toString()) {
      return res.status(403).json({
        message: "Bạn chỉ có thể gỡ ghim journey của chính mình.",
      });
    }

    const currentPinnedTripId = user.pinnedTripId?.toString() || "";
    const targetTripId = trip._id.toString();

    if (currentPinnedTripId === targetTripId) {
      user.pinnedTripId = null;
      await user.save();
    }

    res.json({
      message: "Trip unpinned successfully",
      pinnedTripId: null,
      removedTripId: currentPinnedTripId === targetTripId ? targetTripId : null,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTripDetail(req, res, next) {
  try {
    const { id } = req.params;
    const viewerId = req.user.userId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const { trip, canView } = await getTripAccessContext({
      tripId: id,
      viewerId,
      select:
        "ownerId title caption privacy participantIds coverUrl counts feedPreview createdAt updatedAt",
      populateOwner: true,
    });

    if (!trip || !canView) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const milestones = await Milestone.find({ tripId: id })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const items = await TripItem.find({ tripId: id })
      .sort({ milestoneId: 1, order: 1, createdAt: 1 })
      .lean();

    const generalItems = items.filter((x) => !x.milestoneId);

    const itemsByMilestone = new Map();
    for (const it of items) {
      const key = it.milestoneId ? it.milestoneId.toString() : null;
      if (!key) continue;
      if (!itemsByMilestone.has(key)) itemsByMilestone.set(key, []);
      itemsByMilestone.get(key).push(it);
    }

    res.json({
      trip,
      generalItems,
      milestones: milestones.map((m) => ({
        ...m,
        items: itemsByMilestone.get(m._id.toString()) ?? [],
      })),
    });
  } catch (err) {
    next(err);
  }
}
