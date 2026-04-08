import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  toggleCommentLike,
  toggleTripHeart,
  getTripHeartSummary,
} from "../controllers/reaction.controller.js";

const router = Router();

// /api/trips/:id/reaction
router.put("/trips/:id/reaction", requireAuth, toggleTripHeart);
router.get("/trips/:id/reaction/summary", requireAuth, getTripHeartSummary);
router.put("/comments/:commentId/reaction", requireAuth, toggleCommentLike);

export default router;
