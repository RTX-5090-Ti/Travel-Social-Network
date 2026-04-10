import { Router } from "express";

import { requireAuth } from "../middlewares/requireAuth.js";
import { uploadChatImage } from "../middlewares/upload.middleware.js";
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
router.post("/conversations/delete-selected", deleteSelectedConversations);
router.post("/conversations/direct/:userId", openDirectConversation);
router.get("/conversations/:conversationId/messages", getConversationMessages);
router.post("/conversations/:conversationId/messages", sendMessage);
router.post("/conversations/:conversationId/messages/gif", sendGifMessage);
router.post(
  "/conversations/:conversationId/messages/image",
  uploadChatImage.single("image"),
  sendImageMessage,
);
router.post("/conversations/:conversationId/read", markConversationRead);

export default router;
