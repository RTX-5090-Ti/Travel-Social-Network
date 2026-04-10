import mongoose from "mongoose";
import { unlink } from "fs/promises";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { cloudinary } from "../config/cloudinary.js";
import { emitToUser } from "../socket/index.js";

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

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
    lastSeenAt: user?.lastSeenAt || null,
  };
}

function getConversationUnreadCount(conversation, userId) {
  const unreadCounts = conversation?.unreadCounts || {};
  const rawValue = unreadCounts?.[userId];
  const parsed = Number(rawValue || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getConversationClearedAt(conversation, userId) {
  const clearedAtByUser = conversation?.clearedAtByUser || {};
  const rawValue = clearedAtByUser?.[userId];
  if (!rawValue) return null;

  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isConversationVisibleForUser(conversation, userId) {
  const clearedAt = getConversationClearedAt(conversation, userId);
  if (!clearedAt) return true;

  const lastMessageAt = conversation?.lastMessageAt
    ? new Date(conversation.lastMessageAt)
    : null;

  if (!lastMessageAt || Number.isNaN(lastMessageAt.getTime())) {
    return false;
  }

  return lastMessageAt.getTime() > clearedAt.getTime();
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
    sender: message?.senderId?.name ? mapUserSummary(message.senderId) : null,
    text: message?.text || "",
    image: message?.image?.url
      ? {
          url: message.image.url,
          publicId: message.image.publicId || "",
          width: message.image.width ?? null,
          height: message.image.height ?? null,
          mediaType: message.image.mediaType || "image",
        }
      : null,
    readAt: message?.readAt || null,
    createdAt: message?.createdAt,
    updatedAt: message?.updatedAt,
  };
}

function uploadFilePathToCloudinary(filePath, options) {
  return cloudinary.uploader.upload(filePath, options);
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
    .populate("participants", "_id name email avatarUrl isActive lastSeenAt")
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
    .populate("participants", "_id name email avatarUrl isActive lastSeenAt")
    .populate("lastMessageSenderId", "_id name email avatarUrl")
    .lean();
}

export async function listConversations({ userId }) {
  const docs = await Conversation.find({
    participants: userId,
  })
    .populate("participants", "_id name email avatarUrl isActive lastSeenAt")
    .populate("lastMessageSenderId", "_id name email avatarUrl")
    .sort({ lastMessageAt: -1, updatedAt: -1, _id: -1 })
    .lean();

  const items = docs
    .filter(
      (conversation) =>
        conversation.participants.some((item) => item?.isActive !== false) &&
        isConversationVisibleForUser(conversation, userId),
    )
    .map((conversation) => mapConversationSummary(conversation, userId));

  const unreadCount = items.reduce(
    (sum, conversation) => sum + Number(conversation?.unreadCount || 0),
    0,
  );

  return {
    items,
    meta: {
      unreadCount,
    },
  };
}

export async function getConversationMessages({
  userId,
  conversationId,
  limit = 40,
}) {
  const conversation = await findConversationForUser(conversationId, userId);

  if (!conversation) {
    throw createHttpError(404, "Conversation not found.");
  }

  const clearedAt = getConversationClearedAt(conversation, userId);
  const messageQuery = {
    conversationId,
  };

  if (clearedAt) {
    messageQuery.createdAt = { $gt: clearedAt };
  }

  const messages = await Message.find(messageQuery)
    .populate("senderId", "_id name email avatarUrl")
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  return {
    conversation: mapConversationSummary(conversation, userId),
    items: messages.reverse().map((message) => mapMessagePayload(message)),
  };
}

export async function openDirectConversation({ viewerId, targetUserId }) {
  if (viewerId === targetUserId) {
    throw createHttpError(400, "Cannot open chat with yourself.");
  }

  try {
    const targetUser = await User.findById(targetUserId).select(
      "_id name email avatarUrl isActive lastSeenAt",
    );

    if (!targetUser || targetUser.isActive === false) {
      throw createHttpError(404, "User not found.");
    }

    const conversation = await ensureDirectConversation(viewerId, targetUserId);

    return {
      conversation: mapConversationSummary(conversation, viewerId),
    };
  } catch (err) {
    if (err?.code === 11000) {
      const conversation = await ensureDirectConversation(viewerId, targetUserId);
      return {
        conversation: mapConversationSummary(conversation, viewerId),
      };
    }

    throw err;
  }
}

export async function sendMessage({
  senderId,
  conversationId,
  text,
}) {
  const conversationDoc = await Conversation.findOne({
    _id: conversationId,
    participants: senderId,
  });

  if (!conversationDoc) {
    throw createHttpError(404, "Conversation not found.");
  }

  const participants = conversationDoc.participants.map((item) => toIdString(item));
  const recipientId = participants.find((item) => item !== senderId);

  if (!recipientId) {
    throw createHttpError(400, "Recipient not found.");
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
    [recipientId]: getConversationUnreadCount(conversationDoc, recipientId) + 1,
  };

  conversationDoc.clearedAtByUser = {
    ...(conversationDoc.clearedAtByUser || {}),
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

  return {
    ok: true,
    conversation: senderConversation
      ? mapConversationSummary(senderConversation, senderId)
      : null,
    message: hydratedMessage ? mapMessagePayload(hydratedMessage) : null,
    unreadCount: await countUnreadMessages(senderId),
  };
}

export async function sendImageMessage({
  senderId,
  conversationId,
  text = "",
  imageFile,
}) {
  let uploadedImage = null;

  try {
    if (!imageFile) {
      throw createHttpError(400, "Image is required.");
    }

    const conversationDoc = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
    });

    if (!conversationDoc) {
      await unlink(imageFile.path).catch(() => {});
      throw createHttpError(404, "Conversation not found.");
    }

    const participants = conversationDoc.participants.map((item) => toIdString(item));
    const recipientId = participants.find((item) => item !== senderId);

    if (!recipientId) {
      await unlink(imageFile.path).catch(() => {});
      throw createHttpError(400, "Recipient not found.");
    }

    try {
      const result = await uploadFilePathToCloudinary(imageFile.path, {
        folder: `chat/${conversationId}`,
        resource_type: "image",
      });

      uploadedImage = {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width ?? null,
        height: result.height ?? null,
      };
    } finally {
      await unlink(imageFile.path).catch(() => {});
    }

    const created = await Message.create({
      conversationId,
      senderId,
      recipientId,
      text,
      image: uploadedImage,
    });

    const unreadCounts = {
      ...(conversationDoc.unreadCounts || {}),
      [senderId]: 0,
      [recipientId]: getConversationUnreadCount(conversationDoc, recipientId) + 1,
    };

    conversationDoc.clearedAtByUser = {
      ...(conversationDoc.clearedAtByUser || {}),
    };
    conversationDoc.lastMessageText = text || "Đã gửi ảnh";
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

    return {
      ok: true,
      conversation: senderConversation
        ? mapConversationSummary(senderConversation, senderId)
        : null,
      message: hydratedMessage ? mapMessagePayload(hydratedMessage) : null,
      unreadCount: await countUnreadMessages(senderId),
    };
  } catch (err) {
    console.error("Chat image upload failed:", err);

    if (uploadedImage?.publicId) {
      await cloudinary.uploader
        .destroy(uploadedImage.publicId, { resource_type: "image" })
        .catch(() => {});
    }

    if (imageFile?.path) {
      await unlink(imageFile.path).catch(() => {});
    }

    throw err;
  }
}

export async function sendGifMessage({
  senderId,
  conversationId,
  text = "",
  gifUrl,
  width = null,
  height = null,
}) {
  const conversationDoc = await Conversation.findOne({
    _id: conversationId,
    participants: senderId,
  });

  if (!conversationDoc) {
    throw createHttpError(404, "Conversation not found.");
  }

  const participants = conversationDoc.participants.map((item) => toIdString(item));
  const recipientId = participants.find((item) => item !== senderId);

  if (!recipientId) {
    throw createHttpError(400, "Recipient not found.");
  }

  const created = await Message.create({
    conversationId,
    senderId,
    recipientId,
    text,
    image: {
      url: gifUrl,
      publicId: "",
      width: Number.isFinite(width) ? width : null,
      height: Number.isFinite(height) ? height : null,
      mediaType: "gif",
    },
  });

  const unreadCounts = {
    ...(conversationDoc.unreadCounts || {}),
    [senderId]: 0,
    [recipientId]: getConversationUnreadCount(conversationDoc, recipientId) + 1,
  };

  conversationDoc.clearedAtByUser = {
    ...(conversationDoc.clearedAtByUser || {}),
  };
  conversationDoc.lastMessageText = text || "Đã gửi GIF";
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

  return {
    ok: true,
    conversation: senderConversation
      ? mapConversationSummary(senderConversation, senderId)
      : null,
    message: hydratedMessage ? mapMessagePayload(hydratedMessage) : null,
    unreadCount: await countUnreadMessages(senderId),
  };
}

export async function markConversationRead({ userId, conversationId }) {
  const conversationDoc = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversationDoc) {
    throw createHttpError(404, "Conversation not found.");
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

  return {
    ok: true,
    conversation: conversation ? mapConversationSummary(conversation, userId) : null,
    unreadCount: await countUnreadMessages(userId),
  };
}

export async function deleteSelectedConversations({
  userId,
  conversationIds = [],
}) {
  const normalizedIds = Array.isArray(conversationIds)
    ? [
        ...new Set(
          conversationIds
            .map((item) => toIdString(item))
            .filter((item) => mongoose.isValidObjectId(item)),
        ),
      ]
    : [];

  if (!normalizedIds.length) {
    throw createHttpError(400, "No conversations selected.");
  }

  const docs = await Conversation.find({
    _id: { $in: normalizedIds },
    participants: userId,
  });

  if (!docs.length) {
    return {
      ok: true,
      deletedIds: [],
      unreadCount: await countUnreadMessages(userId),
    };
  }

  const now = new Date();

  await Promise.all(
    docs.map(async (conversationDoc) => {
      conversationDoc.clearedAtByUser = {
        ...(conversationDoc.clearedAtByUser || {}),
        [userId]: now,
      };
      conversationDoc.unreadCounts = {
        ...(conversationDoc.unreadCounts || {}),
        [userId]: 0,
      };
      await conversationDoc.save();
    }),
  );

  return {
    ok: true,
    deletedIds: docs.map((doc) => toIdString(doc?._id)).filter(Boolean),
    unreadCount: await countUnreadMessages(userId),
  };
}
