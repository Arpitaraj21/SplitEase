import axiosInstance, { endpoints } from "../utils/axios";

export interface CreateExpenseData {
  description: string;
  amount: number;
  groupId: string;
  splitType: "equal" | "percentage" | "exact" | "you_owe" | "they_owe";
  splits?: { user: string; amount?: number; percentage?: number }[];
  category?: string;
  date?: string;
  notes?: string;
}

export const expenseService = {
  createExpense: (data: CreateExpenseData) =>
    axiosInstance.post(endpoints.expenses, data).then((res) => res.data),

  getGroupExpenses: (groupId: string) =>
    axiosInstance.get(`${endpoints.expenses}/group/${groupId}`).then((res) => res.data),

  getExpenseById: (expenseId: string) =>
    axiosInstance.get(`${endpoints.expenses}/${expenseId}`).then((res) => res.data),

  updateExpense: (expenseId: string, data: Partial<CreateExpenseData>) =>
    axiosInstance.patch(`${endpoints.expenses}/${expenseId}`, data).then((res) => res.data),

  deleteExpense: (expenseId: string) =>
    axiosInstance.delete(`${endpoints.expenses}/${expenseId}`).then((res) => res.data),

  getGroupBalances: (groupId: string) =>
    axiosInstance.get(`/balances/group/${groupId}`).then((res) => res.data),

  getOverallBalances: () =>
    axiosInstance.get(endpoints.balancesOverall).then((res) => res.data),

  getSpendingStats: () =>
    axiosInstance.get(endpoints.spendingStats).then((res) => res.data),

  settleUp: (data: { groupId: string; paidTo: string; amount: number; notes?: string }) =>
    axiosInstance.post(endpoints.settlements, data).then((res) => res.data),
};
