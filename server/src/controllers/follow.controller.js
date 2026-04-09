import mongoose from "mongoose";

import Follow from "../models/Follow.js";
import User from "../models/User.js";
import { createNotification } from "../services/notification.service.js";

function mapUserItem(user, extra = {}) {
  return {
    _id: user?._id,
    name: user?.name || "Traveler",
    avatarUrl: user?.avatarUrl || "",
    ...extra,
  };
}

function parsePagination(query) {
  const pageRaw = Number(query.page ?? 1);
  const limitRaw = Number(query.limit ?? 12);

  const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 50)
    : 12;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

async function ensureUserExists(userId) {
  const exists = await User.exists({ _id: userId, isActive: { $ne: false } });
  return !!exists;
}

async function countActiveFollowUsers({ matchField, targetUserId, joinField }) {
  const results = await Follow.aggregate([
    {
      $match: {
        [matchField]: new mongoose.Types.ObjectId(targetUserId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: joinField,
        foreignField: "_id",
        as: "relatedUser",
      },
    },
    { $unwind: "$relatedUser" },
    { $match: { "relatedUser.isActive": { $ne: false } } },
    { $count: "total" },
  ]);

  return results[0]?.total || 0;
}

async function validateTargetUser(userId, res) {
  if (!mongoose.isValidObjectId(userId)) {
    res.status(400).json({ message: "Invalid userId" });
    return false;
  }

  const exists = await ensureUserExists(userId);
  if (!exists) {
    res.status(404).json({ message: "User not found" });
    return false;
  }

  return true;
}

async function listFollowUsers({
  targetUserId,
  viewerId,
  mode,
  page = 1,
  limit = 12,
}) {
  const isFollowersMode = mode === "followers";

  const baseFilter = isFollowersMode
    ? { followingId: targetUserId }
    : { followerId: targetUserId };

  const populatePath = isFollowersMode ? "followerId" : "followingId";

  const [docs, total] = await Promise.all([
    Follow.find(baseFilter)
      .populate(populatePath, "_id name avatarUrl isActive")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    countActiveFollowUsers({
      matchField: isFollowersMode ? "followingId" : "followerId",
      targetUserId,
      joinField: isFollowersMode ? "followerId" : "followingId",
    }),
  ]);

  const users = docs
    .map((doc) => doc?.[populatePath])
    .filter(Boolean)
    .filter((user) => user?.isActive !== false)
    .filter((user) => user?._id?.toString() !== targetUserId);

  const relatedUserIds = users.map((user) => user._id);

  const myFollowDocs =
    viewerId && relatedUserIds.length
      ? await Follow.find({
          followerId: viewerId,
          followingId: { $in: relatedUserIds },
        })
          .select("followingId")
          .lean()
      : [];

  const followedSet = new Set(
    myFollowDocs.map((item) => item.followingId.toString()),
  );

  const items = users.map((user) =>
    mapUserItem(user, {
      id: user?._id,
      followedByMe:
        viewerId && user?._id?.toString() !== viewerId
          ? followedSet.has(user._id.toString())
          : false,
    }),
  );

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: page * limit < total,
    },
  };
}

export async function followUser(req, res, next) {
  try {
    const followerId = req.user.userId;
    const followingId = req.params.userId;

    const isValidTarget = await validateTargetUser(followingId, res);
    if (!isValidTarget) return;

    if (followerId === followingId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    await Follow.create({ followerId, followingId });
    await createNotification({
      recipientUserId: followingId,
      actorUserId: followerId,
      type: "follow",
    });

    res.status(201).json({ followed: true });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(200).json({ followed: true });
    }
    next(err);
  }
}

export async function unfollowUser(req, res, next) {
  try {
    const followerId = req.user.userId;
    const followingId = req.params.userId;

    const isValidTarget = await validateTargetUser(followingId, res);
    if (!isValidTarget) return;

    if (followerId === followingId) {
      return res.status(400).json({ message: "Cannot unfollow yourself" });
    }

    await Follow.deleteOne({ followerId, followingId });

    res.json({ followed: false });
  } catch (err) {
    next(err);
  }
}

export async function getFollowStatus(req, res, next) {
  try {
    const followerId = req.user.userId;
    const followingId = req.params.userId;

    const isValidTarget = await validateTargetUser(followingId, res);
    if (!isValidTarget) return;

    const doc = await Follow.findOne({ followerId, followingId })
      .select("_id")
      .lean();

    res.json({ followed: !!doc });
  } catch (err) {
    next(err);
  }
}

export async function getFollowSummary(req, res, next) {
  try {
    const userId = req.user.userId;

    const [followersCount, followingCount] = await Promise.all([
      countActiveFollowUsers({
        matchField: "followingId",
        targetUserId: userId,
        joinField: "followerId",
      }),
      countActiveFollowUsers({
        matchField: "followerId",
        targetUserId: userId,
        joinField: "followingId",
      }),
    ]);

    res.json({
      followersCount,
      followingCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function listFollowers(req, res, next) {
  try {
    const currentUserId = req.user.userId;
    const { page, limit } = parsePagination(req.query);

    const result = await listFollowUsers({
      targetUserId: currentUserId,
      viewerId: currentUserId,
      mode: "followers",
      page,
      limit,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listFollowing(req, res, next) {
  try {
    const currentUserId = req.user.userId;
    const { page, limit } = parsePagination(req.query);

    const result = await listFollowUsers({
      targetUserId: currentUserId,
      viewerId: currentUserId,
      mode: "following",
      page,
      limit,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listFollowersByUserId(req, res, next) {
  try {
    const viewerId = req.user.userId;
    const targetUserId = req.params.userId;
    const { page, limit } = parsePagination(req.query);

    const isValidTarget = await validateTargetUser(targetUserId, res);
    if (!isValidTarget) return;

    const result = await listFollowUsers({
      targetUserId,
      viewerId,
      mode: "followers",
      page,
      limit,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listFollowingByUserId(req, res, next) {
  try {
    const viewerId = req.user.userId;
    const targetUserId = req.params.userId;
    const { page, limit } = parsePagination(req.query);

    const isValidTarget = await validateTargetUser(targetUserId, res);
    if (!isValidTarget) return;

    const result = await listFollowUsers({
      targetUserId,
      viewerId,
      mode: "following",
      page,
      limit,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}
