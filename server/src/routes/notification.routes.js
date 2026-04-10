import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import {
  deleteAllNotifications,
  deleteSelectedNotifications,
  getNotificationSummary,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification.controller.js";
import {
  deleteSelectedNotificationsSchema,
  emptyNotificationActionSchema,
  listNotificationsSchema,
  markNotificationReadSchema,
} from "../validations/notification.validation.js";

const router = Router();

router.get("/", requireAuth, validate(listNotificationsSchema), listNotifications);
router.get(
  "/summary",
  requireAuth,
  validate(emptyNotificationActionSchema),
  getNotificationSummary,
);
router.patch(
  "/:notificationId/read",
  requireAuth,
  validate(markNotificationReadSchema),
  markNotificationRead,
);
router.post(
  "/read-all",
  requireAuth,
  validate(emptyNotificationActionSchema),
  markAllNotificationsRead,
);
router.post(
  "/delete-selected",
  requireAuth,
  validate(deleteSelectedNotificationsSchema),
  deleteSelectedNotifications,
);
router.post(
  "/delete-all",
  requireAuth,
  validate(emptyNotificationActionSchema),
  deleteAllNotifications,
);

export default router;
