import Expense from "../models/expense.js";
import Group from "../models/group.js";
import Settlement from "../models/settlement.js";

// Create expense with split calculation
export const handleCreateExpense = async (req, res) => {
  try {
    const {
      description,
      amount,
      groupId,
      splitType,
      splits,
      category,
      date,
      notes,
    } = req.body;
    const paidBy = req.user.id;

    // Verify group exists and user is member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    const isMember = group.members.some((m) => m.toString() === paidBy);
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group", success: false });
    }

    let calculatedSplits = [];

    if (splitType === "equal") {
      // Split equally among all members (or specified members)
      const splitMembers = splits && splits.length > 0
        ? splits.map((s) => s.user)
        : group.members.map((m) => m.toString());

      const perPerson = Math.round((amount / splitMembers.length) * 100) / 100;
      const remainder = Math.round((amount - perPerson * splitMembers.length) * 100) / 100;

      calculatedSplits = splitMembers.map((userId, index) => ({
        user: userId,
        amount: index === 0 ? perPerson + remainder : perPerson,
      }));
    } else if (splitType === "percentage") {
      // Split by percentage
      if (!splits || splits.length === 0) {
        return res.status(400).json({
          message: "Splits with percentages are required for percentage split",
          success: false,
        });
      }

      const totalPercentage = splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({
          message: "Percentages must add up to 100",
          success: false,
        });
      }

      calculatedSplits = splits.map((s) => ({
        user: s.user,
        amount: Math.round((amount * s.percentage) / 100 * 100) / 100,
        percentage: s.percentage,
      }));
    } else if (splitType === "exact") {
      // Split by exact amounts
      if (!splits || splits.length === 0) {
        return res.status(400).json({
          message: "Splits with exact amounts are required",
          success: false,
        });
      }

      const totalSplit = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
      if (Math.abs(totalSplit - amount) > 0.01) {
        return res.status(400).json({
          message: "Split amounts must add up to total amount",
          success: false,
        });
      }

      calculatedSplits = splits.map((s) => ({
        user: s.user,
        amount: s.amount,
      }));
    } else if (splitType === "you_owe") {
      // You owe the full amount to someone who paid for you
      // splits[0].user = the person who actually paid
      if (!splits || splits.length === 0 || !splits[0].user) {
        return res.status(400).json({
          message: "Please select who paid for you",
          success: false,
        });
      }
      // The full amount is owed by the current user (paidBy) to the selected person
      calculatedSplits = [{ user: paidBy, amount }];
    } else if (splitType === "they_owe") {
      // A specific person owes you the full amount
      if (!splits || splits.length === 0 || !splits[0].user) {
        return res.status(400).json({
          message: "Please select who owes you",
          success: false,
        });
      }
      // The full amount is owed by the selected person
      calculatedSplits = [{ user: splits[0].user, amount }];
    }

    const expense = await Expense.create({
      description,
      amount,
      paidBy,
      group: groupId,
      splitType,
      splits: calculatedSplits,
      category: category || "other",
      date: date || Date.now(),
      notes,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name email username")
      .populate("splits.user", "name email username")
      .populate("group", "name");

    return res.status(201).json({
      message: "Expense created successfully",
      expense: populatedExpense,
      success: true,
    });
  } catch (error) {
    console.log("error in create expense", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Get all expenses for a group
export const handleGetGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    const isMember = group.members.some((m) => m.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: "Access denied", success: false });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email username profileImage")
      .populate("splits.user", "name email username")
      .sort({ date: -1 });

    return res.status(200).json({
      message: "Expenses fetched successfully",
      expenses,
      success: true,
    });
  } catch (error) {
    console.log("error in get group expenses", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Get single expense
export const handleGetExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId)
      .populate("paidBy", "name email username")
      .populate("splits.user", "name email username")
      .populate("group", "name");

    if (!expense) {
      return res.status(404).json({ message: "Expense not found", success: false });
    }

    return res.status(200).json({
      message: "Expense fetched",
      expense,
      success: true,
    });
  } catch (error) {
    console.log("error in get expense by id", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Update expense
export const handleUpdateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.id;
    const { description, amount, splitType, splits, category, notes } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found", success: false });
    }

    if (expense.paidBy.toString() !== userId) {
      return res.status(403).json({ message: "Only the payer can edit this expense", success: false });
    }

    // Recalculate splits if amount or split type changed
    const newAmount = amount || expense.amount;
    const newSplitType = splitType || expense.splitType;
    let calculatedSplits = expense.splits;

    if (amount || splitType || splits) {
      const group = await Group.findById(expense.group);

      if (newSplitType === "equal") {
        const splitMembers = splits && splits.length > 0
          ? splits.map((s) => s.user)
          : group.members.map((m) => m.toString());

        const perPerson = Math.round((newAmount / splitMembers.length) * 100) / 100;
        const remainder = Math.round((newAmount - perPerson * splitMembers.length) * 100) / 100;

        calculatedSplits = splitMembers.map((userId, index) => ({
          user: userId,
          amount: index === 0 ? perPerson + remainder : perPerson,
        }));
      } else if (newSplitType === "percentage" && splits) {
        calculatedSplits = splits.map((s) => ({
          user: s.user,
          amount: Math.round((newAmount * s.percentage) / 100 * 100) / 100,
          percentage: s.percentage,
        }));
      } else if (newSplitType === "exact" && splits) {
        calculatedSplits = splits.map((s) => ({
          user: s.user,
          amount: s.amount,
        }));
      }
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      {
        description: description || expense.description,
        amount: newAmount,
        splitType: newSplitType,
        splits: calculatedSplits,
        category: category || expense.category,
        notes: notes !== undefined ? notes : expense.notes,
      },
      { new: true }
    )
      .populate("paidBy", "name email username")
      .populate("splits.user", "name email username")
      .populate("group", "name");

    return res.status(200).json({
      message: "Expense updated successfully",
      expense: updatedExpense,
      success: true,
    });
  } catch (error) {
    console.log("error in update expense", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Delete expense
export const handleDeleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.id;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found", success: false });
    }

    if (expense.paidBy.toString() !== userId) {
      // Check if user is group admin
      const group = await Group.findById(expense.group);
      if (!group || group.admin.toString() !== userId) {
        return res.status(403).json({ message: "Not authorized to delete", success: false });
      }
    }

    await Expense.findByIdAndDelete(expenseId);

    return res.status(200).json({
      message: "Expense deleted successfully",
      success: true,
    });
  } catch (error) {
    console.log("error in delete expense", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Calculate balances for a group
export const handleGetGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId).populate("members", "name email username");
    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    const isMember = group.members.some((m) => m._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: "Access denied", success: false });
    }

    const expenses = await Expense.find({ group: groupId });
    const settlements = await Settlement.find({ group: groupId });

    // Calculate net balance for each member
    // Positive = owed money, Negative = owes money
    const balances = {};
    group.members.forEach((member) => {
      balances[member._id.toString()] = {
        user: member,
        balance: 0,
      };
    });

    // Process expenses
    for (const expense of expenses) {
      const payerId = expense.paidBy.toString();
      if (balances[payerId]) {
        balances[payerId].balance += expense.amount;
      }

      for (const split of expense.splits) {
        const splitUserId = split.user.toString();
        if (balances[splitUserId]) {
          balances[splitUserId].balance -= split.amount;
        }
      }
    }

    // Process settlements
    for (const settlement of settlements) {
      const payerId = settlement.paidBy.toString();
      const receiverId = settlement.paidTo.toString();
      if (balances[payerId]) {
        balances[payerId].balance += settlement.amount;
      }
      if (balances[receiverId]) {
        balances[receiverId].balance -= settlement.amount;
      }
    }

    // Calculate simplified debts (who owes whom)
    const simplifiedDebts = calculateSimplifiedDebts(balances);

    return res.status(200).json({
      message: "Balances calculated",
      balances: Object.values(balances),
      simplifiedDebts,
      success: true,
    });
  } catch (error) {
    console.log("error in get balances", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Settle up - record a payment between users
export const handleSettleUp = async (req, res) => {
  try {
    const { groupId, paidTo, amount, notes } = req.body;
    const paidBy = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    const settlement = await Settlement.create({
      group: groupId,
      paidBy,
      paidTo,
      amount,
      notes,
    });

    const populatedSettlement = await Settlement.findById(settlement._id)
      .populate("paidBy", "name email username")
      .populate("paidTo", "name email username")
      .populate("group", "name");

    return res.status(201).json({
      message: "Settlement recorded successfully",
      settlement: populatedSettlement,
      success: true,
    });
  } catch (error) {
    console.log("error in settle up", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Get overall balances for current user across all groups
export const handleGetOverallBalances = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Group.find({ members: userId });
    const groupIds = groups.map((g) => g._id);

    const expenses = await Expense.find({ group: { $in: groupIds } })
      .populate("paidBy", "name email username")
      .populate("splits.user", "name email username");

    const settlements = await Settlement.find({ group: { $in: groupIds } });

    // Calculate how much user owes / is owed per other user
    const userBalances = {}; // { otherUserId: { user, amount } }

    for (const expense of expenses) {
      const payerId = expense.paidBy._id.toString();

      if (payerId === userId) {
        // User paid — others owe user
        for (const split of expense.splits) {
          const splitUserId = split.user._id.toString();
          if (splitUserId !== userId) {
            if (!userBalances[splitUserId]) {
              userBalances[splitUserId] = { user: split.user, amount: 0 };
            }
            userBalances[splitUserId].amount += split.amount;
          }
        }
      } else {
        // Someone else paid — check if user is in splits
        for (const split of expense.splits) {
          if (split.user._id.toString() === userId) {
            if (!userBalances[payerId]) {
              userBalances[payerId] = { user: expense.paidBy, amount: 0 };
            }
            userBalances[payerId].amount -= split.amount;
          }
        }
      }
    }

    // Process settlements
    for (const settlement of settlements) {
      const sPayerId = settlement.paidBy.toString();
      const sReceiverId = settlement.paidTo.toString();

      if (sPayerId === userId && userBalances[sReceiverId]) {
        userBalances[sReceiverId].amount += settlement.amount;
      } else if (sReceiverId === userId && userBalances[sPayerId]) {
        userBalances[sPayerId].amount -= settlement.amount;
      }
    }

    const totalOwed = Object.values(userBalances)
      .filter((b) => b.amount > 0)
      .reduce((sum, b) => sum + b.amount, 0);

    const totalOwe = Object.values(userBalances)
      .filter((b) => b.amount < 0)
      .reduce((sum, b) => sum + Math.abs(b.amount), 0);

    return res.status(200).json({
      message: "Overall balances fetched",
      balances: Object.values(userBalances),
      totalOwed: Math.round(totalOwed * 100) / 100,
      totalOwe: Math.round(totalOwe * 100) / 100,
      netBalance: Math.round((totalOwed - totalOwe) * 100) / 100,
      success: true,
    });
  } catch (error) {
    console.log("error in overall balances", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Helper: Simplify debts using greedy algorithm
function calculateSimplifiedDebts(balances) {
  const debts = [];
  const positives = []; // people owed money
  const negatives = []; // people who owe money

  for (const [userId, data] of Object.entries(balances)) {
    if (data.balance > 0.01) {
      positives.push({ userId, user: data.user, amount: data.balance });
    } else if (data.balance < -0.01) {
      negatives.push({ userId, user: data.user, amount: Math.abs(data.balance) });
    }
  }

  // Sort by amount descending
  positives.sort((a, b) => b.amount - a.amount);
  negatives.sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;

  while (i < positives.length && j < negatives.length) {
    const settlement = Math.min(positives[i].amount, negatives[j].amount);

    if (settlement > 0.01) {
      debts.push({
        from: negatives[j].user,
        to: positives[i].user,
        amount: Math.round(settlement * 100) / 100,
      });
    }

    positives[i].amount -= settlement;
    negatives[j].amount -= settlement;

    if (positives[i].amount < 0.01) i++;
    if (negatives[j].amount < 0.01) j++;
  }

  return debts;
}

// Get spending statistics by category for the current user
export const handleGetSpendingStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all groups the user belongs to
    const groups = await Group.find({ members: userId });
    const groupIds = groups.map((g) => g._id);

    // Get ALL expenses in user's groups (not just ones they paid)
    const expenses = await Expense.find({
      group: { $in: groupIds },
    });

    // Calculate user's personal share from each expense
    const categoryTotals = {};
    let totalSpent = 0;
    let expenseCount = 0;

    for (const exp of expenses) {
      // Find the user's split in this expense — that's their actual spend
      const userSplit = exp.splits.find((s) => s.user.toString() === userId);
      if (!userSplit) continue; // user not part of this expense split

      const myShare = userSplit.amount;
      const cat = exp.category || "other";

      if (!categoryTotals[cat]) {
        categoryTotals[cat] = 0;
      }
      categoryTotals[cat] += myShare;
      totalSpent += myShare;
      expenseCount++;
    }

    // Aggregate by month (last 6 months) — user's share only
    const monthlyTotals = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyTotals[key] = 0;
    }

    for (const exp of expenses) {
      const userSplit = exp.splits.find((s) => s.user.toString() === userId);
      if (!userSplit) continue;

      const expDate = new Date(exp.date);
      const key = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyTotals[key] !== undefined) {
        monthlyTotals[key] += userSplit.amount;
      }
    }

    // Aggregate by group — user's share only
    const groupTotals = {};
    for (const exp of expenses) {
      const userSplit = exp.splits.find((s) => s.user.toString() === userId);
      if (!userSplit) continue;

      const gId = exp.group.toString();
      if (!groupTotals[gId]) {
        const grp = groups.find((g) => g._id.toString() === gId);
        groupTotals[gId] = { name: grp?.name || "Unknown", amount: 0 };
      }
      groupTotals[gId].amount += userSplit.amount;
    }

    return res.status(200).json({
      message: "Spending stats fetched",
      stats: {
        categoryBreakdown: categoryTotals,
        monthlyBreakdown: monthlyTotals,
        groupBreakdown: Object.values(groupTotals),
        totalSpent: Math.round(totalSpent * 100) / 100,
        expenseCount,
      },
      success: true,
    });
  } catch (error) {
    console.log("error in spending stats", error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};
