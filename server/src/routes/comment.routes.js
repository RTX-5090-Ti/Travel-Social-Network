import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  createTripComment,
  listTripComments,
} from "../controllers/comment.controller.js";

const router = Router();

// /api/trips/:id/comments
router.get("/trips/:id/comments", requireAuth, listTripComments);
router.post("/trips/:id/comments", requireAuth, createTripComment);

export default router;
