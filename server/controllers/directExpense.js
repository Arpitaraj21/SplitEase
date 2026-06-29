import DirectExpense from "../models/directExpense.js";
import User from "../models/users.js";

// Create a direct expense between two people
export const handleCreateDirectExpense = async (req, res) => {
  try {
    const { description, amount, owedByEmail, splitType, category, notes } = req.body;
    const paidBy = req.user.id;

    // Find the other user by email
    const owedByUser = await User.findOne({ email: owedByEmail.toLowerCase() });
    if (!owedByUser) {
      return res.status(404).json({
        message: "User not found. They need to sign up first.",
        success: false,
      });
    }

    if (owedByUser._id.toString() === paidBy) {
      return res.status(400).json({
        message: "You cannot add an expense with yourself",
        success: false,
      });
    }

    // Calculate owed amount
    const owedAmount = splitType === "equal" ? Math.round((amount / 2) * 100) / 100 : amount;

    const expense = await DirectExpense.create({
      description,
      amount,
      paidBy,
      owedBy: owedByUser._id,
      splitType: splitType || "equal",
      owedAmount,
      category: category || "other",
      notes,
    });

    const populated = await DirectExpense.findById(expense._id)
      .populate("paidBy", "name email profileImage")
      .populate("owedBy", "name email profileImage");

    return res.status(201).json({
      message: "Expense added successfully",
      expense: populated,
      success: true,
    });
  } catch (error) {
    console.log("error in create direct expense", error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

// Edit a direct expense
export const handleUpdateDirectExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.id;
    const { description, amount, splitType, category, notes } = req.body;

    const expense = await DirectExpense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found", success: false });
    }

    // Only the person who created it (paidBy) can edit
    if (expense.paidBy.toString() !== userId) {
      return res.status(403).json({ message: "Only the payer can edit this expense", success: false });
    }

    // Build update object
    const updateFields = {};
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) updateFields.category = category;
    if (notes !== undefined) updateFields.notes = notes;

    // If amount or splitType changes, recalculate owedAmount
    const newAmount = amount !== undefined ? amount : expense.amount;
    const newSplitType = splitType !== undefined ? splitType : expense.splitType;

    if (amount !== undefined || splitType !== undefined) {
      updateFields.amount = newAmount;
      updateFields.splitType = newSplitType;
      updateFields.owedAmount = newSplitType === "equal"
        ? Math.round((newAmount / 2) * 100) / 100
        : newAmount;
    }

    const updated = await DirectExpense.findByIdAndUpdate(expenseId, updateFields, { new: true })
      .populate("paidBy", "name email profileImage")
      .populate("owedBy", "name email profileImage");

    return res.status(200).json({
      message: "Expense updated successfully",
      expense: updated,
      success: true,
    });
  } catch (error) {
    console.log("error in update direct expense", error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

// Get all direct expenses involving the current user
export const handleGetDirectExpenses = async (req, res) => {
  try {
    const userId = req.user.id;

    const expenses = await DirectExpense.find({
      $or: [{ paidBy: userId }, { owedBy: userId }],
    })
      .populate("paidBy", "name email profileImage")
      .populate("owedBy", "name email profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Direct expenses fetched",
      expenses,
      success: true,
    });
  } catch (error) {
    console.log("error in get direct expenses", error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

// Get balances summary — who owes you and who you owe
export const handleGetDirectBalances = async (req, res) => {
  try {
    const userId = req.user.id;

    const expenses = await DirectExpense.find({
      $or: [{ paidBy: userId }, { owedBy: userId }],
      settled: false,
    })
      .populate("paidBy", "name email profileImage")
      .populate("owedBy", "name email profileImage");

    // Calculate net balance per person
    // Positive amount = they owe you, Negative = you owe them
    const balanceMap = {};

    for (const exp of expenses) {
      const payerId = exp.paidBy._id.toString();
      const owerId = exp.owedBy._id.toString();

      if (payerId === userId) {
        // You paid → they owe you
        const otherUser = exp.owedBy;
        const otherUserId = owerId;
        if (!balanceMap[otherUserId]) {
          balanceMap[otherUserId] = { user: otherUser, amount: 0 };
        }
        balanceMap[otherUserId].amount += exp.owedAmount;
      } else if (owerId === userId) {
        // They paid → you owe them
        const otherUser = exp.paidBy;
        const otherUserId = payerId;
        if (!balanceMap[otherUserId]) {
          balanceMap[otherUserId] = { user: otherUser, amount: 0 };
        }
        balanceMap[otherUserId].amount -= exp.owedAmount;
      }
    }

    const balances = Object.values(balanceMap);
    const totalOwed = balances.filter((b) => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);
    const totalOwe = balances.filter((b) => b.amount < 0).reduce((sum, b) => sum + Math.abs(b.amount), 0);

    return res.status(200).json({
      message: "Direct balances fetched",
      balances,
      totalOwed: Math.round(totalOwed * 100) / 100,
      totalOwe: Math.round(totalOwe * 100) / 100,
      netBalance: Math.round((totalOwed - totalOwe) * 100) / 100,
      success: true,
    });
  } catch (error) {
    console.log("error in get direct balances", error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

// Settle up with a specific person
export const handleSettleDirectExpense = async (req, res) => {
  try {
    const { withUserId } = req.body;
    const userId = req.user.id;

    const result = await DirectExpense.updateMany(
      {
        $or: [
          { paidBy: userId, owedBy: withUserId },
          { paidBy: withUserId, owedBy: userId },
        ],
        settled: false,
      },
      { settled: true }
    );

    return res.status(200).json({
      message: `Settled up! ${result.modifiedCount} expenses marked as settled.`,
      success: true,
    });
  } catch (error) {
    console.log("error in settle direct expense", error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

// Delete a direct expense
export const handleDeleteDirectExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.id;

    const expense = await DirectExpense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found", success: false });
    }

    if (expense.paidBy.toString() !== userId && expense.owedBy.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized", success: false });
    }

    await DirectExpense.findByIdAndDelete(expenseId);

    return res.status(200).json({ message: "Expense deleted", success: true });
  } catch (error) {
    console.log("error in delete direct expense", error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};
