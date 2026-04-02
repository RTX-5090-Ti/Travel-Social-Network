import mongoose from "mongoose";

const FeedPreviewMediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], default: "image" },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    duration: { type: Number, default: null },
    milestoneTitle: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const TripSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 120 },
    caption: { type: String, trim: true, maxlength: 2000 },

    privacy: {
      type: String,
      enum: ["public", "followers", "protected", "private"],
      default: "public",
      index: true,
    },

    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    coverUrl: { type: String },

    counts: {
      reactions: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    },

    feedPreview: {
      milestoneCount: { type: Number, default: 0 },
      mediaCount: { type: Number, default: 0 },
      imageCount: { type: Number, default: 0 },
      videoCount: { type: Number, default: 0 },
      hasMoreMedia: { type: Boolean, default: false },
      previewMedia: { type: [FeedPreviewMediaSchema], default: [] },
    },
  },
  { timestamps: true },
);

TripSchema.index({ createdAt: -1 });

export default mongoose.model("Trip", TripSchema);
