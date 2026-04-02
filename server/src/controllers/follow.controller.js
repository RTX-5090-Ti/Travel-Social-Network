import mongoose from "mongoose";
import Follow from "../models/Follow.js";

function mapUserItem(user, extra = {}) {
  return {
    _id: user?._id,
    name: user?.name || "Traveler",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || "",
    ...extra,
  };
}

export async function followUser(req, res, next) {
  try {
    const followerId = req.user.userId;
    const followingId = req.params.userId;

    if (!mongoose.isValidObjectId(followingId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    if (followerId === followingId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    await Follow.create({ followerId, followingId });

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

    if (!mongoose.isValidObjectId(followingId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

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

    if (!mongoose.isValidObjectId(followingId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

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
      Follow.countDocuments({ followingId: userId }),
      Follow.countDocuments({ followerId: userId }),
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

    const docs = await Follow.find({ followingId: currentUserId })
      .populate("followerId", "_id name email avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    const followerUsers = docs
      .map((doc) => doc.followerId)
      .filter(Boolean)
      .filter((user) => user?._id?.toString() !== currentUserId);

    const followerIds = followerUsers.map((user) => user._id);

    const myFollowDocs = followerIds.length
      ? await Follow.find({
          followerId: currentUserId,
          followingId: { $in: followerIds },
        })
          .select("followingId")
          .lean()
      : [];

    const followedSet = new Set(
      myFollowDocs.map((item) => item.followingId.toString()),
    );

    const items = followerUsers.map((user) =>
      mapUserItem(user, {
        followedByMe: followedSet.has(user._id.toString()),
      }),
    );

    res.json({
      items,
      meta: {
        total: items.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listFollowing(req, res, next) {
  try {
    const currentUserId = req.user.userId;

    const docs = await Follow.find({ followerId: currentUserId })
      .populate("followingId", "_id name email avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    const followingUsers = docs
      .map((doc) => doc.followingId)
      .filter(Boolean)
      .filter((user) => user?._id?.toString() !== currentUserId);

    const items = followingUsers.map((user) =>
      mapUserItem(user, {
        followedByMe: true,
      }),
    );

    res.json({
      items,
      meta: {
        total: items.length,
      },
    });
  } catch (err) {
    next(err);
  }
}
