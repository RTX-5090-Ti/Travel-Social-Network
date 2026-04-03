import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { uploadAvatar } from "../middlewares/upload.middleware.js";
import {
  uploadAvatarController,
  getMyTripsController,
  getUserProfileController,
  getUserSummaryController,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/me/trips", requireAuth, getMyTripsController);

router.get("/:id/summary", requireAuth, getUserSummaryController);

router.get("/:id/profile", requireAuth, getUserProfileController);

router.patch(
  "/me/avatar",
  requireAuth,
  uploadAvatar.single("avatar"),
  uploadAvatarController,
);

export default router;
