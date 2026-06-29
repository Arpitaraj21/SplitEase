import mongoose from "mongoose";

const { Schema } = mongoose;

const expenseSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    splitType: {
      type: String,
      enum: ["equal", "percentage", "exact", "you_owe", "they_owe"],
      default: "equal",
    },
    splits: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        percentage: {
          type: Number,
        },
      },
    ],
    category: {
      type: String,
      enum: [
        "food",
        "transport",
        "shopping",
        "entertainment",
        "utilities",
        "rent",
        "healthcare",
        "other",
      ],
      default: "other",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
