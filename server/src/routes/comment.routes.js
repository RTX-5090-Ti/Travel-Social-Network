import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  createTripComment,
  deleteComment,
  listCommentReplies,
  listTripComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

// /api/trips/:id/comments
router.get("/trips/:id/comments", requireAuth, listTripComments);
router.get("/comments/:commentId/replies", requireAuth, listCommentReplies);
router.post("/trips/:id/comments", requireAuth, createTripComment);
router.patch("/comments/:commentId", requireAuth, updateComment);
router.delete("/comments/:commentId", requireAuth, deleteComment);

export default router;
