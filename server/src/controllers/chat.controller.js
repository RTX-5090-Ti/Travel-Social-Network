import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { emitToUser } from "../socket/index.js";

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?.toString?.() || "";
}

function buildParticipantKey(userA, userB) {
  return [toIdString(userA), toIdString(userB)].sort().join(":");
}

function mapUserSummary(user) {
  return {
    _id: user?._id,
    id: user?._id,
    name: user?.name || "Traveler",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || "",
  };
}

function getConversationUnreadCount(conversation, userId) {
  const unreadCounts = conversation?.unreadCounts || {};
  const rawValue = unreadCounts?.[userId];
  const parsed = Number(rawValue || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapConversationSummary(conversation, viewerId) {
  const participants = Array.isArray(conversation?.participants)
    ? conversation.participants
    : [];

  const otherUser =
    participants.find((item) => toIdString(item?._id || item) !== viewerId) ||
    participants[0] ||
    null;

  return {
    _id: conversation?._id,
    id: conversation?._id,
    participant: mapUserSummary(otherUser),
    lastMessageText: conversation?.lastMessageText || "",
    lastMessageAt: conversation?.lastMessageAt || conversation?.updatedAt,
    lastMessageSenderId: toIdString(
      conversation?.lastMessageSenderId?._id || conversation?.lastMessageSenderId,
    ),
    unreadCount: getConversationUnreadCount(conversation, viewerId),
    updatedAt: conversation?.updatedAt,
    createdAt: conversation?.createdAt,
  };
}

function mapMessagePayload(message) {
  return {
    _id: message?._id,
    id: message?._id,
    conversationId: message?.conversationId,
    senderId: message?.senderId?._id || message?.senderId,
    recipientId: message?.recipientId?._id || message?.recipientId,
    sender: message?.senderId?.name
      ? mapUserSummary(message.senderId)
      : null,
    text: message?.text || "",
    readAt: message?.readAt || null,
    createdAt: message?.createdAt,
    updatedAt: message?.updatedAt,
  };
}

async function countUnreadMessages(userId) {
  const conversations = await Conversation.find({
    participants: userId,
  }).select("unreadCounts");

  return conversations.reduce(
    (sum, conversation) => sum + getConversationUnreadCount(conversation, userId),
    0,
  );
}

async function findConversationForUser(conversationId, userId) {
  if (!mongoose.isValidObjectId(conversationId)) {
    return null;
  }

  return Conversation.findOne({
    _id: conversationId,
    participants: userId,
  })
    .populate("participants", "_id name email avatarUrl isActive")
    .populate("lastMessageSenderId", "_id name email avatarUrl")
    .lean();
}

async function emitConversationToUser(userId, conversation, message = null) {
  const unreadCount = await countUnreadMessages(userId);

  emitToUser(userId, "chat:conversation:update", {
    conversation: mapConversationSummary(conversation, userId),
    message: message ? mapMessagePayload(message) : null,
    unreadCount,
  });
}

function buildReadReceiptPayload({ conversationId, messageIds, readAt, readerId }) {
  return {
    conversationId,
    messageIds,
    readAt,
    readerId,
  };
}

async function ensureDirectConversation(viewerId, targetUserId) {
  const participantKey = buildParticipantKey(viewerId, targetUserId);

  let conversation = await Conversation.findOne({ participantKey });

  if (!conversation) {
    conversation = await Conversation.create({
      participantKey,
      participants: [viewerId, targetUserId],
      unreadCounts: {
        [toIdString(viewerId)]: 0,
        [toIdString(targetUserId)]: 0,
      },
    });
  }

  return Conversation.findById(conversation._id)
    .populate("participants", "_id name email avatarUrl isActive")
    .populate("lastMessageSenderId", "_id name email avatarUrl")
    .lean();
}

export async function listConversations(req, res, next) {
  try {
    const userId = req.user.userId;

    const docs = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "_id name email avatarUrl isActive")
      .populate("lastMessageSenderId", "_id name email avatarUrl")
      .sort({ lastMessageAt: -1, updatedAt: -1, _id: -1 })
      .lean();

    const items = docs
      .filter((conversation) =>
        conversation.participants.some((item) => item?.isActive !== false),
      )
      .map((conversation) => mapConversationSummary(conversation, userId));

    const unreadCount = items.reduce(
      (sum, conversation) => sum + Number(conversation?.unreadCount || 0),
      0,
    );

    res.json({
      items,
      meta: {
        unreadCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getConversationMessages(req, res, next) {
  try {
    const userId = req.user.userId;
    const conversationId = req.params.conversationId;
    const limitRaw = Number(req.query.limit ?? 40);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 40;

    const conversation = await findConversationForUser(conversationId, userId);

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found." });
      return;
    }

    const messages = await Message.find({
      conversationId,
    })
      .populate("senderId", "_id name email avatarUrl")
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    res.json({
      conversation: mapConversationSummary(conversation, userId),
      items: messages.reverse().map((message) => mapMessagePayload(message)),
    });
  } catch (err) {
    next(err);
  }
}

export async function openDirectConversation(req, res, next) {
  try {
    const viewerId = req.user.userId;
    const targetUserId = req.params.userId;

    if (!mongoose.isValidObjectId(targetUserId)) {
      res.status(400).json({ message: "Invalid userId" });
      return;
    }

    if (viewerId === targetUserId) {
      res.status(400).json({ message: "Cannot open chat with yourself." });
      return;
    }

    const targetUser = await User.findById(targetUserId).select(
      "_id name email avatarUrl isActive",
    );

    if (!targetUser || targetUser.isActive === false) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const conversation = await ensureDirectConversation(viewerId, targetUserId);

    res.json({
      conversation: mapConversationSummary(conversation, viewerId),
    });
  } catch (err) {
    if (err?.code === 11000) {
      try {
        const conversation = await ensureDirectConversation(
          req.user.userId,
          req.params.userId,
        );

        res.json({
          conversation: mapConversationSummary(conversation, req.user.userId),
        });
        return;
      } catch (retryError) {
        next(retryError);
        return;
      }
    }

    next(err);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const senderId = req.user.userId;
    const conversationId = req.params.conversationId;
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

    if (!text) {
      res.status(400).json({ message: "Message cannot be empty." });
      return;
    }

    const conversationDoc = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
    });

    if (!conversationDoc) {
      res.status(404).json({ message: "Conversation not found." });
      return;
    }

    const participants = conversationDoc.participants.map((item) =>
      toIdString(item),
    );
    const recipientId = participants.find((item) => item !== senderId);

    if (!recipientId) {
      res.status(400).json({ message: "Recipient not found." });
      return;
    }

    const created = await Message.create({
      conversationId,
      senderId,
      recipientId,
      text,
    });

    const unreadCounts = {
      ...(conversationDoc.unreadCounts || {}),
      [senderId]: 0,
      [recipientId]:
        getConversationUnreadCount(conversationDoc, recipientId) + 1,
    };

    conversationDoc.lastMessageText = text;
    conversationDoc.lastMessageAt = created.createdAt;
    conversationDoc.lastMessageSenderId = senderId;
    conversationDoc.unreadCounts = unreadCounts;
    await conversationDoc.save();

    const [hydratedMessage, senderConversation, recipientConversation] =
      await Promise.all([
        Message.findById(created._id)
          .populate("senderId", "_id name email avatarUrl")
          .lean(),
        findConversationForUser(conversationId, senderId),
        findConversationForUser(conversationId, recipientId),
      ]);

    if (recipientConversation) {
      await emitConversationToUser(recipientId, recipientConversation, hydratedMessage);
    }

    res.status(201).json({
      ok: true,
      conversation: senderConversation
        ? mapConversationSummary(senderConversation, senderId)
        : null,
      message: hydratedMessage ? mapMessagePayload(hydratedMessage) : null,
      unreadCount: await countUnreadMessages(senderId),
    });
  } catch (err) {
    next(err);
  }
}

export async function markConversationRead(req, res, next) {
  try {
    const userId = req.user.userId;
    const conversationId = req.params.conversationId;

    const conversationDoc = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversationDoc) {
      res.status(404).json({ message: "Conversation not found." });
      return;
    }

    const now = new Date();
    const unreadMessages = await Message.find({
      conversationId,
      recipientId: userId,
      readAt: null,
    })
      .select("_id senderId")
      .lean();

    await Message.updateMany(
      {
        conversationId,
        recipientId: userId,
        readAt: null,
      },
      {
        $set: { readAt: now },
      },
    );

    conversationDoc.unreadCounts = {
      ...(conversationDoc.unreadCounts || {}),
      [userId]: 0,
    };
    await conversationDoc.save();

    const senderIds = [
      ...new Set(
        unreadMessages
          .map((message) => toIdString(message?.senderId))
          .filter(Boolean),
      ),
    ];

    await Promise.all(
      senderIds.map((senderId) =>
        emitToUser(
          senderId,
          "chat:messages:read",
          buildReadReceiptPayload({
            conversationId,
            messageIds: unreadMessages
              .filter((message) => toIdString(message?.senderId) === senderId)
              .map((message) => toIdString(message?._id))
              .filter(Boolean),
            readAt: now,
            readerId: userId,
          }),
        ),
      ),
    );

    const [conversation, senderConversation] = await Promise.all([
      findConversationForUser(conversationId, userId),
      senderIds[0] ? findConversationForUser(conversationId, senderIds[0]) : null,
    ]);

    if (senderIds[0] && senderConversation) {
      await emitConversationToUser(senderIds[0], senderConversation, null);
    }

    res.json({
      ok: true,
      conversation: conversation
        ? mapConversationSummary(conversation, userId)
        : null,
      unreadCount: await countUnreadMessages(userId),
    });
  } catch (err) {
    next(err);
  }
}
