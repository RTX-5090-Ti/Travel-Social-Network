import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
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
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

MessageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 });
MessageSchema.index({ recipientId: 1, readAt: 1, createdAt: -1, _id: -1 });

MessageSchema.pre("validate", function ensureMessageContent() {
  const hasText = typeof this.text === "string" && this.text.trim().length > 0;
  const hasImage =
    this.image &&
    typeof this.image.url === "string" &&
    this.image.url.trim().length > 0;

  if (!hasText && !hasImage) {
    this.invalidate("text", "Message must contain text or an image.");
  }
});

export default mongoose.model("Message", MessageSchema);
