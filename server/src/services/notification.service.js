import mongoose from "mongoose";

import Notification from "../models/Notification.js";
import { emitToUser } from "../socket/index.js";
import { normalizeNotificationPayload } from "../utils/notificationPayload.js";

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?.toString?.() || "";
}

function encodeNotificationCursor(item) {
  const createdAt =
    item?.createdAt instanceof Date
      ? item.createdAt.toISOString()
      : typeof item?.createdAt === "string"
        ? item.createdAt
        : "";
  const notificationId = toIdString(item?._id);

  if (!createdAt || !notificationId) return null;

  return `${createdAt}__${notificationId}`;
}

function decodeNotificationCursor(rawCursor) {
  if (typeof rawCursor !== "string" || !rawCursor.trim()) {
    return null;
  }

  const trimmedCursor = rawCursor.trim();
  const separatorIndex = trimmedCursor.lastIndexOf("__");

  if (separatorIndex === -1) {
    const legacyDate = new Date(trimmedCursor);
    return Number.isNaN(legacyDate.getTime())
      ? null
      : { createdAt: legacyDate, id: "" };
  }

  const createdAtRaw = trimmedCursor.slice(0, separatorIndex);
  const idRaw = trimmedCursor.slice(separatorIndex + 2);
  const createdAt = new Date(createdAtRaw);

  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return {
    createdAt,
    id: mongoose.isValidObjectId(idRaw) ? idRaw : "",
  };
}

async function countUnreadNotifications(recipientUserId) {
  return Notification.countDocuments({
    recipientUserId,
    readAt: null,
  });
}

export async function createNotification({
  recipientUserId,
  actorUserId,
  type,
  tripId = null,
  commentId = null,
  payload = {},
}) {
  if (!recipientUserId || !actorUserId || !type) {
    return null;
  }

  if (recipientUserId.toString() === actorUserId.toString()) {
    return null;
  }

  const created = await Notification.create({
    recipientUserId,
    actorUserId,
    type,
    tripId,
    commentId,
    payload,
  });

  const [hydrated, unreadCount] = await Promise.all([
    Notification.findById(created._id)
      .populate("actorUserId", "_id name avatarUrl isActive scheduledDeletionAt")
      .lean(),
    countUnreadNotifications(recipientUserId),
  ]);

  emitToUser(recipientUserId.toString(), "notification:new", {
    notification: hydrated ? normalizeNotificationPayload(hydrated) : null,
    unreadCount,
  });

  return created;
}

export async function listNotificationsForUser({
  userId,
  limit = 10,
  cursor: rawCursor = null,
}) {
  const cursor = decodeNotificationCursor(rawCursor);
  const filter = {
    recipientUserId: userId,
  };

  if (cursor?.createdAt) {
    if (cursor.id) {
      filter.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        {
          createdAt: cursor.createdAt,
          _id: { $lt: new mongoose.Types.ObjectId(cursor.id) },
        },
      ];
    } else {
      filter.createdAt = { $lt: cursor.createdAt };
    }
  }

  const [docs, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("actorUserId", "_id name avatarUrl isActive scheduledDeletionAt")
      .lean(),
    countUnreadNotifications(userId),
  ]);

  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor = pageDocs.length
    ? encodeNotificationCursor(pageDocs[pageDocs.length - 1])
    : null;

  return {
    items: pageDocs.map((item) => normalizeNotificationPayload(item)),
    meta: {
      limit,
      unreadCount,
    },
    page: {
      limit,
      hasMore,
      nextCursor,
    },
  };
}

export async function getNotificationSummaryForUser(userId) {
  const unreadCount = await countUnreadNotifications(userId);
  return { unreadCount };
}

export async function markAllNotificationsReadForUser(userId) {
  const now = new Date();

  await Notification.updateMany(
    {
      recipientUserId: userId,
      readAt: null,
    },
    {
      $set: { readAt: now },
    },
  );

  return { ok: true, readAt: now.toISOString() };
}

export async function markNotificationReadForUser({ userId, notificationId }) {
  if (!mongoose.isValidObjectId(notificationId)) {
    return {
      ok: false,
      status: 400,
      message: "Notification không hợp lệ.",
    };
  }

  const existingNotification = await Notification.findOne({
    _id: notificationId,
    recipientUserId: userId,
  });

  if (!existingNotification) {
    return {
      ok: false,
      status: 404,
      message: "Không tìm thấy thông báo.",
    };
  }

  if (!existingNotification.readAt) {
    existingNotification.readAt = new Date();
    await existingNotification.save();
  }

  await existingNotification.populate(
    "actorUserId",
    "_id name avatarUrl isActive scheduledDeletionAt",
  );

  const unreadCount = await countUnreadNotifications(userId);

  return {
    ok: true,
    item: normalizeNotificationPayload(existingNotification.toObject()),
    unreadCount,
  };
}

export async function deleteSelectedNotificationsForUser({
  userId,
  notificationIds = [],
}) {
  const normalizedIds = [
    ...new Set(
      notificationIds.filter(
        (id) => typeof id === "string" && mongoose.isValidObjectId(id),
      ),
    ),
  ];

  if (!normalizedIds.length) {
    const unreadCount = await countUnreadNotifications(userId);
    return {
      ok: true,
      deletedCount: 0,
      deletedIds: [],
      unreadCount,
    };
  }

  const ownedNotifications = await Notification.find(
    {
      _id: { $in: normalizedIds },
      recipientUserId: userId,
    },
    { _id: 1 },
  ).lean();

  const ownedIds = ownedNotifications.map((item) => toIdString(item?._id));

  if (ownedIds.length) {
    await Notification.deleteMany({
      _id: { $in: ownedIds },
      recipientUserId: userId,
    });
  }

  const unreadCount = await countUnreadNotifications(userId);

  return {
    ok: true,
    deletedCount: ownedIds.length,
    deletedIds: ownedIds,
    unreadCount,
  };
}

export async function deleteAllNotificationsForUser(userId) {
  const result = await Notification.deleteMany({
    recipientUserId: userId,
  });

  return {
    ok: true,
    deletedCount: Number(result?.deletedCount || 0),
    unreadCount: 0,
  };
}
