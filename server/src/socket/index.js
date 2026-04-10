import { Server } from "socket.io";

import User from "../models/User.js";
import { isAccountActive } from "../utils/accountState.js";
import { verifyAccessToken } from "../utils/jwt.js";

let ioInstance = null;
const onlineSocketsByUserId = new Map();

function getOnlineUserIds() {
  return [...onlineSocketsByUserId.entries()]
    .filter(([, socketIds]) => socketIds && socketIds.size > 0)
    .map(([userId]) => userId);
}

function emitPresenceSnapshot(socket) {
  socket.emit("presence:snapshot", {
    onlineUserIds: getOnlineUserIds(),
  });
}

function emitPresenceUpdate(payload) {
  if (!ioInstance) return;
  ioInstance.emit("presence:update", payload);
}

async function markUserLastSeen(userId, date = new Date()) {
  if (!userId) return;

  try {
    await User.findByIdAndUpdate(userId, {
      $set: { lastSeenAt: date },
    });
  } catch {
    // Bo qua loi cap nhat presence nen.
  }
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) return acc;

      const key = part.slice(0, separatorIndex).trim();
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());

      if (key) {
        acc[key] = value;
      }

      return acc;
    }, {});
}

export function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN,
      credentials: true,
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers?.cookie || "");
      const token = cookies.accessToken;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select(
        "_id role isActive scheduledDeletionAt",
      );

      if (!user || !isAccountActive(user)) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = {
        userId: user._id.toString(),
        role: user.role || decoded.role,
      };

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = socket.data?.user?.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      const nextSocketIds = new Set(onlineSocketsByUserId.get(userId) || []);
      const wasOffline = nextSocketIds.size === 0;
      nextSocketIds.add(socket.id);
      onlineSocketsByUserId.set(userId, nextSocketIds);

      emitPresenceSnapshot(socket);

      if (wasOffline) {
        emitPresenceUpdate({
          userId,
          isOnline: true,
          lastSeenAt: null,
        });
      }
    }

    socket.on("disconnect", () => {
      const disconnectUserId = socket.data?.user?.userId;
      if (!disconnectUserId) return;

      const nextSocketIds = new Set(
        onlineSocketsByUserId.get(disconnectUserId) || [],
      );
      nextSocketIds.delete(socket.id);

      if (nextSocketIds.size > 0) {
        onlineSocketsByUserId.set(disconnectUserId, nextSocketIds);
        return;
      }

      onlineSocketsByUserId.delete(disconnectUserId);

      const lastSeenAt = new Date();
      void markUserLastSeen(disconnectUserId, lastSeenAt);
      emitPresenceUpdate({
        userId: disconnectUserId,
        isOnline: false,
        lastSeenAt,
      });
    });
  });

  return ioInstance;
}

export function emitToUser(userId, eventName, payload) {
  if (!ioInstance || !userId || !eventName) {
    return;
  }

  ioInstance.to(`user:${userId}`).emit(eventName, payload);
}

export function getIO() {
  return ioInstance;
}

export function isUserOnline(userId) {
  if (!userId) return false;
  return (onlineSocketsByUserId.get(userId)?.size || 0) > 0;
}
