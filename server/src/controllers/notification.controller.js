import mongoose from "mongoose";
import Notification from "../models/Notification.js";
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

export async function listNotifications(req, res, next) {
  try {
    const userId = req.user?.userId;
    const limitRaw = Number(req.query.limit ?? 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 10;
    const cursor = decodeNotificationCursor(req.query.cursor);

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
      Notification.countDocuments({
        recipientUserId: userId,
        readAt: null,
      }),
    ]);

    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = pageDocs.length
      ? encodeNotificationCursor(pageDocs[pageDocs.length - 1])
      : null;

    res.json({
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
    });
  } catch (err) {
    next(err);
  }
}

export async function getNotificationSummary(req, res, next) {
  try {
    const userId = req.user?.userId;

    const unreadCount = await Notification.countDocuments({
      recipientUserId: userId,
      readAt: null,
    });

    res.json({ unreadCount });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    const userId = req.user?.userId;
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

    res.json({ ok: true, readAt: now.toISOString() });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const userId = req.user?.userId;
    const notificationId = toIdString(req.params?.notificationId);

    if (!mongoose.isValidObjectId(notificationId)) {
      res.status(400).json({ message: "Notification không hợp lệ." });
      return;
    }

    const existingNotification = await Notification.findOne({
      _id: notificationId,
      recipientUserId: userId,
    });

    if (!existingNotification) {
      res.status(404).json({ message: "Không tìm thấy thông báo." });
      return;
    }

    if (!existingNotification.readAt) {
      existingNotification.readAt = new Date();
      await existingNotification.save();
    }

    await existingNotification.populate(
      "actorUserId",
      "_id name avatarUrl isActive scheduledDeletionAt",
    );

    const unreadCount = await Notification.countDocuments({
      recipientUserId: userId,
      readAt: null,
    });

    res.json({
      ok: true,
      item: normalizeNotificationPayload(existingNotification.toObject()),
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteSelectedNotifications(req, res, next) {
  try {
    const userId = req.user?.userId;
    const rawIds = Array.isArray(req.body?.notificationIds)
      ? req.body.notificationIds
      : [];

    const notificationIds = [
      ...new Set(
        rawIds.filter((id) => typeof id === "string" && mongoose.isValidObjectId(id)),
      ),
    ];

    if (!notificationIds.length) {
      const unreadCount = await Notification.countDocuments({
        recipientUserId: userId,
        readAt: null,
      });

      res.json({
        ok: true,
        deletedCount: 0,
        deletedIds: [],
        unreadCount,
      });
      return;
    }

    const ownedNotifications = await Notification.find(
      {
        _id: { $in: notificationIds },
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

    const unreadCount = await Notification.countDocuments({
      recipientUserId: userId,
      readAt: null,
    });

    res.json({
      ok: true,
      deletedCount: ownedIds.length,
      deletedIds: ownedIds,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAllNotifications(req, res, next) {
  try {
    const userId = req.user?.userId;

    const result = await Notification.deleteMany({
      recipientUserId: userId,
    });

    res.json({
      ok: true,
      deletedCount: Number(result?.deletedCount || 0),
      unreadCount: 0,
    });
  } catch (err) {
    next(err);
  }
}
