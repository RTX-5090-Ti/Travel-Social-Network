import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { uploadAvatar, uploadCover } from "../middlewares/upload.middleware.js";
import {
  uploadAvatarController,
  uploadCoverController,
  getMyTripsController,
  getUserProfileMediaController,
  getUserProfileController,
  getUserSummaryController,
  updateProfileController,
} from "../controllers/user.controller.js";
import { validate } from "../middlewares/validate.js";
import { updateProfileSchema } from "../validations/user.validation.js";

const router = Router();

router.get("/me/trips", requireAuth, getMyTripsController);

router.get("/:id/summary", requireAuth, getUserSummaryController);

router.get("/:id/media", requireAuth, getUserProfileMediaController);

router.get("/:id/profile", requireAuth, getUserProfileController);

router.patch(
  "/me/profile",
  requireAuth,
  validate(updateProfileSchema),
  updateProfileController,
);

router.patch(
  "/me/avatar",
  requireAuth,
  uploadAvatar.single("avatar"),
  uploadAvatarController,
);

router.patch(
  "/me/cover",
  requireAuth,
  uploadCover.single("cover"),
  uploadCoverController,
);

export default router;
