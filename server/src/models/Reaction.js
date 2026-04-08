import mongoose from "mongoose";

const ReactionSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["trip", "comment"],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// 1 user chỉ được thả tim 1 lần cho 1 trip
ReactionSchema.index(
  { targetType: 1, targetId: 1, userId: 1 },
  { unique: true },
);
// giúp đếm nhanh
ReactionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export default mongoose.model("Reaction", ReactionSchema);
