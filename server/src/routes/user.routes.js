import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { uploadAvatar, uploadCover } from "../middlewares/upload.middleware.js";
import {
  uploadAvatarController,
  uploadCoverController,
  getMyTripsController,
  searchUsersController,
  getUserProfileMediaController,
  getUserProfileController,
  getUserSummaryController,
  updateProfileController,
} from "../controllers/user.controller.js";
import { validate } from "../middlewares/validate.js";
import {
  getMyTripsSchema,
  searchUsersSchema,
  getUserProfileMediaSchema,
  getUserProfileSchema,
  getUserSummarySchema,
  updateProfileSchema,
} from "../validations/user.validation.js";

const router = Router();

router.get("/me/trips", requireAuth, validate(getMyTripsSchema), getMyTripsController);
router.get("/search", requireAuth, validate(searchUsersSchema), searchUsersController);

router.get(
  "/:id/summary",
  requireAuth,
  validate(getUserSummarySchema),
  getUserSummaryController,
);

router.get(
  "/:id/media",
  requireAuth,
  validate(getUserProfileMediaSchema),
  getUserProfileMediaController,
);

router.get(
  "/:id/profile",
  requireAuth,
  validate(getUserProfileSchema),
  getUserProfileController,
);

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
