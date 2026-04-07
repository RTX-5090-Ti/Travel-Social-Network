import Comment from "../models/Comment.js";
import HiddenTrip from "../models/HiddenTrip.js";
import Milestone from "../models/Milestone.js";
import Reaction from "../models/Reaction.js";
import SavedTrip from "../models/SavedTrip.js";
import Trip from "../models/Trip.js";
import TripItem from "../models/TripItem.js";
import User from "../models/User.js";
import { cloudinary } from "../config/cloudinary.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const TRIP_TRASH_RETENTION_DAYS = Math.max(
  1,
  Number(process.env.TRIP_TRASH_RETENTION_DAYS || 7),
);
const TRIP_TRASH_CLEANUP_INTERVAL_MS = Math.max(
  5 * MINUTE_MS,
  Number(process.env.TRIP_TRASH_CLEANUP_INTERVAL_MS || 15 * MINUTE_MS),
);
const TRIP_TRASH_LOCK_TIMEOUT_MS = Math.max(
  1 * MINUTE_MS,
  Number(process.env.TRIP_TRASH_LOCK_TIMEOUT_MS || 30 * MINUTE_MS),
);
const TRIP_TRASH_BATCH_SIZE = Math.max(
  1,
  Number(process.env.TRIP_TRASH_BATCH_SIZE || 10),
);

let cleanupTimer = null;
let cleanupRunning = false;

export function buildTripDeletionSchedule(deletedAt = new Date()) {
  const deletedAtDate = deletedAt instanceof Date ? deletedAt : new Date(deletedAt);

  return new Date(deletedAtDate.getTime() + TRIP_TRASH_RETENTION_DAYS * DAY_MS);
}

function normalizeMediaType(type) {
  return type === "video" ? "video" : "image";
}

async function cleanupCloudinaryFiles(files = []) {
  if (!files.length) return;

  const results = await Promise.allSettled(
    files.map((file) =>
      cloudinary.uploader.destroy(file.publicId, {
        resource_type: normalizeMediaType(file.type),
      }),
    ),
  );

  const failed = results.some((result) => result.status === "rejected");
  if (failed) {
    throw new Error("Cloudinary cleanup failed");
  }
}

async function claimExpiredTrip(now) {
  const lockCutoff = new Date(now.getTime() - TRIP_TRASH_LOCK_TIMEOUT_MS);

  return Trip.findOneAndUpdate(
    {
      deletedAt: { $ne: null },
      scheduledDeletionAt: { $ne: null, $lte: now },
      $or: [
        { deletionProcessingAt: null },
        { deletionProcessingAt: { $lte: lockCutoff } },
      ],
    },
    {
      $set: { deletionProcessingAt: now },
      $inc: { deletionAttempts: 1 },
    },
    {
      returnDocument: "after",
      sort: { scheduledDeletionAt: 1, deletedAt: 1 },
    },
  ).lean();
}

async function hardDeleteTrip(tripId, now) {
  const trip = await Trip.findById(tripId).select(
    "_id ownerId deletedAt scheduledDeletionAt deletionProcessingAt",
  );

  if (!trip) return;
  if (!trip.deletedAt || !trip.scheduledDeletionAt) return;
  if (trip.scheduledDeletionAt.getTime() > now.getTime()) return;
  if (!trip.deletionProcessingAt) return;

  const items = await TripItem.find({ tripId })
    .select("media.publicId media.type")
    .lean();

  const mediaFiles = items.flatMap((item) =>
    Array.isArray(item?.media)
      ? item.media
          .filter((media) => media?.publicId)
          .map((media) => ({
            publicId: media.publicId,
            type: normalizeMediaType(media.type),
          }))
      : [],
  );

  await cleanupCloudinaryFiles(mediaFiles);

  await Promise.all([
    Comment.deleteMany({ targetType: "trip", targetId: tripId }),
    HiddenTrip.deleteMany({ tripId }),
    Reaction.deleteMany({ targetType: "trip", targetId: tripId }),
    SavedTrip.deleteMany({ tripId }),
    Milestone.deleteMany({ tripId }),
    TripItem.deleteMany({ tripId }),
    User.updateMany({ pinnedTripId: tripId }, { $set: { pinnedTripId: null } }),
  ]);

  await Trip.deleteOne({ _id: tripId });
}

export async function cleanupExpiredTrips() {
  if (cleanupRunning) return;

  cleanupRunning = true;

  try {
    const now = new Date();

    for (let index = 0; index < TRIP_TRASH_BATCH_SIZE; index += 1) {
      const claimedTrip = await claimExpiredTrip(now);
      if (!claimedTrip?._id) break;

      try {
        await hardDeleteTrip(claimedTrip._id, now);
      } catch (error) {
        await Trip.updateOne(
          { _id: claimedTrip._id },
          { $set: { deletionProcessingAt: null } },
        );

        console.error(
          `[trip-trash-cleanup] Failed to purge trip ${claimedTrip._id}:`,
          error.message,
        );
      }
    }
  } finally {
    cleanupRunning = false;
  }
}

export function startTripTrashCleanupJob() {
  if (cleanupTimer) return cleanupTimer;

  cleanupExpiredTrips().catch((error) => {
    console.error("[trip-trash-cleanup] Initial cleanup failed:", error.message);
  });

  cleanupTimer = setInterval(() => {
    cleanupExpiredTrips().catch((error) => {
      console.error("[trip-trash-cleanup] Scheduled cleanup failed:", error.message);
    });
  }, TRIP_TRASH_CLEANUP_INTERVAL_MS);

  return cleanupTimer;
}
