import mongoose from "mongoose";

const HiddenTripSchema = new mongoose.Schema(
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
    hiddenAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    hideExpiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

HiddenTripSchema.index({ userId: 1, tripId: 1 }, { unique: true });
HiddenTripSchema.index({ userId: 1, hideExpiresAt: 1 });

export default mongoose.model("HiddenTrip", HiddenTripSchema);
