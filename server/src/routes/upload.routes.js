import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  uploadTripMedia,
  MAX_TRIP_MEDIA_FILES,
} from "../middlewares/upload.middleware.js";
import {
  uploadTripMediaController,
  cleanupTripMediaController,
} from "../controllers/upload.controller.js";

const router = Router();

router.post(
  "/trip-media",
  requireAuth,
  uploadTripMedia.array("files", MAX_TRIP_MEDIA_FILES),
  uploadTripMediaController,
);

router.delete("/trip-media", requireAuth, cleanupTripMediaController);

export default router;
