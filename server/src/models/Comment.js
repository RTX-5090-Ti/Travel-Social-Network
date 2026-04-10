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

    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    replyToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    counts: {
      reactions: { type: Number, default: 0 },
    },

    content: { type: String, default: "", trim: true, maxlength: 1000 },
    image: {
      url: {
        type: String,
        default: "",
        trim: true,
      },
      publicId: {
        type: String,
        default: "",
        trim: true,
      },
      width: {
        type: Number,
        default: null,
      },
      height: {
        type: Number,
        default: null,
      },
      mediaType: {
        type: String,
        enum: ["image", "gif"],
        default: "image",
      },
    },
  },
  { timestamps: true },
);

CommentSchema.index({ targetType: 1, targetId: 1, createdAt: -1, _id: -1 });
CommentSchema.index({
  targetType: 1,
  targetId: 1,
  parentCommentId: 1,
  createdAt: -1,
  _id: -1,
});

CommentSchema.pre("validate", function ensureCommentContent() {
  const hasContent =
    typeof this.content === "string" && this.content.trim().length > 0;
  const hasImage =
    this.image &&
    typeof this.image.url === "string" &&
    this.image.url.trim().length > 0;

  if (!hasContent && !hasImage) {
    this.invalidate("content", "Comment must contain text or media.");
  }
});

export default mongoose.model("Comment", CommentSchema);
