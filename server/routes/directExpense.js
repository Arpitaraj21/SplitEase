import express from "express";
import {
  handleCreateDirectExpense,
  handleGetDirectExpenses,
  handleGetDirectBalances,
  handleSettleDirectExpense,
  handleUpdateDirectExpense,
  handleDeleteDirectExpense,
} from "../controllers/directExpense.js";
import { verifyToken } from "../middlewares/authorization.js";

const router = express.Router();

router.post("/direct-expenses", verifyToken, handleCreateDirectExpense);
router.get("/direct-expenses", verifyToken, handleGetDirectExpenses);
router.get("/direct-expenses/balances", verifyToken, handleGetDirectBalances);
router.post("/direct-expenses/settle", verifyToken, handleSettleDirectExpense);
router.patch("/direct-expenses/:expenseId", verifyToken, handleUpdateDirectExpense);
router.delete("/direct-expenses/:expenseId", verifyToken, handleDeleteDirectExpense);

export default router;
