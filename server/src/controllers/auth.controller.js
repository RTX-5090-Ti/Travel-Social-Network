import crypto from "crypto";
import User from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { getCookieOptions } from "../utils/cookie.js";
import { buildAccountDeletionSchedule } from "../services/accountDeletionCleanup.service.js";

// Biến chuổi thành mã hash sha256 (hash refresh token rồi lưu vào DB)
function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function buildAuthUserPayload(user) {
  return {
    _id: user._id,
    id: user._id,
    name: user.name || "Traveler",
    email: user.email || "",
    role: user.role,
    avatarUrl: user.avatarUrl || "",
    coverUrl: user.coverUrl || "",
    bio: user.bio || "",
    location: user.location || "",
    travelStyle: user.travelStyle || "",
    pinnedTripId: user.pinnedTripId || null,
  };
}

function sendInactiveAccountResponse(res) {
  return res.status(403).json({
    code: "ACCOUNT_DEACTIVATED",
    message: "Account is deactivated",
  });
}

function formatDeletionRemainingLabel(scheduledDeletionAt) {
  const remainingMs = Math.max(
    new Date(scheduledDeletionAt).getTime() - Date.now(),
    0,
  );
  const DAY_MS = 24 * 60 * 60 * 1000;

  if (remainingMs < DAY_MS) {
    return "Less than 24 hours remaining";
  }

  const days = Math.ceil(remainingMs / DAY_MS);
  return `${days} day${days === 1 ? "" : "s"} remaining`;
}

function sendPendingDeletionResponse(res, user) {
  return res.status(403).json({
    code: "ACCOUNT_PENDING_DELETION",
    message: "Account is pending deletion",
    scheduledDeletionAt: user.scheduledDeletionAt,
    remainingLabel: formatDeletionRemainingLabel(user.scheduledDeletionAt),
  });
}

// Đăng kí
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = normalizeEmail(email);
    const normalizedName = name.trim();

    const existed = await User.findOne({ email: normalizedEmail });
    if (existed) {
      res.status(409);
      throw new Error("Email already exists");
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
    });

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshTokenHash = sha256(refreshToken);
    await user.save();

    const opts = getCookieOptions();
    res.cookie("accessToken", accessToken, { ...opts, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, {
      ...opts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Registered",
      user: buildAuthUserPayload(user),
    });
  } catch (e) {
    next(e);
  }
}

// Đăng nhập
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    if (user.scheduledDeletionAt) {
      return sendPendingDeletionResponse(res, user);
    }

    if (user.isActive === false) {
      return sendInactiveAccountResponse(res);
    }

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshTokenHash = sha256(refreshToken);
    await user.save();

    const opts = getCookieOptions();
    res.cookie("accessToken", accessToken, { ...opts, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, {
      ...opts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Logged in",
      user: buildAuthUserPayload(user),
    });
  } catch (e) {
    next(e);
  }
}

// Cấp lại access token mới khi access token hết hạn
export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    const decoded = verifyRefreshToken(token); // { userId, role, iat, exp }
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokenHash || user.isActive === false) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    // So khớp refresh token hiện tại (hash)
    if (user.refreshTokenHash !== sha256(token)) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    // Rotate refresh token
    const payload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    user.refreshTokenHash = sha256(newRefreshToken);
    await user.save();

    const opts = getCookieOptions();
    res.cookie("accessToken", newAccessToken, {
      ...opts,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
      ...opts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Refreshed" });
  } catch (e) {
    next(e);
  }
}

// Đăng xuất
export async function logout(req, res, next) {
  try {
    const opts = getCookieOptions();

    // nếu muốn chắc: xóa refreshTokenHash theo cookie refreshToken
    const token = req.cookies?.refreshToken;
    if (token) {
      const decoded = (() => {
        try {
          return verifyRefreshToken(token);
        } catch {
          return null;
        }
      })();
      if (decoded?.userId) {
        await User.findByIdAndUpdate(decoded.userId, {
          refreshTokenHash: null,
        });
      }
    }

    res.clearCookie("accessToken", opts);
    res.clearCookie("refreshToken", opts);

    res.json({ message: "Logged out" });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select(
      "_id name email role avatarUrl coverUrl bio location travelStyle pinnedTripId",
    );

    if (!user || user.isActive === false) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    res.json({
      user: buildAuthUserPayload(user),
    });
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      res.status(400);
      throw new Error("Confirm password does not match.");
    }

    if (currentPassword === newPassword) {
      res.status(400);
      throw new Error("New password must be different from current password.");
    }

    const user = await User.findById(req.user.userId);
    if (!user || user.isActive === false) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    const passwordOk = await user.comparePassword(currentPassword);
    if (!passwordOk) {
      res.status(400);
      throw new Error("Current password is incorrect.");
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully." });
  } catch (e) {
    next(e);
  }
}

export async function deactivateAccount(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    user.isActive = false;
    user.refreshTokenHash = null;
    user.deletionRequestedAt = null;
    user.scheduledDeletionAt = null;
    await user.save();

    const opts = getCookieOptions();
    res.clearCookie("accessToken", opts);
    res.clearCookie("refreshToken", opts);

    res.json({ message: "Account deactivated successfully" });
  } catch (e) {
    next(e);
  }
}

export async function requestAccountDeletion(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    const requestedAt = new Date();
    const scheduledDeletionAt = buildAccountDeletionSchedule(requestedAt);

    user.isActive = false;
    user.refreshTokenHash = null;
    user.deletionRequestedAt = requestedAt;
    user.scheduledDeletionAt = scheduledDeletionAt;
    await user.save();

    const opts = getCookieOptions();
    res.clearCookie("accessToken", opts);
    res.clearCookie("refreshToken", opts);

    res.json({
      message: "Account scheduled for deletion",
      deletionRequestedAt: requestedAt,
      scheduledDeletionAt,
      remainingLabel: formatDeletionRemainingLabel(scheduledDeletionAt),
    });
  } catch (e) {
    next(e);
  }
}

export async function reactivateAccount(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    user.isActive = true;
    user.deletionRequestedAt = null;
    user.scheduledDeletionAt = null;

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshTokenHash = sha256(refreshToken);
    await user.save();

    const opts = getCookieOptions();
    res.cookie("accessToken", accessToken, { ...opts, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, {
      ...opts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Account reactivated successfully",
      user: buildAuthUserPayload(user),
    });
  } catch (e) {
    next(e);
  }
}
