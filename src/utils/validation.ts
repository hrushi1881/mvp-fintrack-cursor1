import { z } from 'zod';

// Centralized numeric sanitization utility
export const toNumber = (val: unknown): number => {
  if (val === null || val === undefined || val === '') {
    return 0;
  }
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

// Safe division utility to prevent NaN
export const safeDivide = (numerator: number, denominator: number): number => {
  if (denominator === 0 || isNaN(denominator) || isNaN(numerator)) {
    return 0;
  }
  return numerator / denominator;
};

// Percentage calculation utility
export const calculatePercentage = (current: number, total: number): number => {
  return safeDivide(current, total) * 100;
};

// Validation schemas
export const goalSchema = z.object({
  title: z.string().min(1, 'Goal title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  targetAmount: z.number().positive('Target amount must be greater than 0').max(1000000000, 'Amount too large'),
  currentAmount: z.number().min(0, 'Current amount cannot be negative').max(1000000000, 'Amount too large'),
  category: z.string().min(1, 'Category is required'),
}).refine((data) => data.currentAmount <= data.targetAmount, {
  message: "Current amount cannot exceed target amount",
  path: ["currentAmount"],
});

export const liabilitySchema = z.object({
  name: z.string().min(1, 'Liability name is required').max(100, 'Name too long'),
  type: z.enum(['loan', 'credit_card', 'mortgage', 'purchase', 'other']),
  totalAmount: z.number().positive('Total amount must be greater than 0').max(1000000000, 'Amount too large'),
  remainingAmount: z.number().min(0, 'Remaining amount cannot be negative').max(1000000000, 'Amount too large'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  monthlyPayment: z.number().positive('Monthly payment must be greater than 0').max(1000000, 'Payment too large'),
}).refine((data) => data.remainingAmount <= data.totalAmount, {
  message: "Remaining amount cannot exceed total amount",
  path: ["remainingAmount"],
}).refine((data) => data.monthlyPayment <= data.remainingAmount || data.remainingAmount === 0, {
  message: "Monthly payment cannot exceed remaining amount (unless debt is paid off)",
  path: ["monthlyPayment"],
});

export const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Budget amount must be greater than 0').max(1000000, 'Amount too large'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
});

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be greater than 0').max(1000000, 'Amount too large'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
});

// Validation helper functions
export const validateGoal = (data: any) => {
  try {
    return goalSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw error;
  }
};

export const validateLiability = (data: any) => {
  try {
    return liabilitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw error;
  }
};

export const validateBudget = (data: any) => {
  try {
    return budgetSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw error;
  }
};

export const validateTransaction = (data: any) => {
  try {
    return transactionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw error;
  }
};

// Sanitization helper for financial data
export const sanitizeFinancialData = <T extends Record<string, any>>(
  data: T,
  numericFields: (keyof T)[]
): T => {
  const sanitized = { ...data };
  
  numericFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = toNumber(sanitized[field]) as T[keyof T];
    }
  });
  
  return sanitized;
};