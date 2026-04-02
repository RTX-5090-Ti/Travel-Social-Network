import Follow from "../models/Follow.js";
import mongoose from "mongoose";

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
    // đã follow rồi thì coi như ok
    if (err?.code === 11000) return res.status(200).json({ followed: true });
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

// optional: check follow status
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
