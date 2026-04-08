import Follow from "../models/Follow.js";
import HiddenTrip from "../models/HiddenTrip.js";
import SavedTrip from "../models/SavedTrip.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import { hardDeleteTripById } from "./tripTrashCleanup.service.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const ACCOUNT_DELETION_RETENTION_DAYS = Math.max(
  1,
  Number(process.env.ACCOUNT_DELETION_RETENTION_DAYS || 7),
);
const ACCOUNT_DELETION_CLEANUP_INTERVAL_MS = Math.max(
  5 * MINUTE_MS,
  Number(process.env.ACCOUNT_DELETION_CLEANUP_INTERVAL_MS || 15 * MINUTE_MS),
);
const ACCOUNT_DELETION_BATCH_SIZE = Math.max(
  1,
  Number(process.env.ACCOUNT_DELETION_BATCH_SIZE || 10),
);

let cleanupTimer = null;
let cleanupRunning = false;

export function buildAccountDeletionSchedule(requestedAt = new Date()) {
  const requestedAtDate =
    requestedAt instanceof Date ? requestedAt : new Date(requestedAt);

  return new Date(
    requestedAtDate.getTime() + ACCOUNT_DELETION_RETENTION_DAYS * DAY_MS,
  );
}

async function hardDeleteUserById(userId, now) {
  const user = await User.findById(userId).select(
    "_id scheduledDeletionAt pinnedTripId",
  );

  if (!user || !user.scheduledDeletionAt) return;
  if (user.scheduledDeletionAt.getTime() > now.getTime()) return;

  const ownedTrips = await Trip.find({ ownerId: userId })
    .select("_id")
    .lean();

  for (const trip of ownedTrips) {
    await hardDeleteTripById(trip._id, now);
  }

  await Promise.all([
    Follow.deleteMany({
      $or: [{ followerId: userId }, { followingId: userId }],
    }),
    HiddenTrip.deleteMany({ userId }),
    SavedTrip.deleteMany({ userId }),
  ]);

  await User.deleteOne({ _id: userId });
}

export async function cleanupExpiredPendingDeletionAccounts() {
  if (cleanupRunning) return;

  cleanupRunning = true;

  try {
    const now = new Date();
    const expiredUsers = await User.find({
      scheduledDeletionAt: { $ne: null, $lte: now },
    })
      .select("_id")
      .sort({ scheduledDeletionAt: 1, _id: 1 })
      .limit(ACCOUNT_DELETION_BATCH_SIZE)
      .lean();

    for (const user of expiredUsers) {
      try {
        await hardDeleteUserById(user._id, now);
      } catch (error) {
        console.error(
          `[account-deletion-cleanup] Failed to purge user ${user._id}:`,
          error.message,
        );
      }
    }
  } finally {
    cleanupRunning = false;
  }
}

export function startAccountDeletionCleanupJob() {
  if (cleanupTimer) return cleanupTimer;

  cleanupExpiredPendingDeletionAccounts().catch((error) => {
    console.error(
      "[account-deletion-cleanup] Initial cleanup failed:",
      error.message,
    );
  });

  cleanupTimer = setInterval(() => {
    cleanupExpiredPendingDeletionAccounts().catch((error) => {
      console.error(
        "[account-deletion-cleanup] Scheduled cleanup failed:",
        error.message,
      );
    });
  }, ACCOUNT_DELETION_CLEANUP_INTERVAL_MS);

  return cleanupTimer;
}
