import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number },
    bytes: { type: Number },
  },
  { _id: false },
);

const TripItemSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Milestone",
      default: null,
      index: true,
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: { type: String, trim: true, maxlength: 5000 },
    media: { type: [MediaSchema], default: [] },

    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

TripItemSchema.index({ tripId: 1, milestoneId: 1, order: 1 });
TripItemSchema.index({ createdAt: -1 });

export default mongoose.model("TripItem", TripItemSchema);
