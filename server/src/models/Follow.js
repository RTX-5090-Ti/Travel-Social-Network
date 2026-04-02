import mongoose from "mongoose";

const FollowSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// chống follow trùng
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export default mongoose.model("Follow", FollowSchema);
