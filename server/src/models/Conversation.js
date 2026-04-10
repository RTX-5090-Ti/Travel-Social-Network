import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participantKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      ],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: "A direct conversation must have exactly two participants.",
      },
      index: true,
    },
    lastMessageText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastMessageSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    unreadCounts: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    clearedAtByUser: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

ConversationSchema.index({ participants: 1, lastMessageAt: -1, _id: -1 });

export default mongoose.model("Conversation", ConversationSchema);
