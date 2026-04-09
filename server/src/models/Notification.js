import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "follow",
        "trip_comment",
        "comment_reply",
        "trip_like",
        "comment_like",
      ],
      required: true,
      index: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
      index: true,
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

NotificationSchema.index({ recipientUserId: 1, createdAt: -1, _id: -1 });
NotificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1, _id: -1 });

export default mongoose.model("Notification", NotificationSchema);
