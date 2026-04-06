import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import { getTripAccessContext } from "../utils/tripVisibility.js";
import Trip from "../models/Trip.js";

// POST /api/trips/:id/comments
export async function createTripComment(req, res, next) {
  try {
    const userId = req.user.userId;
    const tripId = req.params.id;
    const content = req.body?.content?.trim();

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const { trip, canView } = await getTripAccessContext({
      tripId,
      viewerId: userId,
    });

    if (!trip || !canView) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const created = await Comment.create({
      targetType: "trip",
      targetId: tripId,
      userId,
      content,
    });

    await Trip.updateOne({ _id: tripId }, { $inc: { "counts.comments": 1 } });

    const comment = await Comment.findById(created._id)
      .populate("userId", "name avatarUrl")
      .lean();

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}

// GET /api/trips/:id/comments?limit=20&cursor=...
// cursor = createdAt của item cuối (ISO string)
export async function listTripComments(req, res, next) {
  try {
    const tripId = req.params.id;
    const viewerId = req.user.userId;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const limitRaw = Number(req.query.limit ?? 20);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 20;

    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const { trip, canView } = await getTripAccessContext({
      tripId,
      viewerId,
    });

    if (!trip || !canView) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const filter = {
      targetType: "trip",
      targetId: tripId,
    };

    // pagination kiểu “load older”
    if (cursor && !Number.isNaN(cursor.getTime())) {
      filter.createdAt = { $lt: cursor };
    }

    // lấy mới -> cũ, UI muốn hiển thị cũ -> mới thì đảo lại
    const docs = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("userId", "name avatarUrl")
      .lean();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;

    const nextCursor = items.length
      ? items[items.length - 1].createdAt.toISOString()
      : null;

    items.reverse();

    res.json({
      comments: items,
      page: { limit, hasMore, nextCursor },
    });
  } catch (err) {
    next(err);
  }
}
