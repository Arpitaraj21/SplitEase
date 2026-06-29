import mongoose from "mongoose";

const { Schema } = mongoose;

const directExpenseSchema = new Schema(
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
    owedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    splitType: {
      type: String,
      enum: ["full", "equal"],
      default: "equal",
      // "full" = owedBy owes the full amount
      // "equal" = split equally (owedBy owes half)
    },
    owedAmount: {
      type: Number,
      required: true,
      // The actual amount owed (half if equal, full if full)
    },
    category: {
      type: String,
      enum: ["food", "transport", "shopping", "entertainment", "utilities", "rent", "healthcare", "other"],
      default: "other",
    },
    settled: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const DirectExpense = mongoose.model("DirectExpense", directExpenseSchema);

export default DirectExpense;
