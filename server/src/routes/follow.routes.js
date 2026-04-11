import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import {
  followUserParamsSchema,
  listMutualFollowsSchema,
  listOwnFollowUsersSchema,
  listSuggestedFollowsSchema,
  listUserFollowUsersSchema,
} from "../validations/follow.validation.js";
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowSummary,
  listMutualFollows,
  listSuggestedFollows,
  listFollowers,
  listFollowing,
  listFollowersByUserId,
  listFollowingByUserId,
} from "../controllers/follow.controller.js";

const router = Router();

router.get("/summary", requireAuth, getFollowSummary);
router.get(
  "/mutuals",
  requireAuth,
  validate(listMutualFollowsSchema),
  listMutualFollows,
);
router.get(
  "/suggestions",
  requireAuth,
  validate(listSuggestedFollowsSchema),
  listSuggestedFollows,
);

router.get(
  "/followers",
  requireAuth,
  validate(listOwnFollowUsersSchema),
  listFollowers,
);
router.get(
  "/following",
  requireAuth,
  validate(listOwnFollowUsersSchema),
  listFollowing,
);

router.get(
  "/users/:userId/followers",
  requireAuth,
  validate(listUserFollowUsersSchema),
  listFollowersByUserId,
);
router.get(
  "/users/:userId/following",
  requireAuth,
  validate(listUserFollowUsersSchema),
  listFollowingByUserId,
);

router.post("/:userId", requireAuth, validate(followUserParamsSchema), followUser);
router.delete(
  "/:userId",
  requireAuth,
  validate(followUserParamsSchema),
  unfollowUser,
);
router.get(
  "/:userId/status",
  requireAuth,
  validate(followUserParamsSchema),
  getFollowStatus,
);

export default router;
