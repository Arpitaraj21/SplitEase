export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: string;
  profileImage?: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  category: string;
  members: User[];
  admin: User;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSplit {
  user: User;
  amount: number;
  percentage?: number;
}

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  paidBy: User;
  group: { _id: string; name: string };
  splitType: "equal" | "percentage" | "exact";
  splits: ExpenseSplit[];
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Balance {
  user: User;
  balance: number;
}

export interface SimplifiedDebt {
  from: User;
  to: User;
  amount: number;
}

export interface Settlement {
  _id: string;
  group: { _id: string; name: string };
  paidBy: User;
  paidTo: User;
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface Invitation {
  _id: string;
  group: { _id: string; name: string; description?: string; category?: string };
  invitedBy: User;
  invitedEmail?: string;
  invitedPhone?: string;
  method: string;
  status: string;
  token: string;
  createdAt: string;
}

export interface GoogleContact {
  name: string;
  email: string;
  phone: string;
}
