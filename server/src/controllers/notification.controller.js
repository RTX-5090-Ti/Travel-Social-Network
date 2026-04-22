import {
  deleteAllNotificationsForUser,
  deleteSelectedNotificationsForUser,
  getNotificationSummaryForUser,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "../services/notification.service.js";

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?.toString?.() || "";
}

export async function listNotifications(req, res, next) {
  try {
    const userId = req.user?.userId;
    const limitRaw = Number(req.validated?.query?.limit ?? req.query.limit ?? 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 10;

    const result = await listNotificationsForUser({
      userId,
      limit,
      cursor: req.validated?.query?.cursor ?? req.query.cursor,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getNotificationSummary(req, res, next) {
  try {
    const userId = req.user?.userId;
    const result = await getNotificationSummaryForUser(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    const userId = req.user?.userId;
    const result = await markAllNotificationsReadForUser(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const userId = req.user?.userId;
    const notificationId = toIdString(
      req.validated?.params?.notificationId || req.params?.notificationId,
    );

    const result = await markNotificationReadForUser({
      userId,
      notificationId,
    });

    if (!result.ok) {
      res.status(result.status).json({ message: result.message });
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteSelectedNotifications(req, res, next) {
  try {
    const userId = req.user?.userId;
    const rawIds = Array.isArray(req.validated?.body?.notificationIds)
      ? req.validated.body.notificationIds
      : Array.isArray(req.body?.notificationIds)
        ? req.body.notificationIds
        : [];

    const result = await deleteSelectedNotificationsForUser({
      userId,
      notificationIds: rawIds,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteAllNotifications(req, res, next) {
  try {
    const userId = req.user?.userId;
    const result = await deleteAllNotificationsForUser(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
