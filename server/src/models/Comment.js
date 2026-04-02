import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ["trip"], required: true, index: true },
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

    content: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

CommentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export default mongoose.model("Comment", CommentSchema);
