import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, logQueryPerformance } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from '../components/common/Toast';
import { 
  Transaction, 
  Goal, 
  Liability, 
  Budget, 
  RecurringTransaction, 
  DashboardStats, 
  UserCategory,
  SplitTransaction,
  DebtRepaymentStrategy
} from '../types';

interface FinanceContextType {
  // Data
  transactions: Transaction[];
  goals: Goal[];
  liabilities: Liability[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  userCategories: UserCategory[];
  stats: DashboardStats;
  loading: boolean;
  
  // CRUD Operations
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addSplitTransaction: (mainTransaction: Omit<Transaction, 'id' | 'userId'>, splits: SplitTransaction[]) => Promise<void>;
  
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  addLiability: (liability: Omit<Liability, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateLiability: (id: string, updates: Partial<Liability>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
  
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'spent'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  addRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  
  addUserCategory: (category: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUserCategory: (id: string, updates: Partial<UserCategory>) => Promise<void>;
  deleteUserCategory: (id: string) => Promise<void>;
  
  // Utility functions
  searchTransactions: (query: string, filters?: any) => Transaction[];
  getMonthlyTrends: (months: number) => any[];
  getCategoryBreakdown: (type: 'income' | 'expense', months: number) => any[];
  getNetWorthTrends: (months: number) => any[];
  getSplitTransactions: (parentId: string) => Transaction[];
  getTransactionsPaginated: (page: number, pageSize: number, filters?: any) => Promise<{ data: Transaction[]; count: number }>;
  calculateDebtRepaymentStrategy: (strategy: 'snowball' | 'avalanche', extraPayment: number) => DebtRepaymentStrategy;
  exportData: (format: 'json' | 'csv') => Promise<string>;
  importData: (data: string, format: 'json' | 'csv') => Promise<void>;
  getFinancialForecast: () => Promise<any>;
  refreshInsights: () => Promise<void>;
  insights: any[];
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

// Timeout wrapper for Supabase operations
const withTimeout = async <T,>(
  operation: Promise<T>, 
  timeoutMs: number = 10000,
  operationName: string = 'Supabase operation'
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([operation, timeoutPromise]);
};

// Retry wrapper for Supabase operations
const withRetry = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  operationName: string = 'Operation'
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`${operationName} - Attempt ${attempt}/${maxRetries + 1}`);
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`${operationName} failed on attempt ${attempt}:`, error);
      
      if (attempt <= maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`Retrying ${operationName} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Clear data when user logs out
      setTransactions([]);
      setGoals([]);
      setLiabilities([]);
      setBudgets([]);
      setRecurringTransactions([]);
      setUserCategories([]);
      setInsights([]);
      setLoading(false);
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔄 Loading all financial data for user:', user.id);
      
      // Load all data in parallel for better performance
      const [
        transactionsResult,
        goalsResult,
        liabilitiesResult,
        budgetsResult,
        recurringResult,
        categoriesResult
      ] = await Promise.allSettled([
        loadTransactions(),
        loadGoals(),
        loadLiabilities(),
        loadBudgets(),
        loadRecurringTransactions(),
        loadUserCategories()
      ]);

      // Log any failed operations
      [transactionsResult, goalsResult, liabilitiesResult, budgetsResult, recurringResult, categoriesResult]
        .forEach((result, index) => {
          const names = ['transactions', 'goals', 'liabilities', 'budgets', 'recurring', 'categories'];
          if (result.status === 'rejected') {
            console.error(`❌ Failed to load ${names[index]}:`, result.reason);
            showToast(`Failed to load ${names[index]}`, 'error');
          } else {
            console.log(`✅ Successfully loaded ${names[index]}`);
          }
        });

    } catch (error: any) {
      console.error('❌ Error loading financial data:', error);
      showToast('Failed to load financial data', 'error');
    } finally {
      setLoading(false);
      console.log('✅ Finished loading all financial data');
    }
  };

  // Load functions with enhanced error handling and logging
  const loadTransactions = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      console.log('🔄 Loading transactions...');
      
      const { data, error } = await withTimeout(
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        8000,
        'Load transactions'
      );

      logQueryPerformance('load-transactions', startTime);

      if (error) {
        console.error('❌ Supabase error loading transactions:', error);
        throw new Error(`Failed to load transactions: ${error.message}`);
      }

      const formattedTransactions = (data || []).map(t => ({
        ...t,
        date: new Date(t.date),
        createdAt: new Date(t.created_at),
      }));

      setTransactions(formattedTransactions);
      console.log(`✅ Loaded ${formattedTransactions.length} transactions`);
    } catch (error: any) {
      console.error('❌ Error in loadTransactions:', error);
      throw error;
    }
  };

  const loadGoals = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      console.log('🔄 Loading goals...');
      
      const { data, error } = await withTimeout(
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        8000,
        'Load goals'
      );

      logQueryPerformance('load-goals', startTime);

      if (error) {
        console.error('❌ Supabase error loading goals:', error);
        throw new Error(`Failed to load goals: ${error.message}`);
      }

      const formattedGoals = (data || []).map(g => ({
        ...g,
        targetDate: new Date(g.target_date),
        createdAt: new Date(g.created_at),
        targetAmount: Number(g.target_amount),
        currentAmount: Number(g.current_amount),
      }));

      setGoals(formattedGoals);
      console.log(`✅ Loaded ${formattedGoals.length} goals`);
    } catch (error: any) {
      console.error('❌ Error in loadGoals:', error);
      throw error;
    }
  };

  const loadLiabilities = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      console.log('🔄 Loading liabilities...');
      
      const { data, error } = await withTimeout(
        supabase
          .from('liabilities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        8000,
        'Load liabilities'
      );

      logQueryPerformance('load-liabilities', startTime);

      if (error) {
        console.error('❌ Supabase error loading liabilities:', error);
        throw new Error(`Failed to load liabilities: ${error.message}`);
      }

      const formattedLiabilities = (data || []).map(l => ({
        ...l,
        dueDate: new Date(l.due_date),
        createdAt: new Date(l.created_at),
        totalAmount: Number(l.total_amount),
        remainingAmount: Number(l.remaining_amount),
        interestRate: Number(l.interest_rate),
        monthlyPayment: Number(l.monthly_payment),
      }));

      setLiabilities(formattedLiabilities);
      console.log(`✅ Loaded ${formattedLiabilities.length} liabilities`);
    } catch (error: any) {
      console.error('❌ Error in loadLiabilities:', error);
      throw error;
    }
  };

  const loadBudgets = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      console.log('🔄 Loading budgets...');
      
      const { data, error } = await withTimeout(
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        8000,
        'Load budgets'
      );

      logQueryPerformance('load-budgets', startTime);

      if (error) {
        console.error('❌ Supabase error loading budgets:', error);
        throw new Error(`Failed to load budgets: ${error.message}`);
      }

      const formattedBudgets = (data || []).map(b => ({
        ...b,
        createdAt: new Date(b.created_at),
        amount: Number(b.amount),
        spent: Number(b.spent),
      }));

      setBudgets(formattedBudgets);
      console.log(`✅ Loaded ${formattedBudgets.length} budgets`);
    } catch (error: any) {
      console.error('❌ Error in loadBudgets:', error);
      throw error;
    }
  };

  const loadRecurringTransactions = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      console.log('🔄 Loading recurring transactions...');
      
      const { data, error } = await withTimeout(
        supabase
          .from('recurring_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        8000,
        'Load recurring transactions'
      );

      logQueryPerformance('load-recurring-transactions', startTime);

      if (error) {
        console.error('❌ Supabase error loading recurring transactions:', error);
        throw new Error(`Failed to load recurring transactions: ${error.message}`);
      }

      const formattedRecurring = (data || []).map(rt => ({
        ...rt,
        startDate: new Date(rt.start_date),
        endDate: rt.end_date ? new Date(rt.end_date) : undefined,
        nextOccurrenceDate: new Date(rt.next_occurrence_date),
        lastProcessedDate: rt.last_processed_date ? new Date(rt.last_processed_date) : undefined,
        createdAt: new Date(rt.created_at),
        amount: Number(rt.amount),
      }));

      setRecurringTransactions(formattedRecurring);
      console.log(`✅ Loaded ${formattedRecurring.length} recurring transactions`);
    } catch (error: any) {
      console.error('❌ Error in loadRecurringTransactions:', error);
      throw error;
    }
  };

  const loadUserCategories = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      console.log('🔄 Loading user categories...');
      
      const { data, error } = await withTimeout(
        supabase
          .from('user_categories')
          .select('id, name, type, icon, color, created_at, updated_at')
          .eq('user_id', user.id)
          .order('name', { ascending: true }),
        8000,
        'Load user categories'
      );

      logQueryPerformance('load-user-categories', startTime);

      if (error) {
        console.error('❌ Supabase error loading user categories:', error);
        throw new Error(`Failed to load user categories: ${error.message}`);
      }

      const formattedCategories = (data || []).map(c => ({
        ...c,
        userId: user.id,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      }));

      setUserCategories(formattedCategories);
      console.log(`✅ Loaded ${formattedCategories.length} user categories`);
    } catch (error: any) {
      console.error('❌ Error in loadUserCategories:', error);
      throw error;
    }
  };

  // Enhanced CRUD operations with comprehensive error handling
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Adding transaction:', transaction);
      const startTime = Date.now();
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('transactions')
            .insert([{
              user_id: user.id,
              type: transaction.type,
              amount: transaction.amount,
              category: transaction.category,
              description: transaction.description,
              date: transaction.date.toISOString().split('T')[0],
              recurring_transaction_id: transaction.recurringTransactionId || null,
              parent_transaction_id: transaction.parentTransactionId || null,
            }])
            .select()
            .single();
        }, 2, 'Add transaction'),
        10000,
        'Add transaction'
      );

      logQueryPerformance('add-transaction', startTime);

      if (error) {
        console.error('❌ Supabase error adding transaction:', error);
        throw new Error(`Failed to add transaction: ${error.message}`);
      }

      console.log('✅ Transaction added successfully:', data);
      
      // Update local state
      const newTransaction = {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.created_at),
        userId: user.id,
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Update budget spent if it's an expense
      if (transaction.type === 'expense') {
        await updateBudgetSpent(transaction.category, transaction.amount);
      }
      
      showToast('Transaction added successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in addTransaction:', error);
      showToast(error.message || 'Failed to add transaction', 'error');
      throw error;
    }
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Adding goal:', goal);
      const startTime = Date.now();
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('goals')
            .insert([{
              user_id: user.id,
              title: goal.title,
              description: goal.description,
              target_amount: goal.targetAmount,
              current_amount: goal.currentAmount || 0,
              target_date: goal.targetDate.toISOString().split('T')[0],
              category: goal.category,
            }])
            .select()
            .single();
        }, 2, 'Add goal'),
        10000,
        'Add goal'
      );

      logQueryPerformance('add-goal', startTime);

      if (error) {
        console.error('❌ Supabase error adding goal:', error);
        throw new Error(`Failed to add goal: ${error.message}`);
      }

      console.log('✅ Goal added successfully:', data);
      
      // Update local state
      const newGoal = {
        ...data,
        targetDate: new Date(data.target_date),
        createdAt: new Date(data.created_at),
        targetAmount: Number(data.target_amount),
        currentAmount: Number(data.current_amount),
        userId: user.id,
      };
      
      setGoals(prev => [newGoal, ...prev]);
      showToast('Goal added successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in addGoal:', error);
      showToast(error.message || 'Failed to add goal', 'error');
      throw error;
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'spent'>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Adding budget:', budget);
      const startTime = Date.now();
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('budgets')
            .insert([{
              user_id: user.id,
              category: budget.category,
              amount: budget.amount,
              spent: 0,
              period: budget.period,
            }])
            .select()
            .single();
        }, 2, 'Add budget'),
        10000,
        'Add budget'
      );

      logQueryPerformance('add-budget', startTime);

      if (error) {
        console.error('❌ Supabase error adding budget:', error);
        throw new Error(`Failed to add budget: ${error.message}`);
      }

      console.log('✅ Budget added successfully:', data);
      
      // Update local state
      const newBudget = {
        ...data,
        createdAt: new Date(data.created_at),
        amount: Number(data.amount),
        spent: Number(data.spent),
        userId: user.id,
      };
      
      setBudgets(prev => [newBudget, ...prev]);
      showToast('Budget added successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in addBudget:', error);
      showToast(error.message || 'Failed to add budget', 'error');
      throw error;
    }
  };

  const addLiability = async (liability: Omit<Liability, 'id' | 'userId' | 'createdAt'>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Adding liability:', liability);
      const startTime = Date.now();
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('liabilities')
            .insert([{
              user_id: user.id,
              name: liability.name,
              type: liability.type,
              total_amount: liability.totalAmount,
              remaining_amount: liability.remainingAmount,
              interest_rate: liability.interestRate,
              monthly_payment: liability.monthlyPayment,
              due_date: liability.due_date.toISOString().split('T')[0],
              start_date: liability.start_date.toISOString().split('T')[0],
              linked_purchase_id: liability.linkedPurchaseId || null,
            }])
            .select()
            .single();
        }, 2, 'Add liability'),
        10000,
        'Add liability'
      );

      logQueryPerformance('add-liability', startTime);

      if (error) {
        console.error('❌ Supabase error adding liability:', error);
        throw new Error(`Failed to add liability: ${error.message}`);
      }

      console.log('✅ Liability added successfully:', data);
      
      // Update local state
      const newLiability = {
        ...data,
        dueDate: new Date(data.due_date),
        createdAt: new Date(data.created_at),
        totalAmount: Number(data.total_amount),
        remainingAmount: Number(data.remaining_amount),
        interestRate: Number(data.interest_rate),
        monthlyPayment: Number(data.monthly_payment),
        userId: user.id,
      };
      
      setLiabilities(prev => [newLiability, ...prev]);
      showToast('Liability added successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in addLiability:', error);
      showToast(error.message || 'Failed to add liability', 'error');
      throw error;
    }
  };

  const addRecurringTransaction = async (transaction: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Adding recurring transaction:', transaction);
      const startTime = Date.now();
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('recurring_transactions')
            .insert([{
              user_id: user.id,
              type: transaction.type,
              amount: transaction.amount,
              category: transaction.category,
              description: transaction.description,
              frequency: transaction.frequency,
              start_date: transaction.startDate.toISOString().split('T')[0],
              end_date: transaction.endDate ? transaction.endDate.toISOString().split('T')[0] : null,
              next_occurrence_date: transaction.nextOccurrenceDate.toISOString().split('T')[0],
              last_processed_date: transaction.lastProcessedDate ? transaction.lastProcessedDate.toISOString().split('T')[0] : null,
              is_active: transaction.isActive,
              day_of_week: transaction.dayOfWeek || null,
              day_of_month: transaction.dayOfMonth || null,
              month_of_year: transaction.monthOfYear || null,
              max_occurrences: transaction.maxOccurrences || null,
              current_occurrences: transaction.currentOccurrences || 0,
            }])
            .select()
            .single();
        }, 2, 'Add recurring transaction'),
        10000,
        'Add recurring transaction'
      );

      logQueryPerformance('add-recurring-transaction', startTime);

      if (error) {
        console.error('❌ Supabase error adding recurring transaction:', error);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to add recurring transaction: ${error.message}`);
      }

      console.log('✅ Recurring transaction added successfully:', data);
      
      // Update local state
      const newRecurring = {
        ...data,
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        nextOccurrenceDate: new Date(data.next_occurrence_date),
        lastProcessedDate: data.last_processed_date ? new Date(data.last_processed_date) : undefined,
        createdAt: new Date(data.created_at),
        amount: Number(data.amount),
        userId: user.id,
      };
      
      setRecurringTransactions(prev => [newRecurring, ...prev]);
      showToast('Recurring transaction added successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in addRecurringTransaction:', error);
      showToast(error.message || 'Failed to add recurring transaction', 'error');
      throw error;
    }
  };

  const addUserCategory = async (category: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Adding user category:', category);
      const startTime = Date.now();
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('user_categories')
            .insert([{
              user_id: user.id,
              name: category.name,
              type: category.type,
              icon: category.icon || null,
              color: category.color || null,
            }])
            .select()
            .single();
        }, 2, 'Add user category'),
        10000,
        'Add user category'
      );

      logQueryPerformance('add-user-category', startTime);

      if (error) {
        console.error('❌ Supabase error adding user category:', error);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to add user category: ${error.message}`);
      }

      console.log('✅ User category added successfully:', data);
      
      // Update local state immediately
      const newCategory = {
        ...data,
        userId: user.id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
      
      setUserCategories(prev => [...prev, newCategory]);
      showToast('Category added successfully', 'success');
      
      // Force reload to ensure sync
      setTimeout(() => {
        loadUserCategories().catch(console.error);
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Error in addUserCategory:', error);
      showToast(error.message || 'Failed to add category', 'error');
      throw error;
    }
  };

  // Update operations with enhanced error handling
  const updateGoal = async (id: string, updates: Partial<Goal>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Updating goal:', id, updates);
      const startTime = Date.now();
      
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount;
      if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount;
      if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate.toISOString().split('T')[0];
      if (updates.category !== undefined) updateData.category = updates.category;
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('goals')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
        }, 2, 'Update goal'),
        10000,
        'Update goal'
      );

      logQueryPerformance('update-goal', startTime);

      if (error) {
        console.error('❌ Supabase error updating goal:', error);
        throw new Error(`Failed to update goal: ${error.message}`);
      }

      console.log('✅ Goal updated successfully:', data);
      
      // Update local state
      setGoals(prev => prev.map(g => g.id === id ? {
        ...g,
        ...updates,
        targetDate: updates.targetDate || g.targetDate,
      } : g));
      
      showToast('Goal updated successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in updateGoal:', error);
      showToast(error.message || 'Failed to update goal', 'error');
      throw error;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Updating budget:', id, updates);
      const startTime = Date.now();
      
      const updateData: any = {};
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.spent !== undefined) updateData.spent = updates.spent;
      if (updates.period !== undefined) updateData.period = updates.period;
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('budgets')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
        }, 2, 'Update budget'),
        10000,
        'Update budget'
      );

      logQueryPerformance('update-budget', startTime);

      if (error) {
        console.error('❌ Supabase error updating budget:', error);
        throw new Error(`Failed to update budget: ${error.message}`);
      }

      console.log('✅ Budget updated successfully:', data);
      
      // Update local state
      setBudgets(prev => prev.map(b => b.id === id ? {
        ...b,
        ...updates,
      } : b));
      
      showToast('Budget updated successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in updateBudget:', error);
      showToast(error.message || 'Failed to update budget', 'error');
      throw error;
    }
  };

  const updateLiability = async (id: string, updates: Partial<Liability>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Updating liability:', id, updates);
      const startTime = Date.now();
      
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.totalAmount !== undefined) updateData.total_amount = updates.totalAmount;
      if (updates.remainingAmount !== undefined) updateData.remaining_amount = updates.remainingAmount;
      if (updates.interestRate !== undefined) updateData.interest_rate = updates.interestRate;
      if (updates.monthlyPayment !== undefined) updateData.monthly_payment = updates.monthlyPayment;
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date.toISOString().split('T')[0];
      if (updates.start_date !== undefined) updateData.start_date = updates.start_date.toISOString().split('T')[0];
      if (updates.linkedPurchaseId !== undefined) updateData.linked_purchase_id = updates.linkedPurchaseId;
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('liabilities')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
        }, 2, 'Update liability'),
        10000,
        'Update liability'
      );

      logQueryPerformance('update-liability', startTime);

      if (error) {
        console.error('❌ Supabase error updating liability:', error);
        throw new Error(`Failed to update liability: ${error.message}`);
      }

      console.log('✅ Liability updated successfully:', data);
      
      // Update local state
      setLiabilities(prev => prev.map(l => l.id === id ? {
        ...l,
        ...updates,
        dueDate: updates.due_date || l.dueDate,
      } : l));
      
      showToast('Liability updated successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in updateLiability:', error);
      showToast(error.message || 'Failed to update liability', 'error');
      throw error;
    }
  };

  const updateRecurringTransaction = async (id: string, updates: Partial<RecurringTransaction>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Updating recurring transaction:', id, updates);
      const startTime = Date.now();
      
      const updateData: any = {};
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString().split('T')[0];
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate ? updates.endDate.toISOString().split('T')[0] : null;
      if (updates.nextOccurrenceDate !== undefined) updateData.next_occurrence_date = updates.nextOccurrenceDate.toISOString().split('T')[0];
      if (updates.lastProcessedDate !== undefined) updateData.last_processed_date = updates.lastProcessedDate ? updates.lastProcessedDate.toISOString().split('T')[0] : null;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.dayOfWeek !== undefined) updateData.day_of_week = updates.dayOfWeek;
      if (updates.dayOfMonth !== undefined) updateData.day_of_month = updates.dayOfMonth;
      if (updates.monthOfYear !== undefined) updateData.month_of_year = updates.monthOfYear;
      if (updates.maxOccurrences !== undefined) updateData.max_occurrences = updates.maxOccurrences;
      if (updates.currentOccurrences !== undefined) updateData.current_occurrences = updates.currentOccurrences;
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('recurring_transactions')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
        }, 2, 'Update recurring transaction'),
        10000,
        'Update recurring transaction'
      );

      logQueryPerformance('update-recurring-transaction', startTime);

      if (error) {
        console.error('❌ Supabase error updating recurring transaction:', error);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to update recurring transaction: ${error.message}`);
      }

      console.log('✅ Recurring transaction updated successfully:', data);
      
      // Update local state
      setRecurringTransactions(prev => prev.map(rt => rt.id === id ? {
        ...rt,
        ...updates,
        startDate: updates.startDate || rt.startDate,
        endDate: updates.endDate !== undefined ? updates.endDate : rt.endDate,
        nextOccurrenceDate: updates.nextOccurrenceDate || rt.nextOccurrenceDate,
        lastProcessedDate: updates.lastProcessedDate !== undefined ? updates.lastProcessedDate : rt.lastProcessedDate,
      } : rt));
      
      showToast('Recurring transaction updated successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in updateRecurringTransaction:', error);
      showToast(error.message || 'Failed to update recurring transaction', 'error');
      throw error;
    }
  };

  const updateUserCategory = async (id: string, updates: Partial<UserCategory>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Updating user category:', id, updates);
      const startTime = Date.now();
      
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.color !== undefined) updateData.color = updates.color;
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('user_categories')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
        }, 2, 'Update user category'),
        10000,
        'Update user category'
      );

      logQueryPerformance('update-user-category', startTime);

      if (error) {
        console.error('❌ Supabase error updating user category:', error);
        throw new Error(`Failed to update user category: ${error.message}`);
      }

      console.log('✅ User category updated successfully:', data);
      
      // Update local state immediately
      setUserCategories(prev => prev.map(c => c.id === id ? {
        ...c,
        ...updates,
        updatedAt: new Date(),
      } : c));
      
      showToast('Category updated successfully', 'success');
      
      // Force reload to ensure sync
      setTimeout(() => {
        loadUserCategories().catch(console.error);
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Error in updateUserCategory:', error);
      showToast(error.message || 'Failed to update category', 'error');
      throw error;
    }
  };

  // Delete operations with enhanced error handling
  const deleteGoal = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Deleting goal:', id);
      const startTime = Date.now();
      
      const { error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('goals')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        }, 2, 'Delete goal'),
        10000,
        'Delete goal'
      );

      logQueryPerformance('delete-goal', startTime);

      if (error) {
        console.error('❌ Supabase error deleting goal:', error);
        throw new Error(`Failed to delete goal: ${error.message}`);
      }

      console.log('✅ Goal deleted successfully');
      
      // Update local state
      setGoals(prev => prev.filter(g => g.id !== id));
      showToast('Goal deleted successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in deleteGoal:', error);
      showToast(error.message || 'Failed to delete goal', 'error');
      throw error;
    }
  };

  const deleteBudget = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Deleting budget:', id);
      const startTime = Date.now();
      
      const { error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('budgets')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        }, 2, 'Delete budget'),
        10000,
        'Delete budget'
      );

      logQueryPerformance('delete-budget', startTime);

      if (error) {
        console.error('❌ Supabase error deleting budget:', error);
        throw new Error(`Failed to delete budget: ${error.message}`);
      }

      console.log('✅ Budget deleted successfully');
      
      // Update local state
      setBudgets(prev => prev.filter(b => b.id !== id));
      showToast('Budget deleted successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in deleteBudget:', error);
      showToast(error.message || 'Failed to delete budget', 'error');
      throw error;
    }
  };

  const deleteLiability = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Deleting liability:', id);
      const startTime = Date.now();
      
      const { error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('liabilities')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        }, 2, 'Delete liability'),
        10000,
        'Delete liability'
      );

      logQueryPerformance('delete-liability', startTime);

      if (error) {
        console.error('❌ Supabase error deleting liability:', error);
        throw new Error(`Failed to delete liability: ${error.message}`);
      }

      console.log('✅ Liability deleted successfully');
      
      // Update local state
      setLiabilities(prev => prev.filter(l => l.id !== id));
      showToast('Liability deleted successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in deleteLiability:', error);
      showToast(error.message || 'Failed to delete liability', 'error');
      throw error;
    }
  };

  const deleteRecurringTransaction = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Deleting recurring transaction:', id);
      const startTime = Date.now();
      
      const { error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('recurring_transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        }, 2, 'Delete recurring transaction'),
        10000,
        'Delete recurring transaction'
      );

      logQueryPerformance('delete-recurring-transaction', startTime);

      if (error) {
        console.error('❌ Supabase error deleting recurring transaction:', error);
        throw new Error(`Failed to delete recurring transaction: ${error.message}`);
      }

      console.log('✅ Recurring transaction deleted successfully');
      
      // Update local state
      setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
      showToast('Recurring transaction deleted successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in deleteRecurringTransaction:', error);
      showToast(error.message || 'Failed to delete recurring transaction', 'error');
      throw error;
    }
  };

  const deleteUserCategory = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Deleting user category:', id);
      const startTime = Date.now();
      
      const { error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('user_categories')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        }, 2, 'Delete user category'),
        10000,
        'Delete user category'
      );

      logQueryPerformance('delete-user-category', startTime);

      if (error) {
        console.error('❌ Supabase error deleting user category:', error);
        throw new Error(`Failed to delete user category: ${error.message}`);
      }

      console.log('✅ User category deleted successfully');
      
      // Update local state immediately
      setUserCategories(prev => prev.filter(c => c.id !== id));
      showToast('Category deleted successfully', 'success');
      
      // Force reload to ensure sync
      setTimeout(() => {
        loadUserCategories().catch(console.error);
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Error in deleteUserCategory:', error);
      showToast(error.message || 'Failed to delete category', 'error');
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Updating transaction:', id, updates);
      const startTime = Date.now();
      
      const updateData: any = {};
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.date !== undefined) updateData.date = updates.date.toISOString().split('T')[0];
      
      const { data, error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('transactions')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
        }, 2, 'Update transaction'),
        10000,
        'Update transaction'
      );

      logQueryPerformance('update-transaction', startTime);

      if (error) {
        console.error('❌ Supabase error updating transaction:', error);
        throw new Error(`Failed to update transaction: ${error.message}`);
      }

      console.log('✅ Transaction updated successfully:', data);
      
      // Update local state
      setTransactions(prev => prev.map(t => t.id === id ? {
        ...t,
        ...updates,
        date: updates.date || t.date,
      } : t));
      
      showToast('Transaction updated successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in updateTransaction:', error);
      showToast(error.message || 'Failed to update transaction', 'error');
      throw error;
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Deleting transaction:', id);
      const startTime = Date.now();
      
      const { error } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        }, 2, 'Delete transaction'),
        10000,
        'Delete transaction'
      );

      logQueryPerformance('delete-transaction', startTime);

      if (error) {
        console.error('❌ Supabase error deleting transaction:', error);
        throw new Error(`Failed to delete transaction: ${error.message}`);
      }

      console.log('✅ Transaction deleted successfully');
      
      // Update local state
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast('Transaction deleted successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in deleteTransaction:', error);
      showToast(error.message || 'Failed to delete transaction', 'error');
      throw error;
    }
  };

  // Helper function to update budget spent amount
  const updateBudgetSpent = async (category: string, amount: number): Promise<void> => {
    try {
      const budget = budgets.find(b => b.category === category);
      if (!budget) {
        console.warn(`⚠️ Budget category '${category}' not found for spending update`);
        return;
      }

      const newSpent = budget.spent + amount;
      await updateBudget(budget.id, { spent: newSpent });
    } catch (error) {
      console.error('❌ Error updating budget spent:', error);
      // Don't throw here as this is a secondary operation
    }
  };

  // Split transaction implementation
  const addSplitTransaction = async (
    mainTransaction: Omit<Transaction, 'id' | 'userId'>, 
    splits: SplitTransaction[]
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Adding split transaction:', mainTransaction, splits);
      const startTime = Date.now();
      
      // First, add the main transaction
      const { data: mainData, error: mainError } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('transactions')
            .insert([{
              user_id: user.id,
              type: mainTransaction.type,
              amount: mainTransaction.amount,
              category: 'Split Transaction',
              description: mainTransaction.description,
              date: mainTransaction.date.toISOString().split('T')[0],
            }])
            .select()
            .single();
        }, 2, 'Add main split transaction'),
        10000,
        'Add main split transaction'
      );

      if (mainError) {
        console.error('❌ Error adding main split transaction:', mainError);
        throw new Error(`Failed to add split transaction: ${mainError.message}`);
      }

      console.log('✅ Main split transaction added:', mainData);

      // Then add each split as a child transaction
      const splitInserts = splits.map(split => ({
        user_id: user.id,
        type: mainTransaction.type,
        amount: split.amount,
        category: split.category,
        description: split.description,
        date: mainTransaction.date.toISOString().split('T')[0],
        parent_transaction_id: mainData.id,
      }));

      const { data: splitData, error: splitError } = await withTimeout(
        withRetry(async () => {
          return supabase
            .from('transactions')
            .insert(splitInserts)
            .select();
        }, 2, 'Add split transactions'),
        10000,
        'Add split transactions'
      );

      logQueryPerformance('add-split-transaction', startTime);

      if (splitError) {
        console.error('❌ Error adding split transactions:', splitError);
        // Try to clean up the main transaction
        await supabase.from('transactions').delete().eq('id', mainData.id);
        throw new Error(`Failed to add split transactions: ${splitError.message}`);
      }

      console.log('✅ Split transactions added successfully:', splitData);

      // Update local state
      const newMainTransaction = {
        ...mainData,
        date: new Date(mainData.date),
        createdAt: new Date(mainData.created_at),
        userId: user.id,
      };

      const newSplitTransactions = (splitData || []).map(s => ({
        ...s,
        date: new Date(s.date),
        createdAt: new Date(s.created_at),
        userId: user.id,
      }));

      setTransactions(prev => [newMainTransaction, ...newSplitTransactions, ...prev]);
      
      // Update budgets for each split
      for (const split of splits) {
        await updateBudgetSpent(split.category, split.amount);
      }
      
      showToast('Split transaction added successfully', 'success');
    } catch (error: any) {
      console.error('❌ Error in addSplitTransaction:', error);
      showToast(error.message || 'Failed to add split transaction', 'error');
      throw error;
    }
  };

  // Utility functions
  const searchTransactions = (query: string, filters?: any): Transaction[] => {
    if (!query && !filters) return transactions;
    
    return transactions.filter(transaction => {
      // Text search
      if (query) {
        const searchLower = query.toLowerCase();
        const matchesSearch = 
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Apply filters if provided
      if (filters) {
        if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) {
          return false;
        }
        if (filters.category && transaction.category !== filters.category) {
          return false;
        }
        // Add more filter logic as needed
      }
      
      return true;
    });
  };

  const getMonthlyTrends = (months: number) => {
    const trends = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTransactions = transactions.filter(t => 
        t.date.getMonth() === date.getMonth() && 
        t.date.getFullYear() === date.getFullYear()
      );
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      trends.push({
        month: date.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
        income,
        expenses,
        net: income - expenses
      });
    }
    
    return trends;
  };

  const getCategoryBreakdown = (type: 'income' | 'expense', months: number) => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    const relevantTransactions = transactions.filter(t => 
      t.type === type && t.date >= cutoffDate
    );
    
    const categoryTotals = relevantTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0
    }));
  };

  const getNetWorthTrends = (months: number) => {
    const trends = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      // Calculate cumulative values up to this month
      const cumulativeTransactions = transactions.filter(t => t.date <= endDate);
      const cumulativeGoals = goals.filter(g => g.createdAt <= endDate);
      const cumulativeLiabilities = liabilities.filter(l => l.createdAt <= endDate);
      
      const liquidAssets = cumulativeTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) - 
        cumulativeTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const goalSavings = cumulativeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
      const totalLiabilities = cumulativeLiabilities.reduce((sum, l) => sum + l.remainingAmount, 0);
      
      trends.push({
        month: date.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
        netWorth: liquidAssets + goalSavings - totalLiabilities,
        liquidAssets,
        goalSavings,
        totalLiabilities
      });
    }
    
    return trends;
  };

  const getSplitTransactions = (parentId: string): Transaction[] => {
    return transactions.filter(t => t.parentTransactionId === parentId);
  };

  const getTransactionsPaginated = async (
    page: number, 
    pageSize: number, 
    filters?: any
  ): Promise<{ data: Transaction[]; count: number }> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('🔄 Loading paginated transactions:', { page, pageSize, filters });
      const startTime = Date.now();
      
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply filters
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.search) {
        query = query.or(`description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
      }

      // Apply pagination and ordering
      query = query
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error, count } = await withTimeout(query, 8000, 'Paginated transactions');

      logQueryPerformance('paginated-transactions', startTime);

      if (error) {
        console.error('❌ Error loading paginated transactions:', error);
        throw new Error(`Failed to load transactions: ${error.message}`);
      }

      const formattedData = (data || []).map(t => ({
        ...t,
        date: new Date(t.date),
        createdAt: new Date(t.created_at),
        userId: user.id,
      }));

      console.log(`✅ Loaded ${formattedData.length} transactions (page ${page + 1})`);
      
      return { data: formattedData, count: count || 0 };
    } catch (error: any) {
      console.error('❌ Error in getTransactionsPaginated:', error);
      throw error;
    }
  };

  // Calculate dashboard stats
  const stats: DashboardStats = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    totalSavings: goals.reduce((sum, g) => sum + g.currentAmount, 0),
    totalLiabilities: liabilities.reduce((sum, l) => sum + l.remainingAmount, 0),
    monthlyIncome: getMonthlyTrends(1)[0]?.income || 0,
    monthlyExpenses: getMonthlyTrends(1)[0]?.expenses || 0,
    budgetUtilization: budgets.length > 0 
      ? budgets.reduce((sum, b) => sum + (b.spent / b.amount * 100), 0) / budgets.length 
      : 0,
  };

  // Debt repayment strategy calculation
  const calculateDebtRepaymentStrategy = (
    strategy: 'snowball' | 'avalanche', 
    extraPayment: number
  ): DebtRepaymentStrategy => {
    const activeDebts = liabilities.filter(l => l.remainingAmount > 0);
    
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
      if (strategy === 'snowball') {
        return a.remainingAmount - b.remainingAmount; // Smallest first
      } else {
        return b.interestRate - a.interestRate; // Highest interest first
      }
    });

    const debtPlans: any[] = [];
    let totalInterestPaid = 0;
    let totalPaid = 0;
    let currentDate = new Date();
    let availableExtraPayment = extraPayment;

    // Calculate payoff for each debt
    sortedDebts.forEach((debt, index) => {
      let balance = debt.remainingAmount;
      let monthlyPayment = debt.monthlyPayment;
      let totalInterest = 0;
      const payments = [];
      
      // Add extra payment to current debt being focused on
      if (index === 0) {
        monthlyPayment += availableExtraPayment;
      }
      
      const monthlyInterestRate = debt.interestRate / 100 / 12;
      let paymentDate = new Date(currentDate);
      
      while (balance > 0.01) {
        const interestPayment = balance * monthlyInterestRate;
        const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
        
        if (principalPayment <= 0) break; // Payment too small to cover interest
        
        balance -= principalPayment;
        totalInterest += interestPayment;
        
        payments.push({
          date: new Date(paymentDate),
          payment: monthlyPayment,
          principal: principalPayment,
          interest: interestPayment,
          remainingBalance: balance
        });
        
        paymentDate.setMonth(paymentDate.getMonth() + 1);
      }
      
      debtPlans.push({
        id: debt.id,
        name: debt.name,
        remainingAmount: debt.remainingAmount,
        interestRate: debt.interestRate,
        monthlyPayment: monthlyPayment,
        payoffDate: paymentDate,
        totalInterest,
        payments
      });
      
      totalInterestPaid += totalInterest;
      totalPaid += debt.remainingAmount + totalInterest;
      
      // After this debt is paid off, add its payment to extra payment pool
      availableExtraPayment += debt.monthlyPayment;
      currentDate = paymentDate;
    });

    return {
      totalMonths: Math.max(...debtPlans.map(p => p.payments.length)),
      totalInterestPaid,
      totalPaid,
      payoffDate: new Date(Math.max(...debtPlans.map(p => p.payoffDate.getTime()))),
      debtPlans
    };
  };

  // Export/Import functionality
  const exportData = async (format: 'json' | 'csv'): Promise<string> => {
    const exportData = {
      transactions,
      goals,
      liabilities,
      budgets,
      recurringTransactions,
      userCategories,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // CSV export for transactions only
      const headers = ['Date', 'Type', 'Amount', 'Category', 'Description'];
      const rows = transactions.map(t => [
        t.date.toISOString().split('T')[0],
        t.type,
        t.amount.toString(),
        t.category,
        t.description
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  };

  const importData = async (data: string, format: 'json' | 'csv'): Promise<void> => {
    // Implementation would depend on specific import requirements
    throw new Error('Import functionality not yet implemented');
  };

  const getFinancialForecast = async (): Promise<any> => {
    try {
      console.log('🔄 Generating financial forecast...');
      
      const financialData = {
        netWorth: stats.totalIncome - stats.totalExpenses - stats.totalLiabilities,
        monthlyIncome: stats.monthlyIncome,
        monthlyExpenses: stats.monthlyExpenses,
        totalSavings: stats.totalSavings,
        totalLiabilities: stats.totalLiabilities,
        savingsRate: stats.monthlyIncome > 0 ? ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome) * 100 : 0,
        debtToIncomeRatio: stats.monthlyIncome > 0 ? stats.totalLiabilities / (stats.monthlyIncome * 12) : 0,
        budgetUtilization: stats.budgetUtilization,
        goals,
        liabilities,
        monthlyTrends: getMonthlyTrends(6)
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-forecaster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ financialData }),
      });

      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }

      const forecast = await response.json();
      console.log('✅ Financial forecast generated:', forecast);
      
      return forecast;
    } catch (error: any) {
      console.error('❌ Error generating financial forecast:', error);
      throw error;
    }
  };

  const refreshInsights = async (): Promise<void> => {
    try {
      console.log('🔄 Refreshing financial insights...');
      
      const financialData = {
        monthlyIncome: stats.monthlyIncome,
        monthlyExpenses: stats.monthlyExpenses,
        totalSavings: stats.totalSavings,
        totalLiabilities: stats.totalLiabilities,
        savingsRate: stats.monthlyIncome > 0 ? ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome) * 100 : 0,
        budgetUtilization: stats.budgetUtilization,
        netWorth: stats.totalIncome - stats.totalExpenses - stats.totalLiabilities,
        expenseBreakdown: getCategoryBreakdown('expense', 3),
        incomeBreakdown: getCategoryBreakdown('income', 3),
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ financialData }),
      });

      if (!response.ok) {
        throw new Error(`Insights API error: ${response.status}`);
      }

      const newInsights = await response.json();
      console.log('✅ Financial insights refreshed:', newInsights);
      
      setInsights(newInsights);
    } catch (error: any) {
      console.error('❌ Error refreshing insights:', error);
      throw error;
    }
  };

  const value = {
    // Data
    transactions,
    goals,
    liabilities,
    budgets,
    recurringTransactions,
    userCategories,
    stats,
    loading,
    insights,
    
    // CRUD Operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addSplitTransaction,
    
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
    
    addUserCategory,
    updateUserCategory,
    deleteUserCategory,
    
    // Utility functions
    searchTransactions,
    getMonthlyTrends,
    getCategoryBreakdown,
    getNetWorthTrends,
    getSplitTransactions,
    getTransactionsPaginated,
    calculateDebtRepaymentStrategy,
    exportData,
    importData,
    getFinancialForecast,
    refreshInsights,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};