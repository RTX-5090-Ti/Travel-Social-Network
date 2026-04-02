import mongoose from "mongoose";

const MilestoneSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    time: { type: Date },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

MilestoneSchema.index({ tripId: 1, order: 1 });

export default mongoose.model("Milestone", MilestoneSchema);
