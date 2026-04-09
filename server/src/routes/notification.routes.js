import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  getNotificationSummary,
  listNotifications,
  markAllNotificationsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", requireAuth, listNotifications);
router.get("/summary", requireAuth, getNotificationSummary);
router.post("/read-all", requireAuth, markAllNotificationsRead);

export default router;
