import mongoose from "mongoose";

const { Schema } = mongoose;

const settlementSchema = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paidTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Settlement = mongoose.model("Settlement", settlementSchema);

export default Settlement;
