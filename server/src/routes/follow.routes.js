import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowSummary,
  listFollowers,
  listFollowing,
} from "../controllers/follow.controller.js";

const router = Router();

router.get("/summary", requireAuth, getFollowSummary);
router.get("/followers", requireAuth, listFollowers);
router.get("/following", requireAuth, listFollowing);

router.post("/:userId", requireAuth, followUser);
router.delete("/:userId", requireAuth, unfollowUser);
router.get("/:userId/status", requireAuth, getFollowStatus);

export default router;
