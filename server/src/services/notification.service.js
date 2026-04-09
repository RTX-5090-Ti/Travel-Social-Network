import Notification from "../models/Notification.js";
import { emitToUser } from "../socket/index.js";
import { normalizeNotificationPayload } from "../utils/notificationPayload.js";

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
    Notification.countDocuments({
      recipientUserId,
      readAt: null,
    }),
  ]);

  emitToUser(recipientUserId.toString(), "notification:new", {
    notification: hydrated ? normalizeNotificationPayload(hydrated) : null,
    unreadCount,
  });

  return created;
}
