import { Router } from "express";

import { requireAuth } from "../middlewares/requireAuth.js";
import {
  getConversationMessages,
  listConversations,
  markConversationRead,
  openDirectConversation,
  sendMessage,
} from "../controllers/chat.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/conversations", listConversations);
router.post("/conversations/direct/:userId", openDirectConversation);
router.get("/conversations/:conversationId/messages", getConversationMessages);
router.post("/conversations/:conversationId/messages", sendMessage);
router.post("/conversations/:conversationId/read", markConversationRead);

export default router;
