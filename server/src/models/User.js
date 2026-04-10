import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {
  PROFILE_LOCATION_OPTIONS,
  TRAVEL_STYLE_KEYS,
} from "../constants/profile.constants.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },

    //  phân luồng sẵn từ đầu
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    deletionRequestedAt: { type: Date, default: null, index: true },
    scheduledDeletionAt: { type: Date, default: null, index: true },

    avatarUrl: {
      type: String,
      default: "",
      trim: true,
    },

    coverUrl: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },

    location: {
      type: String,
      enum: ["", ...PROFILE_LOCATION_OPTIONS],
      default: "",
      trim: true,
    },

    travelStyle: {
      type: String,
      enum: ["", ...TRAVEL_STYLE_KEYS],
      default: "",
      trim: true,
    },

    pinnedTripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    //  để sau làm refresh/logout “chuẩn sản phẩm”
    refreshTokenHash: { type: String, default: null },
    lastSeenAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
