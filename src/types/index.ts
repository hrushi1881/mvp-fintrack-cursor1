export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  userId: string;
  recurringTransactionId?: string; // Link to parent recurring transaction
  parentTransactionId?: string; // Link to parent transaction (for split transactions)
}

export interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date; // Optional end date
  nextOccurrenceDate: Date;
  lastProcessedDate?: Date; // Track when it was last processed
  isActive: boolean;
  userId: string;
  createdAt: Date;
  // Advanced options
  dayOfWeek?: number; // For weekly (0-6, Sunday=0)
  dayOfMonth?: number; // For monthly (1-31)
  monthOfYear?: number; // For yearly (1-12)
  maxOccurrences?: number; // Optional limit on total occurrences
  currentOccurrences: number; // Track how many times it has occurred
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  userId: string;
  createdAt: Date;
}

export interface Liability {
  id: string;
  name: string;
  type: 'loan' | 'credit_card' | 'mortgage' | 'purchase' | 'other';
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  due_date: Date;
  userId: string;
  createdAt: Date;
  start_date: Date;
  linkedPurchaseId?: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  userId: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
  userId: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  budgetUtilization: number;
}

export interface UserCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SplitTransaction {
  category: string;
  amount: number;
  description: string;
}

export interface DebtPaymentPlan {
  id: string;
  name: string;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  payoffDate: Date;
  totalInterest: number;
  payments: Array<{
    date: Date;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
  }>;
}

export interface DebtRepaymentStrategy {
  totalMonths: number;
  totalInterestPaid: number;
  totalPaid: number;
  payoffDate: Date;
  debtPlans: DebtPaymentPlan[];
}