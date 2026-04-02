import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { uploadAvatar } from "../middlewares/upload.middleware.js";
import {
  uploadAvatarController,
  getMyTripsController,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/me/trips", requireAuth, getMyTripsController);

router.patch(
  "/me/avatar",
  requireAuth,
  uploadAvatar.single("avatar"),
  uploadAvatarController,
);

router.get("/:id", (req, res) => res.json({ message: "User profile (stub)" }));

export default router;
