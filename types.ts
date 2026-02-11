export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType | 'both';
  color?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  dateISO: string; // ISO 8601 string
  categoryId: string;
  description: string;
  type: TransactionType;
  createdAt: number;
}

export interface PatrimonyTransaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  dateISO: string;
  description?: string;
  createdAt: number;
}

export interface DateFilter {
  label: string;
  days: number | 'all' | 'custom';
}

export interface SummaryStats {
  balance: number; // Net Worth (Income - Expense)
  availableCash: number; // Liquid Cash (Balance - Patrimony)
  patrimonyTotal: number; // Total accumulated in Patrimony
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
}

export interface ChartDataPoint {
  name: string;
  income: number;
  expense: number;
  balance?: number;
}