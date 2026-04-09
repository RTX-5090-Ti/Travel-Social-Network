import Notification from "../models/Notification.js";
import { normalizeNotificationPayload } from "../utils/notificationPayload.js";

export async function listNotifications(req, res, next) {
  try {
    const userId = req.user?.userId;
    const limitRaw = Number(req.query.limit ?? 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 10;

    const [docs, unreadCount] = await Promise.all([
      Notification.find({ recipientUserId: userId })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .populate("actorUserId", "_id name avatarUrl isActive scheduledDeletionAt")
        .lean(),
      Notification.countDocuments({
        recipientUserId: userId,
        readAt: null,
      }),
    ]);

    res.json({
      items: docs.map((item) => normalizeNotificationPayload(item)),
      meta: {
        limit,
        unreadCount,
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
