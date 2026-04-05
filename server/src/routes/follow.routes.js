import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowSummary,
  listFollowers,
  listFollowing,
  listFollowersByUserId,
  listFollowingByUserId,
} from "../controllers/follow.controller.js";

const router = Router();

router.get("/summary", requireAuth, getFollowSummary);

router.get("/followers", requireAuth, listFollowers);
router.get("/following", requireAuth, listFollowing);

router.get("/users/:userId/followers", requireAuth, listFollowersByUserId);
router.get("/users/:userId/following", requireAuth, listFollowingByUserId);

router.post("/:userId", requireAuth, followUser);
router.delete("/:userId", requireAuth, unfollowUser);
router.get("/:userId/status", requireAuth, getFollowStatus);

export default router;
