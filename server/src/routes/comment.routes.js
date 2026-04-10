import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { uploadCommentImage } from "../middlewares/upload.middleware.js";
import {
  createTripCommentGifSchema,
  createTripCommentImageSchema,
  createTripCommentSchema,
  deleteCommentSchema,
  getCommentByIdSchema,
  listTripCommentsSchema,
  updateCommentSchema,
} from "../validations/comment.validation.js";
import {
  createTripComment,
  createTripCommentGif,
  createTripCommentImage,
  deleteComment,
  getCommentContext,
  listCommentReplies,
  listTripComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

// /api/trips/:id/comments
router.get(
  "/trips/:id/comments",
  requireAuth,
  validate(listTripCommentsSchema),
  listTripComments,
);
router.get(
  "/comments/:commentId/context",
  requireAuth,
  validate(getCommentByIdSchema),
  getCommentContext,
);
router.get(
  "/comments/:commentId/replies",
  requireAuth,
  validate(getCommentByIdSchema),
  listCommentReplies,
);
router.post(
  "/trips/:id/comments",
  requireAuth,
  validate(createTripCommentSchema),
  createTripComment,
);
router.post(
  "/trips/:id/comments/gif",
  requireAuth,
  validate(createTripCommentGifSchema),
  createTripCommentGif,
);
router.post(
  "/trips/:id/comments/image",
  requireAuth,
  validate(createTripCommentImageSchema),
  uploadCommentImage.single("image"),
  createTripCommentImage,
);
router.patch(
  "/comments/:commentId",
  requireAuth,
  validate(updateCommentSchema),
  updateComment,
);
router.delete(
  "/comments/:commentId",
  requireAuth,
  validate(deleteCommentSchema),
  deleteComment,
);

export default router;
