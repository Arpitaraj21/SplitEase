import mongoose from "mongoose";

const { Schema } = mongoose;

const invitationSchema = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    invitedEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    invitedPhone: {
      type: String,
      trim: true,
    },
    method: {
      type: String,
      enum: ["email", "sms", "whatsapp", "in-app"],
      default: "in-app",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired"],
      default: "pending",
    },
    token: {
      type: String,
      unique: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  { timestamps: true }
);

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
