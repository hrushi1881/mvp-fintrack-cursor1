import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  Transaction, 
  Goal, 
  Liability, 
  Budget, 
  DashboardStats, 
  RecurringTransaction,
  UserCategory,
  SplitTransaction,
  DebtRepaymentStrategy
} from '../types';
import { supabase } from '../lib/supabase';
import { addMonths, addDays, addWeeks, addYears, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useAuth } from './AuthContext';
import { useInternationalization } from './InternationalizationContext';

interface FinanceContextType {
  transactions: Transaction[];
  goals: Goal[];
  liabilities: Liability[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  userCategories: UserCategory[];
  stats: DashboardStats;
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addLiability: (liability: Omit<Liability, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateLiability: (id: string, liability: Partial<Liability>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateRecurringTransaction: (id: string, transaction: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  processRecurringTransactions: () => Promise<void>;
  addUserCategory: (category: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUserCategory: (id: string, category: Partial<UserCategory>) => Promise<void>;
  deleteUserCategory: (id: string) => Promise<void>;
  addSplitTransaction: (
    parentTransaction: Omit<Transaction, 'id' | 'userId'>,
    splits: SplitTransaction[]
  ) => Promise<void>;
  getSplitTransactions: (parentId: string) => Transaction[];
  searchTransactions: (query: string) => Transaction[];
  getMonthlyTrends: (months: number) => Array<{ month: string; income: number; expenses: number; net: number }>;
  getCategoryBreakdown: (type: 'income' | 'expense', months?: number) => Array<{ category: string; amount: number; percentage: number }>;
  getNetWorthTrends: (months: number) => Array<{ month: string; netWorth: number; liquidAssets: number; goalSavings: number; totalLiabilities: number }>;
  calculateDebtRepaymentStrategy: (strategy: 'avalanche' | 'snowball', extraPayment?: number) => DebtRepaymentStrategy;
  getFinancialForecast: () => Promise<any>;
  insights: Array<{ title: string; description: string; type: 'positive' | 'warning' | 'info' }>;
  refreshInsights: () => Promise<void>;
  exportData: (format: 'json' | 'csv') => Promise<string>;
  importData: (data: string, format: 'json' | 'csv') => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

interface FinanceProviderProps {
  children: ReactNode;
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { currency } = useInternationalization();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Array<{ title: string; description: string; type: 'positive' | 'warning' | 'info' }>>([]);

  // Calculate dashboard stats
  const stats: DashboardStats = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    totalSavings: goals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0),
    totalLiabilities: liabilities.reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0),
    monthlyIncome: getMonthlyTotal('income'),
    monthlyExpenses: getMonthlyTotal('expense'),
    budgetUtilization: calculateBudgetUtilization(),
  };

  function getMonthlyTotal(type: 'income' | 'expense'): number {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    
    return transactions
      .filter(t => 
        t.type === type && 
        t.date >= startOfCurrentMonth && 
        t.date <= endOfCurrentMonth
      )
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }

  function calculateBudgetUtilization(): number {
    if (budgets.length === 0) return 0;
    
    const totalBudgeted = budgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (Number(b.spent) || 0), 0);
    
    return totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  }

  // Load data from Supabase when user changes
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        // Clear data when user logs out
        setTransactions([]);
        setGoals([]);
        setLiabilities([]);
        setBudgets([]);
        setRecurringTransactions([]);
        setUserCategories([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        
        if (transactionsError) throw transactionsError;
        
        // Load goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id);
        
        if (goalsError) throw goalsError;
        
        // Load liabilities
        const { data: liabilitiesData, error: liabilitiesError } = await supabase
          .from('liabilities')
          .select('*')
          .eq('user_id', user.id);
        
        if (liabilitiesError) throw liabilitiesError;
        
        // Load budgets
        const { data: budgetsData, error: budgetsError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id);
        
        if (budgetsError) throw budgetsError;
        
        // Load recurring transactions
        const { data: recurringData, error: recurringError } = await supabase
          .from('recurring_transactions')
          .select('*')
          .eq('user_id', user.id);
        
        if (recurringError) throw recurringError;

        // Load user categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('user_categories')
          .select('*')
          .eq('user_id', user.id);
        
        if (categoriesError) throw categoriesError;
        
        // Format dates and set state
        setTransactions(transactionsData.map(t => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.created_at)
        })));
        
        setGoals(goalsData.map(g => ({
          ...g,
          targetDate: new Date(g.target_date),
          createdAt: new Date(g.created_at)
        })));
        
        setLiabilities(liabilitiesData.map(l => ({
          ...l,
          due_date: new Date(l.due_date),
          start_date: new Date(l.start_date || l.created_at),
          createdAt: new Date(l.created_at)
        })));
        
        setBudgets(budgetsData.map(b => ({
          ...b,
          createdAt: new Date(b.created_at)
        })));
        
        setRecurringTransactions(recurringData.map(r => ({
          ...r,
          startDate: new Date(r.start_date),
          endDate: r.end_date ? new Date(r.end_date) : undefined,
          nextOccurrenceDate: new Date(r.next_occurrence_date),
          lastProcessedDate: r.last_processed_date ? new Date(r.last_processed_date) : undefined,
          createdAt: new Date(r.created_at)
        })));

        setUserCategories(categoriesData.map(c => ({
          ...c,
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at)
        })));
        
        // Process any pending recurring transactions
        await processRecurringTransactions();
        
        // Generate insights
        await refreshInsights();
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // CRUD operations for transactions
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            ...transaction,
            user_id: user.id,
            date: transaction.date.toISOString().split('T')[0]
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newTransaction = {
          ...data[0],
          date: new Date(data[0].date),
          createdAt: new Date(data[0].created_at)
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        
        // Update budget if it's an expense
        if (transaction.type === 'expense') {
          const matchingBudget = budgets.find(b => b.category === transaction.category);
          if (matchingBudget) {
            await updateBudget(matchingBudget.id, {
              spent: (Number(matchingBudget.spent) || 0) + (Number(transaction.amount) || 0)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    if (!user) return;
    
    try {
      // Ensure amounts are valid numbers
      if (transaction.amount !== undefined) {
        transaction.amount = Number(transaction.amount || 0);
      }
    
      // Format date if it exists
      const formattedTransaction = transaction.date
        ? { ...transaction, date: transaction.date.toISOString().split('T')[0] }
        : transaction;
      
      const { error } = await supabase
        .from('transactions')
        .update(formattedTransaction)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setTransactions(prev => prev.map(t => 
        t.id === id ? { ...t, ...transaction, date: transaction.date || t.date } : t
      ));
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    
    try {
      // Check if transaction exists
      const transactionToDelete = transactions.find(t => t.id === id);
      if (!transactionToDelete) {
        throw new Error('Transaction not found');
      }
    
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  // CRUD operations for goals
  const addGoal = async (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    
    try {
      // Ensure amounts are valid numbers
      goal.targetAmount = Number(goal.targetAmount || 0);
      goal.currentAmount = Number(goal.currentAmount || 0);
      
      const { data, error } = await supabase
        .from('goals')
        .insert([
          {
            ...goal,
            user_id: user.id,
            target_date: goal.targetDate.toISOString().split('T')[0],
            target_amount: Number(goal.targetAmount || 0),
            current_amount: Number(goal.currentAmount || 0)
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newGoal = {
          ...data[0],
          targetAmount: Number(data[0].target_amount || 0),
          currentAmount: Number(data[0].current_amount || 0),
          targetDate: new Date(data[0].target_date),
          createdAt: new Date(data[0].created_at)
        };
        
        setGoals(prev => [...prev, newGoal]);
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  };

  const updateGoal = async (id: string, goal: Partial<Goal>) => {
    if (!user) return;
    
    try {
      // Ensure amounts are valid numbers if they're included in the update
      if (goal.targetAmount !== undefined) {
        goal.targetAmount = Number(goal.targetAmount || 0);
      }
      if (goal.currentAmount !== undefined) {
        goal.currentAmount = Number(goal.currentAmount || 0);
      }
      
      // Process the data to ensure numeric values are properly handled
      const updates: Record<string, any> = {};
      if (goal.title) updates.title = goal.title;
      if (goal.description) updates.description = goal.description;
      if (goal.targetAmount !== undefined) updates.target_amount = Number(goal.targetAmount);
      if (goal.currentAmount !== undefined) updates.current_amount = Number(goal.currentAmount);
      if (goal.targetDate) updates.target_date = goal.targetDate.toISOString();
      if (goal.category) updates.category = goal.category;
      
      const { error } = await supabase
        .from('goals')
        .update({
          ...updates
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setGoals(prev => prev.map(g => {
        if (g.id === id) {
          return {
            ...g,
            ...(goal.title && { title: goal.title }),
            ...(goal.description && { description: goal.description }),
            ...(goal.targetAmount !== undefined && { targetAmount: Number(goal.targetAmount) }),
            ...(goal.currentAmount !== undefined && { currentAmount: Number(goal.currentAmount) }),
            ...(goal.targetDate && { targetDate: goal.targetDate }),
            ...(goal.category && { category: goal.category }),
          };
        }
        return g;
      }));
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  };

  // CRUD operations for liabilities
  const addLiability = async (liability: Omit<Liability, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    
    try {
      // Ensure amounts are valid numbers
      liability.totalAmount = Number(liability.totalAmount || 0);
      liability.remainingAmount = Number(liability.remainingAmount || 0);
      liability.interestRate = Number(liability.interestRate || 0);
      liability.monthlyPayment = Number(liability.monthlyPayment || 0);
      
      const { data, error } = await supabase
        .from('liabilities')
        .insert([
          {
            user_id: user.id,
            name: liability.name,
            type: liability.type,
            total_amount: Number(liability.totalAmount || 0),
            remaining_amount: Number(liability.remainingAmount || 0),
            interest_rate: Number(liability.interestRate || 0),
            monthly_payment: Number(liability.monthlyPayment || 0),
            due_date: liability.due_date.toISOString().split('T')[0],
            start_date: liability.start_date.toISOString().split('T')[0],
            linked_purchase_id: liability.linkedPurchaseId
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newLiability = {
          ...data[0],
          dueDate: new Date(data[0].due_date),
          due_date: new Date(data[0].due_date),
          start_date: new Date(data[0].start_date),
          createdAt: new Date(data[0].created_at),
          totalAmount: Number(data[0].total_amount || 0),
          remainingAmount: Number(data[0].remaining_amount || 0),
          interestRate: Number(data[0].interest_rate || 0),
          monthlyPayment: Number(data[0].monthly_payment || 0),
          linkedPurchaseId: data[0].linked_purchase_id
        };
        
        setLiabilities(prev => [...prev, newLiability]);
      }
    } catch (error) {
      console.error('Error adding liability:', error);
      throw error;
    }
  };

  const updateLiability = async (id: string, liability: Partial<Liability>) => {
    if (!user) return;
    
    try {
      // Ensure amounts are valid numbers if they're included in the update
      if (liability.totalAmount !== undefined) {
        liability.totalAmount = Number(liability.totalAmount || 0);
      }
      if (liability.remainingAmount !== undefined) {
        liability.remainingAmount = Number(liability.remainingAmount || 0);
      }
      if (liability.interestRate !== undefined) {
        liability.interestRate = Number(liability.interestRate || 0);
      }
      if (liability.monthlyPayment !== undefined) {
        liability.monthlyPayment = Number(liability.monthlyPayment || 0);
      }

      // Convert camelCase to snake_case for Supabase
      const supabaseLiability: any = {};
      
      if (liability.due_date) {
        supabaseLiability.due_date = liability.due_date.toISOString().split('T')[0];
      } else if (liability.dueDate) {
        supabaseLiability.due_date = liability.dueDate.toISOString().split('T')[0];
      }
      
      if (liability.start_date) {
        supabaseLiability.start_date = liability.start_date.toISOString().split('T')[0];
      }
      
      if (liability.totalAmount !== undefined) {
        supabaseLiability.total_amount = Number(liability.totalAmount) || 0;
      }
      
      if (liability.remainingAmount !== undefined) {
        supabaseLiability.remaining_amount = Number(liability.remainingAmount) || 0;
      }
      
      if (liability.interestRate !== undefined) {
        supabaseLiability.interest_rate = Number(liability.interestRate) || 0;
      }
      
      if (liability.monthlyPayment !== undefined) {
        supabaseLiability.monthly_payment = Number(liability.monthlyPayment) || 0;
      }
      
      if (liability.name !== undefined) {
        supabaseLiability.name = liability.name;
      }
      
      if (liability.type !== undefined) {
        supabaseLiability.type = liability.type;
      }
      
      if (liability.linkedPurchaseId !== undefined) {
        supabaseLiability.linked_purchase_id = liability.linkedPurchaseId;
      }
      
      const { error } = await supabase
        .from('liabilities')
        .update(supabaseLiability)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setLiabilities(prev => prev.map(l => 
        l.id === id ? { ...l, ...liability } : l
      ));
    } catch (error) {
      console.error('Error updating liability:', error);
      throw error;
    }
  };

  const deleteLiability = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('liabilities')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setLiabilities(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting liability:', error);
      throw error;
    }
  };

  // CRUD operations for budgets
  const addBudget = async (budget: Omit<Budget, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    
    try {
      // Ensure amount is a valid number
      budget.amount = Number(budget.amount || 0);
      
      const { data, error } = await supabase
        .from('budgets')
        .insert([
          {
            ...budget,
            user_id: user.id,
            amount: Number(budget.amount) || 0,
            spent: Number(budget.spent) || 0
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newBudget = {
          ...data[0],
          createdAt: new Date(data[0].created_at)
        };
        
        setBudgets(prev => [...prev, newBudget]);
      }
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    if (!user) return;
    
    try {
      // Ensure amounts are valid numbers if they're included in the update
      if (budget.amount !== undefined) {
        budget.amount = Number(budget.amount || 0);
      }
      if (budget.spent !== undefined) {
        budget.spent = Number(budget.spent || 0);
      }
      
      // Convert values to numbers
      const supabaseBudget: any = {};
      
      if (budget.amount !== undefined) {
        supabaseBudget.amount = Number(budget.amount) || 0;
      }
      
      if (budget.spent !== undefined) {
        supabaseBudget.spent = Number(budget.spent) || 0;
      }
      
      if (budget.category !== undefined) {
        supabaseBudget.category = budget.category;
      }
      
      if (budget.period !== undefined) {
        supabaseBudget.period = budget.period;
      }
      
      const { error } = await supabase
        .from('budgets')
        .update(supabaseBudget)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setBudgets(prev => prev.map(b => 
        b.id === id ? { ...b, ...budget } : b
      ));
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  };

  // CRUD operations for recurring transactions
  const addRecurringTransaction = async (transaction: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([
          {
            ...transaction,
            user_id: user.id,
            start_date: transaction.startDate.toISOString().split('T')[0],
            end_date: transaction.endDate ? transaction.endDate.toISOString().split('T')[0] : null,
            next_occurrence_date: transaction.nextOccurrenceDate.toISOString().split('T')[0],
            last_processed_date: transaction.lastProcessedDate ? transaction.lastProcessedDate.toISOString().split('T')[0] : null
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newRecurringTransaction = {
          ...data[0],
          startDate: new Date(data[0].start_date),
          endDate: data[0].end_date ? new Date(data[0].end_date) : undefined,
          nextOccurrenceDate: new Date(data[0].next_occurrence_date),
          lastProcessedDate: data[0].last_processed_date ? new Date(data[0].last_processed_date) : undefined,
          createdAt: new Date(data[0].created_at)
        };
        
        setRecurringTransactions(prev => [...prev, newRecurringTransaction]);
      }
    } catch (error) {
      console.error('Error adding recurring transaction:', error);
      throw error;
    }
  };

  const updateRecurringTransaction = async (id: string, transaction: Partial<RecurringTransaction>) => {
    if (!user) return;
    
    try {
      // Format dates if they exist
      const formattedTransaction: any = { ...transaction };
      if (transaction.startDate) {
        formattedTransaction.start_date = transaction.startDate.toISOString().split('T')[0];
        delete formattedTransaction.startDate;
      }
      if (transaction.endDate) {
        formattedTransaction.end_date = transaction.endDate.toISOString().split('T')[0];
        delete formattedTransaction.endDate;
      }
      if (transaction.nextOccurrenceDate) {
        formattedTransaction.next_occurrence_date = transaction.nextOccurrenceDate.toISOString().split('T')[0];
        delete formattedTransaction.nextOccurrenceDate;
      }
      if (transaction.lastProcessedDate) {
        formattedTransaction.last_processed_date = transaction.lastProcessedDate.toISOString().split('T')[0];
        delete formattedTransaction.lastProcessedDate;
      }
      
      const { error } = await supabase
        .from('recurring_transactions')
        .update(formattedTransaction)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setRecurringTransactions(prev => prev.map(rt => {
        if (rt.id === id) {
          return { ...rt, ...transaction };
        }
        return rt;
      }));
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
      throw error;
    }
  };

  const deleteRecurringTransaction = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      throw error;
    }
  };

  // Process recurring transactions
  const processRecurringTransactions = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      const activeRecurringTransactions = recurringTransactions.filter(rt => 
        rt.isActive && rt.nextOccurrenceDate <= today
      );
      
      for (const rt of activeRecurringTransactions) {
        // Check if transaction should still be processed
        if (rt.endDate && rt.endDate < today) {
          // End date has passed, deactivate
          await updateRecurringTransaction(rt.id, { isActive: false });
          continue;
        }
        
        if (rt.maxOccurrences && (rt.currentOccurrences >= rt.maxOccurrences)) {
          // Max occurrences reached, deactivate
          await updateRecurringTransaction(rt.id, { isActive: false });
          continue;
        }
        
        // Create transaction
        await addTransaction({
          type: rt.type,
          amount: Number(rt.amount) || 0,
          category: rt.category,
          description: rt.description,
          date: new Date(rt.nextOccurrenceDate),
          recurringTransactionId: rt.id
        });
        
        // Calculate next occurrence date
        let nextDate: Date;
        switch (rt.frequency) {
          case 'daily':
            nextDate = addDays(rt.nextOccurrenceDate, 1);
            break;
          case 'weekly':
            nextDate = addWeeks(rt.nextOccurrenceDate, 1);
            break;
          case 'monthly':
            nextDate = addMonths(rt.nextOccurrenceDate, 1);
            // Adjust for day of month if specified
            if (rt.dayOfMonth) {
              nextDate.setDate(Math.min(
                rt.dayOfMonth,
                new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
              ));
            }
            break;
          case 'yearly':
            nextDate = addYears(rt.nextOccurrenceDate, 1);
            break;
          default:
            nextDate = addMonths(rt.nextOccurrenceDate, 1);
        }
        
        // Update recurring transaction
        await updateRecurringTransaction(rt.id, {
          nextOccurrenceDate: nextDate,
          lastProcessedDate: today,
          currentOccurrences: (rt.currentOccurrences || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
    }
  };

  // CRUD operations for user categories
  const addUserCategory = async (category: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_categories')
        .insert([
          {
            ...category,
            user_id: user.id
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newCategory = {
          ...data[0],
          createdAt: new Date(data[0].created_at),
          updatedAt: new Date(data[0].updated_at)
        };
        
        setUserCategories(prev => [...prev, newCategory]);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateUserCategory = async (id: string, category: Partial<UserCategory>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_categories')
        .update(category)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setUserCategories(prev => prev.map(c => 
        c.id === id ? { ...c, ...category, updatedAt: new Date() } : c
      ));
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteUserCategory = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setUserCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  // Add split transaction
  const addSplitTransaction = async (
    parentTransaction: Omit<Transaction, 'id' | 'userId'>,
    splits: SplitTransaction[]
  ) => {
    if (!user) return;
    
    try {
      // First, create the parent transaction
      const { data: parentData, error: parentError } = await supabase
        .from('transactions')
        .insert([
          {
            ...parentTransaction,
            user_id: user.id,
            date: parentTransaction.date.toISOString().split('T')[0],
            category: 'Split Transaction'
          }
        ])
        .select();
      
      if (parentError) throw parentError;
      
      if (!parentData || parentData.length === 0) {
        throw new Error('Failed to create parent transaction');
      }
      
      const parentId = parentData[0].id;
      
      // Then create all the split transactions
      const splitTransactionsToInsert = splits.map(split => ({
        type: 'expense',
        amount: Number(split.amount) || 0,
        category: split.category,
        description: split.description || parentTransaction.description,
        date: parentTransaction.date.toISOString().split('T')[0],
        user_id: user.id,
        parent_transaction_id: parentId
      }));
      
      const { data: splitsData, error: splitsError } = await supabase
        .from('transactions')
        .insert(splitTransactionsToInsert)
        .select();
      
      if (splitsError) throw splitsError;
      
      // Update local state
      const newParentTransaction = {
        ...parentData[0],
        date: new Date(parentData[0].date),
        createdAt: new Date(parentData[0].created_at)
      };
      
      const newSplitTransactions = splitsData.map((split: any) => ({
        ...split,
        date: new Date(split.date),
        createdAt: new Date(split.created_at)
      }));
      
      setTransactions(prev => [newParentTransaction, ...newSplitTransactions, ...prev]);
      
      // Update budgets for each split
      for (const split of splits) {
        const matchingBudget = budgets.find(b => b.category === split.category);
        if (matchingBudget) {
          await updateBudget(matchingBudget.id, {
            spent: (Number(matchingBudget.spent) || 0) + (Number(split.amount) || 0)
          });
        }
      }
    } catch (error) {
      console.error('Error adding split transaction:', error);
      throw error;
    }
  };

  // Get split transactions for a parent transaction
  const getSplitTransactions = (parentId: string): Transaction[] => {
    return transactions.filter(t => t.parentTransactionId === parentId);
  };

  // Search transactions
  const searchTransactions = (query: string): Transaction[] => {
    if (!query) return transactions;
    
    const lowerQuery = query.toLowerCase();
    return transactions.filter(t => 
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
    );
  };

  // Get monthly trends for charts
  const getMonthlyTrends = (months: number = 6) => {
    const result = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => 
        t.date >= monthStart && t.date <= monthEnd
      );
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      result.push({
        month: format(date, 'MMM yyyy'),
        income,
        expenses,
        net: income - expenses
      });
    }
    
    return result;
  };

  // Get category breakdown
  const getCategoryBreakdown = (type: 'income' | 'expense', months: number = 3) => {
    const now = new Date();
    const startDate = subMonths(now, months);
    
    const filteredTransactions = transactions.filter(t => 
      t.type === type && t.date >= startDate
    );
    
    const categoryTotals: Record<string, number> = {};
    
    filteredTransactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (Number(t.amount) || 0);
    });
    
    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Get net worth trends
  const getNetWorthTrends = (months: number = 12) => {
    const result = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthEnd = endOfMonth(date);
      
      // Calculate liquid assets (income - expenses)
      const liquidAssets = transactions
        .filter(t => t.date <= monthEnd)
        .reduce((sum, t) => sum + (t.type === 'income' ? (Number(t.amount) || 0) : -(Number(t.amount) || 0)), 0);
      
      // Calculate goal savings
      const goalSavings = goals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
      
      // Calculate liabilities
      const totalLiabilities = liabilities.reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0);
      
      // Calculate net worth
      const netWorth = liquidAssets + goalSavings - totalLiabilities;
      
      result.push({
        month: format(date, 'MMM yyyy'),
        netWorth,
        liquidAssets,
        goalSavings,
        totalLiabilities
      });
    }
    
    return result;
  };

  // Calculate debt repayment strategy
  const calculateDebtRepaymentStrategy = (
    strategy: 'avalanche' | 'snowball',
    extraPayment: number = 0
  ): DebtRepaymentStrategy => {
    // Filter out paid off liabilities
    const activeDebts = liabilities.filter(debt => (Number(debt.remainingAmount) || 0) > 0);
    
    if (activeDebts.length === 0) {
      return {
        totalMonths: 0,
        totalInterestPaid: 0,
        totalPaid: 0,
        payoffDate: new Date(),
        debtPlans: []
      };
    }
    
    // Sort debts based on strategy
    const sortedDebts = [...activeDebts].sort((a, b) => {
      if (strategy === 'avalanche') {
        // Highest interest rate first
        return (Number(b.interestRate) || 0) - (Number(a.interestRate) || 0);
      } else {
        // Lowest balance first
        return (Number(a.remainingAmount) || 0) - (Number(b.remainingAmount) || 0);
      }
    });
    
    // Calculate total monthly payment
    const totalMonthlyPayment = sortedDebts.reduce((sum, debt) => sum + (Number(debt.monthlyPayment) || 0), 0);
    
    // Initialize debt plans
    const debtPlans = sortedDebts.map(debt => {
      return {
        id: debt.id,
        name: debt.name,
        remainingAmount: Number(debt.remainingAmount) || 0,
        interestRate: Number(debt.interestRate) || 0,
        monthlyPayment: Number(debt.monthlyPayment) || 0,
        payoffDate: new Date(),
        totalInterest: 0,
        payments: [] as Array<{
          date: Date;
          payment: number;
          principal: number;
          interest: number;
          remainingBalance: number;
        }>
      };
    });
    
    // Simulate payments
    let currentDate = new Date();
    let totalInterestPaid = 0;
    let totalPaid = 0;
    let isAllPaidOff = false;
    let monthsCount = 0;
    
    while (!isAllPaidOff && monthsCount < 360) { // 30 years max
      monthsCount++;
      
      // Calculate interest and make minimum payments
      let availableExtra = extraPayment;
      
      for (let i = 0; i < debtPlans.length; i++) {
        const plan = debtPlans[i];
        
        if (plan.remainingAmount <= 0) continue;
        
        // Calculate interest for this month
        const monthlyInterestRate = plan.interestRate / 100 / 12;
        const interestAmount = plan.remainingAmount * monthlyInterestRate;
        
        // Determine payment amount
        let paymentAmount = plan.monthlyPayment;
        
        // Add extra payment to the first debt in the list that's not paid off
        if (i === 0 && availableExtra > 0) {
          paymentAmount += availableExtra;
          availableExtra = 0;
        }
        
        // Adjust payment if it's more than remaining balance + interest
        paymentAmount = Math.min(paymentAmount, plan.remainingAmount + interestAmount);
        
        // Calculate principal payment
        const principalPayment = Math.max(0, paymentAmount - interestAmount);
        
        // Update remaining balance
        plan.remainingAmount = Math.max(0, plan.remainingAmount - principalPayment);
        
        // Update totals
        totalInterestPaid += interestAmount;
        totalPaid += paymentAmount;
        plan.totalInterest += interestAmount;
        
        // Record payment
        plan.payments.push({
          date: new Date(currentDate),
          payment: paymentAmount,
          principal: principalPayment,
          interest: interestAmount,
          remainingBalance: plan.remainingAmount
        });
        
        // Set payoff date if debt is now paid off
        if (plan.remainingAmount === 0 && plan.payments.length > 0) {
          plan.payoffDate = new Date(plan.payments[plan.payments.length - 1].date);
        }
      }
      
      // Check if all debts are paid off
      isAllPaidOff = debtPlans.every(plan => plan.remainingAmount === 0);
      
      // Move to next month
      currentDate = addMonths(currentDate, 1);
    }
    
    // Set final payoff date
    const payoffDate = new Date(Math.max(...debtPlans.map(plan => plan.payoffDate.getTime())));
    
    return {
      totalMonths: monthsCount,
      totalInterestPaid,
      totalPaid,
      payoffDate,
      debtPlans
    };
  };

  // Get financial forecast
  const getFinancialForecast = async () => {
    try {
      // Calculate current financial state
      const monthlyIncome = stats.monthlyIncome || 0;
      const monthlyExpenses = stats.monthlyExpenses || 0;
      const totalSavings = stats.totalSavings || 0;
      const totalLiabilities = stats.totalLiabilities || 0;
      
      // Calculate savings rate
      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
      
      // Calculate debt-to-income ratio
      const debtToIncomeRatio = monthlyIncome > 0 ? totalLiabilities / (monthlyIncome * 12) : 0;
      
      // Calculate budget utilization
      const budgetUtilization = stats.budgetUtilization || 0;
      
      // Calculate net worth
      const netWorth = stats.totalIncome - stats.totalExpenses - stats.totalLiabilities;
      
      // Prepare data for the API
      const financialData = {
        monthlyIncome,
        monthlyExpenses,
        totalSavings,
        totalLiabilities,
        savingsRate,
        debtToIncomeRatio,
        budgetUtilization,
        netWorth,
        expenseBreakdown: getCategoryBreakdown('expense', 3),
        incomeBreakdown: getCategoryBreakdown('income', 3),
        goals: goals.map(g => ({
          id: g.id,
          title: g.title,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          targetDate: g.targetDate.toISOString(),
        })),
        liabilities: liabilities.map(l => ({
          id: l.id,
          name: l.name,
          remainingAmount: l.remainingAmount,
          interestRate: l.interestRate,
          monthlyPayment: l.monthlyPayment,
        })),
        monthlyTrends: getMonthlyTrends(6)
      };

      // Call the financial forecaster API
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-forecaster`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ financialData }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error calling financial forecaster API:', error);
        
        // Return mock data if API call fails
        return {
          summary: `Your financial health is good with a net worth of ${formatCurrency(netWorth)} and a savings rate of ${savingsRate.toFixed(1)}%. Your debt-to-income ratio is ${(debtToIncomeRatio * 100).toFixed(1)}% and you're utilizing ${budgetUtilization.toFixed(1)}% of your budget.`,
          forecast: `Based on your current income of ${formatCurrency(monthlyIncome)} and expenses of ${formatCurrency(monthlyExpenses)} per month, you're projected to ${monthlyIncome > monthlyExpenses ? 'increase' : 'decrease'} your net worth by approximately ${formatCurrency(Math.abs(monthlyIncome - monthlyExpenses))} monthly.`,
          recommendations: [
            {
              title: "Increase Your Savings Rate",
              description: "Try to increase your savings rate to 20% by reducing discretionary spending or finding additional income sources.",
              impact: "medium"
            },
            {
              title: "Build Emergency Fund",
              description: "Aim to have 3-6 months of expenses saved in an easily accessible emergency fund.",
              impact: "high"
            },
            {
              title: "Optimize Debt Repayment",
              description: "Focus on paying down high-interest debt first to minimize interest payments over time.",
              impact: "medium"
            }
          ],
          healthScore: 75
        };
      }
    } catch (error) {
      console.error('Error generating financial forecast:', error);
      throw error;
    }
  };

  // Refresh financial insights
  const refreshInsights = async () => {
    try {
      // In a real app, this would call an AI service
      // For now, we'll generate some simple insights based on the data
      
      const newInsights = [];
      
      // Income vs Expenses
      const monthlyIncome = stats.monthlyIncome || 0;
      const monthlyExpenses = stats.monthlyExpenses || 0;
      
      if (monthlyExpenses > monthlyIncome) {
        newInsights.push({
          title: 'Spending Alert',
          description: `Your expenses (${formatCurrency(monthlyExpenses)}) exceed your income (${formatCurrency(monthlyIncome)}) this month. Consider reducing non-essential spending.`,
          type: 'warning' as const
        });
      } else if (monthlyIncome > 0 && (monthlyIncome - monthlyExpenses) / monthlyIncome < 0.2) {
        newInsights.push({
          title: 'Savings Opportunity',
          description: `You're saving less than 20% of your income. Try to increase your savings rate to build financial security.`,
          type: 'info' as const
        });
      } else if (monthlyIncome > 0 && (monthlyIncome - monthlyExpenses) / monthlyIncome > 0.3) {
        newInsights.push({
          title: 'Great Savings Rate',
          description: `You're saving over 30% of your income. Keep up the good work!`,
          type: 'positive' as const
        });
      }
      
      // Budget utilization
      if (budgets.length > 0) {
        const overBudgetCategories = budgets.filter(b => (Number(b.spent) || 0) > (Number(b.amount) || 0));
        
        if (overBudgetCategories.length > 0) {
          newInsights.push({
            title: 'Budget Alert',
            description: `You've exceeded your budget in ${overBudgetCategories.length} ${overBudgetCategories.length === 1 ? 'category' : 'categories'}. Review your spending in ${overBudgetCategories.map(b => b.category).join(', ')}.`,
            type: 'warning' as const
          });
        }
      }
      
      // Debt insights
      if (liabilities.length > 0) {
        const totalDebt = liabilities.reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0);
        const highInterestDebts = liabilities.filter(l => (Number(l.interestRate) || 0) > 15);
        
        if (highInterestDebts.length > 0) {
          newInsights.push({
            title: 'High Interest Debt',
            description: `You have ${highInterestDebts.length} high-interest ${highInterestDebts.length === 1 ? 'debt' : 'debts'} (>15% APR). Consider prioritizing these for repayment to save on interest.`,
            type: 'warning' as const
          });
        }
        
        if (monthlyIncome > 0 && totalDebt > monthlyIncome * 12) {
          newInsights.push({
            title: 'Debt-to-Income Ratio',
            description: `Your total debt is more than 12 times your monthly income. Focus on debt reduction to improve your financial health.`,
            type: 'info' as const
          });
        }
      }
      
      // Goal progress
      if (goals.length > 0) {
        const nearCompletionGoals = goals.filter(g => 
          (Number(g.currentAmount) || 0) / (Number(g.targetAmount) || 1) > 0.9 && 
          (Number(g.currentAmount) || 0) / (Number(g.targetAmount) || 1) < 1
        );
        
        if (nearCompletionGoals.length > 0) {
          newInsights.push({
            title: 'Goals Almost Complete',
            description: `You're over 90% of the way to completing ${nearCompletionGoals.length} financial ${nearCompletionGoals.length === 1 ? 'goal' : 'goals'}. Keep going!`,
            type: 'positive' as const
          });
        }
      }
      
      // Ensure we have at least 3 insights
      if (newInsights.length < 3) {
        newInsights.push({
          title: 'Track Your Spending',
          description: 'Regularly categorizing your expenses helps identify areas where you can save money.',
          type: 'info' as const
        });
        
        newInsights.push({
          title: 'Emergency Fund',
          description: 'Aim to save 3-6 months of expenses in an emergency fund for financial security.',
          type: 'info' as const
        });
        
        newInsights.push({
          title: 'Automate Your Finances',
          description: 'Set up recurring transactions for bills and savings to ensure consistency.',
          type: 'info' as const
        });
      }
      
      setInsights(newInsights);
    } catch (error) {
      console.error('Error refreshing insights:', error);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
    }).format(amount);
  };

  // Export data
  const exportData = async (format: 'json' | 'csv'): Promise<string> => {
    if (format === 'json') {
      const data = {
        transactions,
        goals,
        liabilities,
        budgets,
        recurringTransactions,
        userCategories
      };
      
      return JSON.stringify(data, null, 2);
    } else {
      // CSV export (transactions only for simplicity)
      const headers = ['id', 'type', 'amount', 'category', 'description', 'date'];
      const rows = transactions.map(t => [
        t.id,
        t.type,
        t.amount,
        t.category,
        t.description,
        t.date.toISOString().split('T')[0]
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      return csvContent;
    }
  };

  // Import data
  const importData = async (data: string, format: 'json' | 'csv'): Promise<void> => {
    if (!user) return;
    
    try {
      if (format === 'json') {
        const parsedData = JSON.parse(data);
        
        // Import transactions
        if (parsedData.transactions && Array.isArray(parsedData.transactions)) {
          for (const transaction of parsedData.transactions) {
            await addTransaction({
              ...transaction,
              date: new Date(transaction.date)
            });
          }
        }
        
        // Import goals
        if (parsedData.goals && Array.isArray(parsedData.goals)) {
          for (const goal of parsedData.goals) {
            await addGoal({
              ...goal,
              targetDate: new Date(goal.targetDate)
            });
          }
        }
        
        // Import liabilities
        if (parsedData.liabilities && Array.isArray(parsedData.liabilities)) {
          for (const liability of parsedData.liabilities) {
            await addLiability({
              ...liability,
              due_date: new Date(liability.due_date || liability.dueDate),
              start_date: new Date(liability.start_date || liability.createdAt || new Date())
            });
          }
        }
        
        // Import budgets
        if (parsedData.budgets && Array.isArray(parsedData.budgets)) {
          for (const budget of parsedData.budgets) {
            await addBudget(budget);
          }
        }
        
        // Import recurring transactions
        if (parsedData.recurringTransactions && Array.isArray(parsedData.recurringTransactions)) {
          for (const rt of parsedData.recurringTransactions) {
            await addRecurringTransaction({
              ...rt,
              startDate: new Date(rt.startDate),
              endDate: rt.endDate ? new Date(rt.endDate) : undefined,
              nextOccurrenceDate: new Date(rt.nextOccurrenceDate),
              lastProcessedDate: rt.lastProcessedDate ? new Date(rt.lastProcessedDate) : undefined
            });
          }
        }
        
        // Import user categories
        if (parsedData.userCategories && Array.isArray(parsedData.userCategories)) {
          for (const category of parsedData.userCategories) {
            await addUserCategory({
              name: category.name,
              type: category.type,
              icon: category.icon,
              color: category.color
            });
          }
        }
      } else {
        // CSV import (transactions only)
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length !== headers.length) continue;
          
          const transaction: any = {};
          headers.forEach((header, index) => {
            transaction[header] = values[index];
          });
          
          await addTransaction({
            type: transaction.type as 'income' | 'expense',
            amount: Number(transaction.amount) || 0,
            category: transaction.category,
            description: transaction.description,
            date: new Date(transaction.date)
          });
        }
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  };

  const value = {
    transactions,
    goals,
    liabilities,
    budgets,
    recurringTransactions,
    userCategories,
    stats,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    addLiability,
    updateLiability,
    deleteLiability,
    addBudget,
    updateBudget,
    deleteBudget,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    processRecurringTransactions,
    addUserCategory,
    updateUserCategory,
    deleteUserCategory,
    addSplitTransaction,
    getSplitTransactions,
    searchTransactions,
    getMonthlyTrends,
    getCategoryBreakdown,
    getNetWorthTrends,
    calculateDebtRepaymentStrategy,
    getFinancialForecast,
    insights,
    refreshInsights,
    exportData,
    importData
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};