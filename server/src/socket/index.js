import { Server } from "socket.io";

import User from "../models/User.js";
import { isAccountActive } from "../utils/accountState.js";
import { verifyAccessToken } from "../utils/jwt.js";

let ioInstance = null;

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
    }
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
