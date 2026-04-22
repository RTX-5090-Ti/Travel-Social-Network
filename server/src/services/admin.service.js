import Comment from "../models/Comment.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import { buildTripDeletionSchedule } from "./tripTrashCleanup.service.js";

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function buildRegexSearch(keyword = "") {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) return null;
  return new RegExp(trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export async function getAdminDashboardStats() {
  const [
    totalUsers,
    activeUsers,
    deactivatedUsers,
    pendingDeletionUsers,
    totalTrips,
    publicTrips,
    followerTrips,
    privateTrips,
    trashedTrips,
    totalComments,
    latestUsers,
    latestTrips,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false, scheduledDeletionAt: null }),
    User.countDocuments({ scheduledDeletionAt: { $ne: null } }),
    Trip.countDocuments({ deletedAt: null }),
    Trip.countDocuments({ deletedAt: null, privacy: "public" }),
    Trip.countDocuments({ deletedAt: null, privacy: "followers" }),
    Trip.countDocuments({ deletedAt: null, privacy: "private" }),
    Trip.countDocuments({ deletedAt: { $ne: null } }),
    Comment.countDocuments(),
    User.find({})
      .select("_id name email role isActive createdAt avatarUrl")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Trip.find({})
      .select("_id title privacy counts createdAt deletedAt ownerId")
      .populate("ownerId", "_id name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    stats: {
      totalUsers,
      activeUsers,
      deactivatedUsers,
      pendingDeletionUsers,
      totalTrips,
      publicTrips,
      followerTrips,
      privateTrips,
      trashedTrips,
      totalComments,
    },
    latestUsers,
    latestTrips,
  };
}

export async function listAdminUsers({
  search = "",
  page = 1,
  limit = 12,
}) {
  const regex = buildRegexSearch(search);
  const filter = regex
    ? {
        $or: [{ name: regex }, { email: regex }],
      }
    : {};

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(
        "_id name email role isActive avatarUrl createdAt lastSeenAt scheduledDeletionAt",
      )
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    items,
    page: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: skip + items.length < total,
    },
  };
}

export async function listAdminTrips({
  search = "",
  privacy = "",
  page = 1,
  limit = 12,
}) {
  const regex = buildRegexSearch(search);
  const filter = {};

  if (regex) {
    filter.$or = [{ title: regex }, { caption: regex }];
  }

  if (privacy && ["public", "followers", "private", "trashed"].includes(privacy)) {
    if (privacy === "trashed") {
      filter.deletedAt = { $ne: null };
    } else {
      filter.privacy = privacy;
      filter.deletedAt = null;
    }
  }

  if (!("deletedAt" in filter)) {
    filter.deletedAt = null;
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Trip.find(filter)
      .select(
        "_id title caption privacy counts createdAt deletedAt ownerId feedPreview coverUrl",
      )
      .populate("ownerId", "_id name email avatarUrl")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Trip.countDocuments(filter),
  ]);

  return {
    items,
    page: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: skip + items.length < total,
    },
  };
}

export async function setAdminUserActiveState({
  targetUserId,
  adminUserId,
  isActive,
}) {
  if (targetUserId?.toString() === adminUserId?.toString()) {
    throw createHttpError(400, "You cannot change your own admin account state.");
  }

  const user = await User.findById(targetUserId).select(
    "_id name email role isActive scheduledDeletionAt deletionRequestedAt refreshTokenHash",
  );

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  user.isActive = Boolean(isActive);

  if (user.isActive) {
    user.deletionRequestedAt = null;
    user.scheduledDeletionAt = null;
  } else {
    user.deletionRequestedAt = null;
    user.scheduledDeletionAt = null;
    user.refreshTokenHash = null;
  }

  await user.save();

  return {
    message: user.isActive
      ? "User reactivated successfully"
      : "User deactivated successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      scheduledDeletionAt: user.scheduledDeletionAt,
      deletionRequestedAt: user.deletionRequestedAt,
    },
  };
}

export async function setAdminTripTrashState({ tripId, trashed }) {
  const trip = await Trip.findById(tripId).select(
    "_id title caption ownerId deletedAt scheduledDeletionAt deletionProcessingAt deletionAttempts",
  );

  if (!trip) {
    throw createHttpError(404, "Trip not found");
  }

  if (trashed) {
    if (!trip.deletedAt) {
      const deletedAt = new Date();
      trip.deletedAt = deletedAt;
      trip.scheduledDeletionAt = buildTripDeletionSchedule(deletedAt);
      trip.deletionProcessingAt = null;
      trip.deletionAttempts = 0;
      await trip.save();
    }

    await User.updateOne(
      { _id: trip.ownerId, pinnedTripId: trip._id },
      { $set: { pinnedTripId: null } },
    );

    return {
      message: "Trip moved to trash successfully",
      trip: {
        _id: trip._id,
        title: trip.title || "Untitled journey",
        caption: trip.caption || "",
        deletedAt: trip.deletedAt,
        scheduledDeletionAt: trip.scheduledDeletionAt,
      },
    };
  }

  trip.deletedAt = null;
  trip.scheduledDeletionAt = null;
  trip.deletionProcessingAt = null;
  trip.deletionAttempts = 0;
  await trip.save();

  return {
    message: "Trip restored successfully",
    trip: {
      _id: trip._id,
      title: trip.title || "Untitled journey",
      caption: trip.caption || "",
      deletedAt: trip.deletedAt,
      scheduledDeletionAt: trip.scheduledDeletionAt,
    },
  };
}
