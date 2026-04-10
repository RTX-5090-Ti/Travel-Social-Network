import { Router } from "express";

import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { uploadChatImage } from "../middlewares/upload.middleware.js";
import {
  deleteSelectedConversationsSchema,
  listConversationMessagesSchema,
  markConversationReadSchema,
  openDirectConversationSchema,
  sendGifMessageSchema,
  sendImageMessageSchema,
  sendMessageSchema,
} from "../validations/chat.validation.js";
import {
  deleteSelectedConversations,
  getConversationMessages,
  listConversations,
  markConversationRead,
  openDirectConversation,
  sendGifMessage,
  sendImageMessage,
  sendMessage,
} from "../controllers/chat.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/conversations", listConversations);
router.post(
  "/conversations/delete-selected",
  validate(deleteSelectedConversationsSchema),
  deleteSelectedConversations,
);
router.post(
  "/conversations/direct/:userId",
  validate(openDirectConversationSchema),
  openDirectConversation,
);
router.get(
  "/conversations/:conversationId/messages",
  validate(listConversationMessagesSchema),
  getConversationMessages,
);
router.post(
  "/conversations/:conversationId/messages",
  validate(sendMessageSchema),
  sendMessage,
);
router.post(
  "/conversations/:conversationId/messages/gif",
  validate(sendGifMessageSchema),
  sendGifMessage,
);
router.post(
  "/conversations/:conversationId/messages/image",
  validate(sendImageMessageSchema),
  uploadChatImage.single("image"),
  sendImageMessage,
);
router.post(
  "/conversations/:conversationId/read",
  validate(markConversationReadSchema),
  markConversationRead,
);

export default router;
