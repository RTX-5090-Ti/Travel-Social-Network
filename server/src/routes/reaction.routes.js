import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import {
  commentReactionSchema,
  tripReactionSchema,
} from "../validations/reaction.validation.js";
import {
  toggleCommentLike,
  toggleTripHeart,
  getTripHeartSummary,
} from "../controllers/reaction.controller.js";

const router = Router();

// /api/trips/:id/reaction
router.put(
  "/trips/:id/reaction",
  requireAuth,
  validate(tripReactionSchema),
  toggleTripHeart,
);
router.get(
  "/trips/:id/reaction/summary",
  requireAuth,
  validate(tripReactionSchema),
  getTripHeartSummary,
);
router.put(
  "/comments/:commentId/reaction",
  requireAuth,
  validate(commentReactionSchema),
  toggleCommentLike,
);

export default router;
