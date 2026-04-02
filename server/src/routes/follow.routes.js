import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  followUser,
  unfollowUser,
  getFollowStatus,
} from "../controllers/follow.controller.js";

const router = Router();

router.post("/:userId", requireAuth, followUser);
router.delete("/:userId", requireAuth, unfollowUser);
router.get("/:userId/status", requireAuth, getFollowStatus);

export default router;
