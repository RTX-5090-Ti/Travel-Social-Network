import mongoose from "mongoose";
import Reaction from "../models/Reaction.js";
import Trip from "../models/Trip.js";

export async function toggleTripHeart(req, res, next) {
  try {
    const userId = req.user.userId;
    const tripId = req.params.id;

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const trip = await Trip.findById(tripId)
      .select("_id counts.reactions")
      .lean();
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const existed = await Reaction.findOne({
      targetType: "trip",
      targetId: tripId,
      userId,
    })
      .select("_id")
      .lean();

    let hearted = false;

    if (existed) {
      await Reaction.deleteOne({ _id: existed._id });
      await Trip.updateOne(
        { _id: tripId },
        { $inc: { "counts.reactions": -1 } },
      );
      hearted = false;
    } else {
      await Reaction.create({
        targetType: "trip",
        targetId: tripId,
        userId,
      });

      await Trip.updateOne(
        { _id: tripId },
        { $inc: { "counts.reactions": 1 } },
      );
      hearted = true;
    }

    const latestTrip = await Trip.findById(tripId)
      .select("counts.reactions")
      .lean();

    res.json({
      hearted,
      count: Math.max(0, latestTrip?.counts?.reactions || 0),
    });
  } catch (err) {
    if (err?.code === 11000) {
      const tripId = req.params.id;
      const userId = req.user.userId;

      try {
        const [trip, mine] = await Promise.all([
          Trip.findById(tripId).select("counts.reactions").lean(),
          Reaction.findOne({
            targetType: "trip",
            targetId: tripId,
            userId,
          })
            .select("_id")
            .lean(),
        ]);

        return res.status(200).json({
          hearted: !!mine,
          count: Math.max(0, trip?.counts?.reactions || 0),
        });
      } catch {
        return res.status(409).json({ message: "Duplicate reaction" });
      }
    }

    next(err);
  }
}

export async function getTripHeartSummary(req, res, next) {
  try {
    const tripId = req.params.id;
    const userId = req.user?.userId; // nếu route này requireAuth thì luôn có

    if (!mongoose.isValidObjectId(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const trip = await Trip.findById(tripId).select("counts.reactions").lean();
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    let hearted = false;
    if (userId) {
      const mine = await Reaction.findOne({
        targetType: "trip",
        targetId: tripId,
        userId,
      })
        .select("_id")
        .lean();

      hearted = !!mine;
    }

    res.json({
      count: trip.counts?.reactions || 0,
      hearted,
    });
  } catch (err) {
    next(err);
  }
}
