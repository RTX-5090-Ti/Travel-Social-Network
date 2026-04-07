import HiddenTrip from "../models/HiddenTrip.js";

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const HIDDEN_TRIP_RETENTION_DAYS = Math.max(
  1,
  Number(process.env.HIDDEN_TRIP_RETENTION_DAYS || 7),
);
const HIDDEN_TRIP_CLEANUP_INTERVAL_MS = Math.max(
  1 * MINUTE_MS,
  Number(process.env.HIDDEN_TRIP_CLEANUP_INTERVAL_MS || 15 * MINUTE_MS),
);

let cleanupTimer = null;
let cleanupRunning = false;

export function buildHiddenTripExpiry(hiddenAt = new Date()) {
  const hiddenAtDate = hiddenAt instanceof Date ? hiddenAt : new Date(hiddenAt);
  return new Date(hiddenAtDate.getTime() + HIDDEN_TRIP_RETENTION_DAYS * DAY_MS);
}

export async function cleanupExpiredHiddenTrips() {
  if (cleanupRunning) return;

  cleanupRunning = true;

  try {
    await HiddenTrip.deleteMany({
      hideExpiresAt: { $lte: new Date() },
    });
  } finally {
    cleanupRunning = false;
  }
}

export function startHiddenTripCleanupJob() {
  if (cleanupTimer) return cleanupTimer;

  cleanupExpiredHiddenTrips().catch((error) => {
    console.error("[hidden-trip-cleanup] Initial cleanup failed:", error.message);
  });

  cleanupTimer = setInterval(() => {
    cleanupExpiredHiddenTrips().catch((error) => {
      console.error(
        "[hidden-trip-cleanup] Scheduled cleanup failed:",
        error.message,
      );
    });
  }, HIDDEN_TRIP_CLEANUP_INTERVAL_MS);

  return cleanupTimer;
}
