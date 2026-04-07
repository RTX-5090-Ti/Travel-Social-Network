import mongoose from "mongoose";
import Trip from "../models/Trip.js";
import Milestone from "../models/Milestone.js";
import TripItem from "../models/TripItem.js";
import Follow from "../models/Follow.js";
import Reaction from "../models/Reaction.js";
import SavedTrip from "../models/SavedTrip.js";
import { buildTripFeedPreview } from "../utils/buildTripFeedPreview.js";
import { cloudinary } from "../config/cloudinary.js";
import {
  canViewerAccessTrip,
  getTripAccessContext,
} from "../utils/tripVisibility.js";
import User from "../models/User.js";
import { buildTripDeletionSchedule } from "../services/tripTrashCleanup.service.js";

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

function getTripOwnerId(trip) {
  if (!trip?.ownerId) return "";

  if (typeof trip.ownerId === "string") {
    return trip.ownerId;
  }

  return trip.ownerId?._id?.toString?.() || trip.ownerId.toString();
}

function buildUnavailableSavedTripItem(savedDoc) {
  return {
    _id: savedDoc?.tripId?.toString?.() || "",
    tripId: savedDoc?.tripId?.toString?.() || "",
    saved: true,
    unavailable: true,
    savedAt: savedDoc?.createdAt || null,
  };
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

export async function saveTrip(req, res, next) {
  try {
    const tripId = req.params.id;
    const userId = req.user?.userId;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const { trip, canView } = await getTripAccessContext({
      tripId,
      viewerId: userId,
      select: "_id ownerId privacy deletedAt",
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (!canView) {
      return res.status(403).json({
        message: "Bạn không có quyền lưu journey này.",
      });
    }

    const existing = await SavedTrip.findOne({
      userId,
      tripId,
    })
      .select("_id")
      .lean();

    if (!existing) {
      await SavedTrip.create({
        userId,
        tripId,
      });
    }

    res.json({
      message: "Trip saved successfully",
      tripId,
      saved: true,
    });
  } catch (err) {
    next(err);
  }
}

export async function unsaveTrip(req, res, next) {
  try {
    const tripId = req.params.id;
    const userId = req.user?.userId;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    await SavedTrip.deleteOne({
      userId,
      tripId,
    });

    res.json({
      message: "Trip unsaved successfully",
      tripId,
      saved: false,
    });
  } catch (err) {
    next(err);
  }
}

export async function moveTripToTrash(req, res, next) {
  try {
    const tripId = req.params.id;
    const userId = req.user?.userId;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const [trip, user] = await Promise.all([
      Trip.findById(tripId).select("_id ownerId title deletedAt"),
      User.findById(userId).select("_id pinnedTripId"),
    ]);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.ownerId.toString() !== userId?.toString()) {
      return res.status(403).json({
        message: "Ban chi co the dua journey cua chinh minh vao thung rac.",
      });
    }

    if (!trip.deletedAt) {
      const deletedAt = new Date();
      trip.deletedAt = deletedAt;
      trip.scheduledDeletionAt = buildTripDeletionSchedule(deletedAt);
      trip.deletionProcessingAt = null;
      trip.deletionAttempts = 0;
      await trip.save();
    }

    const removedPinnedTripId =
      user?.pinnedTripId?.toString() === trip._id.toString()
        ? trip._id.toString()
        : null;

    if (user && removedPinnedTripId) {
      user.pinnedTripId = null;
      await user.save();
    }

    res.json({
      message: "Trip moved to trash successfully",
      trip: {
        _id: trip._id,
        title: trip.title || "Untitled journey",
        deletedAt: trip.deletedAt,
        scheduledDeletionAt: trip.scheduledDeletionAt,
      },
      removedPinnedTripId,
    });
  } catch (err) {
    next(err);
  }
}

export async function restoreTripFromTrash(req, res, next) {
  try {
    const tripId = req.params.id;
    const userId = req.user?.userId;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const trip = await Trip.findById(tripId).select(
      "_id ownerId title caption deletedAt",
    );

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.ownerId.toString() !== userId?.toString()) {
      return res.status(403).json({
        message: "Bạn chỉ có thể khôi phục Journey của chính mình.",
      });
    }

    trip.deletedAt = null;
    trip.scheduledDeletionAt = null;
    trip.deletionProcessingAt = null;
    trip.deletionAttempts = 0;
    await trip.save();

    res.json({
      message: "Trip restored successfully",
      trip: {
        _id: trip._id,
        title: trip.title || "Untitled journey",
        caption: trip.caption || "",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listTrashedTrips(req, res, next) {
  try {
    const userId = req.user?.userId;

    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 50;

    const items = await Trip.find({
      ownerId: userId,
      deletedAt: { $ne: null },
    })
      .select(
        "ownerId title caption privacy coverUrl counts createdAt updatedAt deletedAt scheduledDeletionAt feedPreview",
      )
      .sort({ deletedAt: -1, updatedAt: -1 })
      .limit(limit)
      .lean();

    const total = await Trip.countDocuments({
      ownerId: userId,
      deletedAt: { $ne: null },
    });

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

export async function listSavedTrips(req, res, next) {
  try {
    const userId = req.user?.userId;

    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 50;

    const savedDocs = await SavedTrip.find({ userId })
      .select("tripId createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const tripIds = savedDocs.map((item) => item.tripId);

    const trips = tripIds.length
      ? await Trip.find({ _id: { $in: tripIds } })
          .select(
            "ownerId title caption privacy coverUrl counts createdAt updatedAt feedPreview deletedAt",
          )
          .populate("ownerId", "name email avatarUrl")
          .lean()
      : [];

    const tripMap = new Map(
      trips.map((trip) => [trip._id.toString(), trip]),
    );

    const ownerIds = [
      ...new Set(
        trips
          .map((trip) => getTripOwnerId(trip))
          .filter((ownerId) => ownerId && ownerId !== userId?.toString()),
      ),
    ];

    const [myReactions, followDocs] = await Promise.all([
      tripIds.length
        ? Reaction.find({
            targetType: "trip",
            userId,
            targetId: { $in: tripIds },
          })
            .select("targetId")
            .lean()
        : [],
      ownerIds.length
        ? Follow.find({
            followerId: userId,
            followingId: { $in: ownerIds },
          })
            .select("followingId")
            .lean()
        : [],
    ]);

    const heartedSet = new Set(
      myReactions.map((item) => item.targetId.toString()),
    );
    const followingSet = new Set(
      followDocs.map((item) => item.followingId.toString()),
    );

    const items = savedDocs.map((savedDoc) => {
      const currentTripId = savedDoc.tripId.toString();
      const trip = tripMap.get(currentTripId);

      if (!trip) {
        return buildUnavailableSavedTripItem(savedDoc);
      }

      if (trip.deletedAt) {
        return null;
      }

      const ownerId = getTripOwnerId(trip);
      const canView = canViewerAccessTrip({
        trip,
        viewerId: userId,
        isFollowingOwner: followingSet.has(ownerId),
      });

      if (!canView) {
        return buildUnavailableSavedTripItem(savedDoc);
      }

      return {
        ...trip,
        saved: true,
        savedAt: savedDoc.createdAt,
        hearted: heartedSet.has(currentTripId),
      };
    })
      .filter(Boolean);

    const total = await SavedTrip.countDocuments({ userId });

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
