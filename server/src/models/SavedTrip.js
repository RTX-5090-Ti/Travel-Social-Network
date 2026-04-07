import mongoose from "mongoose";

const SavedTripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

SavedTripSchema.index({ userId: 1, tripId: 1 }, { unique: true });
SavedTripSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("SavedTrip", SavedTripSchema);
