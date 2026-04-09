import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  deleteAllNotifications,
  deleteSelectedNotifications,
  getNotificationSummary,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", requireAuth, listNotifications);
router.get("/summary", requireAuth, getNotificationSummary);
router.patch("/:notificationId/read", requireAuth, markNotificationRead);
router.post("/read-all", requireAuth, markAllNotificationsRead);
router.post("/delete-selected", requireAuth, deleteSelectedNotifications);
router.post("/delete-all", requireAuth, deleteAllNotifications);

export default router;
