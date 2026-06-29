import express from "express";
import {
  handleCreateExpense,
  handleGetGroupExpenses,
  handleGetExpenseById,
  handleUpdateExpense,
  handleDeleteExpense,
  handleGetGroupBalances,
  handleSettleUp,
  handleGetOverallBalances,
  handleGetSpendingStats,
} from "../controllers/expense.js";
import { verifyToken } from "../middlewares/authorization.js";
import { validate, createExpenseValidation, settleUpValidation } from "../middlewares/validate.js";

const router = express.Router();

// Expense CRUD
router.post("/expenses", verifyToken, validate(createExpenseValidation), handleCreateExpense);
router.get("/expenses/group/:groupId", verifyToken, handleGetGroupExpenses);
router.get("/expenses/:expenseId", verifyToken, handleGetExpenseById);
router.patch("/expenses/:expenseId", verifyToken, handleUpdateExpense);
router.delete("/expenses/:expenseId", verifyToken, handleDeleteExpense);

// Balances & settlements
router.get("/balances/group/:groupId", verifyToken, handleGetGroupBalances);
router.get("/balances/overall", verifyToken, handleGetOverallBalances);
router.get("/stats/spending", verifyToken, handleGetSpendingStats);
router.post("/settlements", verifyToken, validate(settleUpValidation), handleSettleUp);

export default router;
