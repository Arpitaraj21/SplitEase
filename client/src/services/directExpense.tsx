import axiosInstance, { endpoints } from "../utils/axios";

export interface CreateDirectExpenseData {
  description: string;
  amount: number;
  owedByEmail: string;
  splitType: "equal" | "full";
  category?: string;
  notes?: string;
}

export interface UpdateDirectExpenseData {
  description?: string;
  amount?: number;
  splitType?: "equal" | "full";
  category?: string;
  notes?: string;
}

export const directExpenseService = {
  create: (data: CreateDirectExpenseData) =>
    axiosInstance.post(endpoints.directExpenses, data).then((res) => res.data),

  getAll: () =>
    axiosInstance.get(endpoints.directExpenses).then((res) => res.data),

  getBalances: () =>
    axiosInstance.get(endpoints.directBalances).then((res) => res.data),

  update: (expenseId: string, data: UpdateDirectExpenseData) =>
    axiosInstance.patch(`${endpoints.directExpenses}/${expenseId}`, data).then((res) => res.data),

  settleUp: (withUserId: string) =>
    axiosInstance.post(endpoints.directSettle, { withUserId }).then((res) => res.data),

  delete: (expenseId: string) =>
    axiosInstance.delete(`${endpoints.directExpenses}/${expenseId}`).then((res) => res.data),
};
