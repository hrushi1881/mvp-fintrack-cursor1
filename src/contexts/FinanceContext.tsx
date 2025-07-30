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
import { toNumber, safeDivide, calculatePercentage, sanitizeFinancialData } from '../utils/validation';

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
  
  // Transaction operations
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addSplitTransaction: (mainTransaction: Omit<Transaction, 'id' | 'userId'>, splits: SplitTransaction[]) => Promise<void>;
  getSplitTransactions: (parentId: string) => Transaction[];
  searchTransactions: (query: string, filters?: any) => Promise<Transaction[]>;
  getTransactionsPaginated: (page: number, pageSize: number, filters?: any) => Promise<{ data: Transaction[]; count: number }>;
  
  // Goal operations
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Liability operations
  addLiability: (liability: Omit<Liability, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateLiability: (id: string, updates: Partial<Liability>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
  
  // Budget operations
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'spent'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  // Recurring transaction operations
  addRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  
  // Category operations
  addUserCategory: (category: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUserCategory: (id: string, updates: Partial<UserCategory>) => Promise<void>;
  deleteUserCategory: (id: string) => Promise<void>;
  
  // Analytics
  getMonthlyTrends: (months: number) => any[];
  getCategoryBreakdown: (type: 'income' | 'expense', months: number) => any[];
  getNetWorthTrends: (months: number) => any[];
  calculateDebtRepaymentStrategy: (strategy: 'snowball' | 'avalanche', extraPayment: number) => DebtRepaymentStrategy;
  
  // AI and insights
  getFinancialForecast: () => Promise<any>;
  insights: any[];
  refreshInsights: () => Promise<void>;
  
  // Data management
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
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Default categories
  const defaultCategories: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
    // Income categories
    { name: 'Salary', type: 'income', icon: '💼', color: '#10B981' },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#3B82F6' },
    { name: 'Investment', type: 'income', icon: '📈', color: '#8B5CF6' },
    { name: 'Business', type: 'income', icon: '🏢', color: '#F59E0B' },
    { name: 'Gift', type: 'income', icon: '🎁', color: '#EC4899' },
    { name: 'Other', type: 'income', icon: '💰', color: '#6B7280' },
    
    // Expense categories
    { name: 'Food', type: 'expense', icon: '🍔', color: '#EF4444' },
    { name: 'Transportation', type: 'expense', icon: '🚗', color: '#F97316' },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8B5CF6' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#EC4899' },
    { name: 'Bills', type: 'expense', icon: '📄', color: '#6B7280' },
    { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#10B981' },
    { name: 'Housing', type: 'expense', icon: '🏠', color: '#3B82F6' },
    { name: 'Savings', type: 'expense', icon: '🏦', color: '#059669' },
    { name: 'Debt Payment', type: 'expense', icon: '💳', color: '#DC2626' },
    { name: 'Internal Transfer', type: 'expense', icon: '🔄', color: '#6366F1' },
    { name: 'Other', type: 'expense', icon: '📊', color: '#6B7280' },
  ];

  // Load data when user changes
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

  // Initialize default categories for new users
  useEffect(() => {
    if (user && userCategories.length === 0) {
      initializeDefaultCategories();
    }
  }, [user, userCategories]);

  const loadAllData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const startTime = Date.now();
      
      // Load data in parallel for better performance
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
        loadUserCategories(),
      ]);

      // Log any failed operations
      [transactionsResult, goalsResult, liabilitiesResult, budgetsResult, recurringResult, categoriesResult]
        .forEach((result, index) => {
          if (result.status === 'rejected') {
            const operations = ['transactions', 'goals', 'liabilities', 'budgets', 'recurring', 'categories'];
            console.error(`Failed to load ${operations[index]}:`, result.reason);
          }
        });

      logQueryPerformance('load-all-data', startTime);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load some data. Please refresh the page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultCategories = async () => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      
      // Check if categories already exist
      const { data: existingCategories, error: checkError } = await supabase
        .from('user_categories')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (checkError) throw checkError;
      
      // Only initialize if no categories exist
      if (!existingCategories || existingCategories.length === 0) {
        const { data, error } = await supabase
          .from('user_categories')
          .insert(
            defaultCategories.map(cat => ({
              ...cat,
              user_id: user.id,
            }))
          )
          .select();

        if (error) throw error;

        if (data) {
          const formattedCategories = data.map(formatUserCategory);
          setUserCategories(formattedCategories);
          logQueryPerformance('initialize-categories', startTime);
        }
      }
    } catch (error) {
      console.error('Error initializing default categories:', error);
      // Set categories locally if DB fails
      const localCategories = defaultCategories.map((cat, index) => ({
        id: `local-${index}`,
        ...cat,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      setUserCategories(localCategories);
    }
  };

  // Optimized data loading functions with specific column selection
  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('transactions')
        .select('id, type, amount, category, description, date, recurring_transaction_id, parent_transaction_id')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(100); // Initial load limit

      if (error) throw error;

      const formattedTransactions = (data || []).map(formatTransaction);
      setTransactions(formattedTransactions);
      logQueryPerformance('load-transactions', startTime);
    } catch (error) {
      console.error('Error loading transactions:', error);
      throw error;
    }
  };

  const loadGoals = async () => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('goals')
        .select('id, title, description, target_amount, current_amount, target_date, category, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedGoals = (data || []).map(formatGoal);
      setGoals(formattedGoals);
      logQueryPerformance('load-goals', startTime);
    } catch (error) {
      console.error('Error loading goals:', error);
      throw error;
    }
  };

  const loadLiabilities = async () => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('liabilities')
        .select('id, name, type, total_amount, remaining_amount, interest_rate, monthly_payment, due_date, start_date, linked_purchase_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedLiabilities = (data || []).map(formatLiability);
      setLiabilities(formattedLiabilities);
      logQueryPerformance('load-liabilities', startTime);
    } catch (error) {
      console.error('Error loading liabilities:', error);
      throw error;
    }
  };

  const loadBudgets = async () => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('budgets')
        .select('id, category, amount, spent, period, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBudgets = (data || []).map(formatBudget);
      setBudgets(formattedBudgets);
      logQueryPerformance('load-budgets', startTime);
    } catch (error) {
      console.error('Error loading budgets:', error);
      throw error;
    }
  };

  const loadRecurringTransactions = async () => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('id, type, amount, category, description, frequency, start_date, end_date, next_occurrence_date, last_processed_date, is_active, day_of_week, day_of_month, month_of_year, max_occurrences, current_occurrences, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRecurring = (data || []).map(formatRecurringTransaction);
      setRecurringTransactions(formattedRecurring);
      logQueryPerformance('load-recurring-transactions', startTime);
    } catch (error) {
      console.error('Error loading recurring transactions:', error);
      throw error;
    }
  };

  const loadUserCategories = async () => {
    if (!user) return;
    
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('user_categories')
        .select('id, name, type, icon, color, created_at, updated_at')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedCategories = data.map(formatUserCategory);
        setUserCategories(formattedCategories);
        logQueryPerformance('load-user-categories', startTime);
      }
    } catch (error) {
      console.error('Error loading user categories:', error);
      throw error;
    }
  };

  // Format functions with better error handling
  const formatTransaction = (data: any): Transaction => ({
    id: data.id,
    type: data.type,
    amount: toNumber(data.amount),
    category: data.category || 'Other',
    description: data.description || '',
    date: new Date(data.date),
    userId: data.user_id,
    recurringTransactionId: data.recurring_transaction_id,
    parentTransactionId: data.parent_transaction_id,
  });

  const formatGoal = (data: any): Goal => ({
    id: data.id,
    title: data.title || '',
    description: data.description || '',
    targetAmount: toNumber(data.target_amount),
    currentAmount: toNumber(data.current_amount),
    targetDate: new Date(data.target_date),
    category: data.category || 'Other',
    userId: data.user_id,
    createdAt: new Date(data.created_at),
  });

  const formatLiability = (data: any): Liability => ({
    id: data.id,
    name: data.name || '',
    type: data.type || 'other',
    totalAmount: toNumber(data.total_amount),
    remainingAmount: toNumber(data.remaining_amount),
    interestRate: toNumber(data.interest_rate),
    monthlyPayment: toNumber(data.monthly_payment),
    due_date: new Date(data.due_date),
    userId: data.user_id,
    createdAt: new Date(data.created_at),
    start_date: new Date(data.start_date),
    linkedPurchaseId: data.linked_purchase_id,
  });

  const formatBudget = (data: any): Budget => ({
    id: data.id,
    category: data.category || '',
    amount: toNumber(data.amount),
    spent: toNumber(data.spent),
    period: data.period || 'monthly',
    userId: data.user_id,
    createdAt: new Date(data.created_at),
  });

  const formatRecurringTransaction = (data: any): RecurringTransaction => ({
    id: data.id,
    type: data.type,
    amount: toNumber(data.amount),
    category: data.category || '',
    description: data.description || '',
    frequency: data.frequency,
    startDate: new Date(data.start_date),
    endDate: data.end_date ? new Date(data.end_date) : undefined,
    nextOccurrenceDate: new Date(data.next_occurrence_date),
    lastProcessedDate: data.last_processed_date ? new Date(data.last_processed_date) : undefined,
    isActive: data.is_active,
    userId: data.user_id,
    createdAt: new Date(data.created_at),
    dayOfWeek: data.day_of_week,
    dayOfMonth: data.day_of_month,
    monthOfYear: data.month_of_year,
    maxOccurrences: data.max_occurrences,
    currentOccurrences: toNumber(data.current_occurrences),
  });

  const formatUserCategory = (data: any): UserCategory => ({
    id: data.id,
    name: data.name || '',
    type: data.type,
    icon: data.icon,
    color: data.color,
    userId: data.user_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  });

  // Enhanced transaction operations with better error handling
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      const sanitizedTransaction = sanitizeFinancialData(transaction, ['amount']);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: sanitizedTransaction.type,
          amount: toNumber(sanitizedTransaction.amount),
          category: sanitizedTransaction.category,
          description: sanitizedTransaction.description,
          date: sanitizedTransaction.date.toISOString().split('T')[0],
          recurring_transaction_id: sanitizedTransaction.recurringTransactionId,
          parent_transaction_id: sanitizedTransaction.parentTransactionId,
        }])
        .select('id, type, amount, category, description, date, recurring_transaction_id, parent_transaction_id')
        .single();

      if (error) {
        console.error('Supabase error adding transaction:', error);
        throw new Error(`Failed to add transaction: ${error.message}`);
      }

      const newTransaction = formatTransaction({ ...data, user_id: user.id });
      setTransactions(prev => [newTransaction, ...prev]);

      // Update budget spent amount if it's an expense
      if (newTransaction.type === 'expense') {
        await updateBudgetSpent(newTransaction.category, toNumber(newTransaction.amount));
      }

      logQueryPerformance('add-transaction', startTime);
      showToast('Transaction added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      showToast(error.message || 'Failed to add transaction', 'error');
      throw error;
    }
  };

  // Enhanced goal operations with better error handling
  const addGoal = async (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      const sanitizedGoal = sanitizeFinancialData(goal, ['targetAmount', 'currentAmount']);
      
      const { data, error } = await supabase
        .from('goals')
        .insert([{
          user_id: user.id,
          title: sanitizedGoal.title,
          description: sanitizedGoal.description,
          target_amount: toNumber(sanitizedGoal.targetAmount),
          current_amount: toNumber(sanitizedGoal.currentAmount),
          target_date: sanitizedGoal.targetDate.toISOString().split('T')[0],
          category: sanitizedGoal.category,
        }])
        .select('id, title, description, target_amount, current_amount, target_date, category, created_at')
        .single();

      if (error) {
        console.error('Supabase error adding goal:', error);
        throw new Error(`Failed to add goal: ${error.message}`);
      }

      const newGoal = formatGoal({ ...data, user_id: user.id });
      setGoals(prev => [newGoal, ...prev]);

      logQueryPerformance('add-goal', startTime);
      showToast('Goal created successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding goal:', error);
      showToast(error.message || 'Failed to create goal', 'error');
      throw error;
    }
  };

  // Enhanced recurring transaction operations
  const addRecurringTransaction = async (transaction: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      const sanitizedTransaction = sanitizeFinancialData(transaction, ['amount', 'currentOccurrences']);
      
      const insertData = {
        user_id: user.id,
        type: sanitizedTransaction.type,
        amount: toNumber(sanitizedTransaction.amount),
        category: sanitizedTransaction.category,
        description: sanitizedTransaction.description,
        frequency: sanitizedTransaction.frequency,
        start_date: sanitizedTransaction.startDate.toISOString().split('T')[0],
        end_date: sanitizedTransaction.endDate?.toISOString().split('T')[0] || null,
        next_occurrence_date: sanitizedTransaction.nextOccurrenceDate.toISOString().split('T')[0],
        last_processed_date: sanitizedTransaction.lastProcessedDate?.toISOString().split('T')[0] || null,
        is_active: sanitizedTransaction.isActive,
        day_of_week: sanitizedTransaction.dayOfWeek || null,
        day_of_month: sanitizedTransaction.dayOfMonth || null,
        month_of_year: sanitizedTransaction.monthOfYear || null,
        max_occurrences: sanitizedTransaction.maxOccurrences || null,
        current_occurrences: toNumber(sanitizedTransaction.currentOccurrences),
      };

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([insertData])
        .select('id, type, amount, category, description, frequency, start_date, end_date, next_occurrence_date, last_processed_date, is_active, day_of_week, day_of_month, month_of_year, max_occurrences, current_occurrences, created_at')
        .single();

      if (error) {
        console.error('Supabase error adding recurring transaction:', error);
        throw new Error(`Failed to add recurring transaction: ${error.message}`);
      }

      const newRecurringTransaction = formatRecurringTransaction({ ...data, user_id: user.id });
      setRecurringTransactions(prev => [newRecurringTransaction, ...prev]);

      logQueryPerformance('add-recurring-transaction', startTime);
      showToast('Recurring transaction created successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding recurring transaction:', error);
      showToast(error.message || 'Failed to create recurring transaction', 'error');
      throw error;
    }
  };

  // Enhanced user category operations
  const addUserCategory = async (category: Omit<UserCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('user_categories')
        .insert([{
          user_id: user.id,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
        }])
        .select('id, name, type, icon, color, created_at, updated_at')
        .single();

      if (error) {
        console.error('Supabase error adding user category:', error);
        throw new Error(`Failed to add category: ${error.message}`);
      }

      const newCategory = formatUserCategory({ ...data, user_id: user.id });
      setUserCategories(prev => [...prev, newCategory]);

      logQueryPerformance('add-user-category', startTime);
      showToast('Category added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding user category:', error);
      showToast(error.message || 'Failed to add category', 'error');
      throw error;
    }
  };

  const deleteUserCategory = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      
      const { error } = await supabase
        .from('user_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error deleting user category:', error);
        throw new Error(`Failed to delete category: ${error.message}`);
      }

      setUserCategories(prev => prev.filter(c => c.id !== id));

      logQueryPerformance('delete-user-category', startTime);
      showToast('Category deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting user category:', error);
      showToast(error.message || 'Failed to delete category', 'error');
      throw error;
    }
  };

  // Server-side search with pagination
  const searchTransactions = async (query: string, filters?: any): Promise<Transaction[]> => {
    if (!user) throw new Error('User not authenticated');
    if (!query.trim() && !filters) return transactions;
    
    try {
      const startTime = Date.now();
      let queryBuilder = supabase
        .from('transactions')
        .select('id, type, amount, category, description, date, recurring_transaction_id, parent_transaction_id')
        .eq('user_id', user.id);

      // Add text search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`description.ilike.%${query}%,category.ilike.%${query}%`);
      }

      // Add filters
      if (filters?.type && filters.type !== 'all') {
        queryBuilder = queryBuilder.eq('type', filters.type);
      }
      
      if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category);
      }
      
      if (filters?.dateRange?.start) {
        queryBuilder = queryBuilder.gte('date', filters.dateRange.start);
      }
      
      if (filters?.dateRange?.end) {
        queryBuilder = queryBuilder.lte('date', filters.dateRange.end);
      }
      
      if (filters?.amountRange?.min) {
        queryBuilder = queryBuilder.gte('amount', filters.amountRange.min);
      }
      
      if (filters?.amountRange?.max) {
        queryBuilder = queryBuilder.lte('amount', filters.amountRange.max);
      }

      const { data, error } = await queryBuilder
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;

      const results = (data || []).map(formatTransaction);
      logQueryPerformance('search-transactions', startTime);
      return results;
    } catch (error) {
      console.error('Error searching transactions:', error);
      throw error;
    }
  };

  // Paginated transactions
  const getTransactionsPaginated = async (
    page: number, 
    pageSize: number, 
    filters?: any
  ): Promise<{ data: Transaction[]; count: number }> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const startTime = Date.now();
      let queryBuilder = supabase
        .from('transactions')
        .select('id, type, amount, category, description, date, recurring_transaction_id, parent_transaction_id', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply filters
      if (filters?.type && filters.type !== 'all') {
        queryBuilder = queryBuilder.eq('type', filters.type);
      }
      
      if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category);
      }

      const { data, error, count } = await queryBuilder
        .order('date', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      const formattedData = (data || []).map(formatTransaction);
      logQueryPerformance('get-transactions-paginated', startTime);
      
      return { data: formattedData, count: count || 0 };
    } catch (error) {
      console.error('Error getting paginated transactions:', error);
      throw error;
    }
  };

  // Enhanced update operations with optimistic updates
  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      const sanitizedUpdates = sanitizeFinancialData(updates, ['targetAmount', 'currentAmount']);
      
      const updateData: any = {};
      if (sanitizedUpdates.title) updateData.title = sanitizedUpdates.title;
      if (sanitizedUpdates.description) updateData.description = sanitizedUpdates.description;
      if (sanitizedUpdates.targetAmount !== undefined) updateData.target_amount = toNumber(sanitizedUpdates.targetAmount);
      if (sanitizedUpdates.currentAmount !== undefined) updateData.current_amount = toNumber(sanitizedUpdates.currentAmount);
      if (sanitizedUpdates.targetDate) updateData.target_date = sanitizedUpdates.targetDate.toISOString().split('T')[0];
      if (sanitizedUpdates.category) updateData.category = sanitizedUpdates.category;

      const { data, error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, title, description, target_amount, current_amount, target_date, category, created_at')
        .single();

      if (error) {
        console.error('Supabase error updating goal:', error);
        throw new Error(`Failed to update goal: ${error.message}`);
      }

      const updatedGoal = formatGoal({ ...data, user_id: user.id });
      setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));

      logQueryPerformance('update-goal', startTime);
      showToast('Goal updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating goal:', error);
      showToast(error.message || 'Failed to update goal', 'error');
      throw error;
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error deleting goal:', error);
        throw new Error(`Failed to delete goal: ${error.message}`);
      }

      setGoals(prev => prev.filter(g => g.id !== id));

      logQueryPerformance('delete-goal', startTime);
      showToast('Goal deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      showToast(error.message || 'Failed to delete goal', 'error');
      throw error;
    }
  };

  // Enhanced budget operations
  const addBudget = async (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'spent'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      const sanitizedBudget = sanitizeFinancialData(budget, ['amount']);
      
      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          user_id: user.id,
          category: sanitizedBudget.category,
          amount: toNumber(sanitizedBudget.amount),
          spent: 0,
          period: sanitizedBudget.period,
        }])
        .select('id, category, amount, spent, period, created_at')
        .single();

      if (error) {
        console.error('Supabase error adding budget:', error);
        throw new Error(`Failed to add budget: ${error.message}`);
      }

      const newBudget = formatBudget({ ...data, user_id: user.id });
      setBudgets(prev => [newBudget, ...prev]);

      logQueryPerformance('add-budget', startTime);
      showToast('Budget created successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding budget:', error);
      showToast(error.message || 'Failed to create budget', 'error');
      throw error;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      const sanitizedUpdates = sanitizeFinancialData(updates, ['amount', 'spent']);
      
      const updateData: any = {};
      if (sanitizedUpdates.category) updateData.category = sanitizedUpdates.category;
      if (sanitizedUpdates.amount !== undefined) updateData.amount = toNumber(sanitizedUpdates.amount);
      if (sanitizedUpdates.spent !== undefined) updateData.spent = toNumber(sanitizedUpdates.spent);
      if (sanitizedUpdates.period) updateData.period = sanitizedUpdates.period;

      const { data, error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, category, amount, spent, period, created_at')
        .single();

      if (error) {
        console.error('Supabase error updating budget:', error);
        throw new Error(`Failed to update budget: ${error.message}`);
      }

      const updatedBudget = formatBudget({ ...data, user_id: user.id });
      setBudgets(prev => prev.map(b => b.id === id ? updatedBudget : b));

      logQueryPerformance('update-budget', startTime);
    } catch (error: any) {
      console.error('Error updating budget:', error);
      showToast(error.message || 'Failed to update budget', 'error');
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error deleting budget:', error);
        throw new Error(`Failed to delete budget: ${error.message}`);
      }

      setBudgets(prev => prev.filter(b => b.id !== id));

      logQueryPerformance('delete-budget', startTime);
      showToast('Budget deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      showToast(error.message || 'Failed to delete budget', 'error');
      throw error;
    }
  };

  // Enhanced liability operations
  const addLiability = async (liability: Omit<Liability, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      const sanitizedLiability = sanitizeFinancialData(liability, [
        'totalAmount', 
        'remainingAmount', 
        'interestRate', 
        'monthlyPayment'
      ]);
      
      const { data, error } = await supabase
        .from('liabilities')
        .insert([{
          user_id: user.id,
          name: sanitizedLiability.name,
          type: sanitizedLiability.type,
          total_amount: toNumber(sanitizedLiability.totalAmount),
          remaining_amount: toNumber(sanitizedLiability.remainingAmount),
          interest_rate: toNumber(sanitizedLiability.interestRate),
          monthly_payment: toNumber(sanitizedLiability.monthlyPayment),
          due_date: sanitizedLiability.due_date.toISOString().split('T')[0],
          start_date: sanitizedLiability.start_date.toISOString().split('T')[0],
          linked_purchase_id: sanitizedLiability.linkedPurchaseId,
        }])
        .select('id, name, type, total_amount, remaining_amount, interest_rate, monthly_payment, due_date, start_date, linked_purchase_id, created_at')
        .single();

      if (error) {
        console.error('Supabase error adding liability:', error);
        throw new Error(`Failed to add liability: ${error.message}`);
      }

      const newLiability = formatLiability({ ...data, user_id: user.id });
      setLiabilities(prev => [newLiability, ...prev]);

      logQueryPerformance('add-liability', startTime);
      showToast('Liability added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding liability:', error);
      showToast(error.message || 'Failed to add liability', 'error');
      throw error;
    }
  };

  const updateLiability = async (id: string, updates: Partial<Liability>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      const sanitizedUpdates = sanitizeFinancialData(updates, [
        'totalAmount', 
        'remainingAmount', 
        'interestRate', 
        'monthlyPayment'
      ]);
      
      const updateData: any = {};
      if (sanitizedUpdates.name) updateData.name = sanitizedUpdates.name;
      if (sanitizedUpdates.type) updateData.type = sanitizedUpdates.type;
      if (sanitizedUpdates.totalAmount !== undefined) updateData.total_amount = toNumber(sanitizedUpdates.totalAmount);
      if (sanitizedUpdates.remainingAmount !== undefined) updateData.remaining_amount = toNumber(sanitizedUpdates.remainingAmount);
      if (sanitizedUpdates.interestRate !== undefined) updateData.interest_rate = toNumber(sanitizedUpdates.interestRate);
      if (sanitizedUpdates.monthlyPayment !== undefined) updateData.monthly_payment = toNumber(sanitizedUpdates.monthlyPayment);
      if (sanitizedUpdates.due_date) updateData.due_date = sanitizedUpdates.due_date.toISOString().split('T')[0];
      if (sanitizedUpdates.start_date) updateData.start_date = sanitizedUpdates.start_date.toISOString().split('T')[0];
      if (sanitizedUpdates.linkedPurchaseId !== undefined) updateData.linked_purchase_id = sanitizedUpdates.linkedPurchaseId;

      const { data, error } = await supabase
        .from('liabilities')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, name, type, total_amount, remaining_amount, interest_rate, monthly_payment, due_date, start_date, linked_purchase_id, created_at')
        .single();

      if (error) {
        console.error('Supabase error updating liability:', error);
        throw new Error(`Failed to update liability: ${error.message}`);
      }

      const updatedLiability = formatLiability({ ...data, user_id: user.id });
      setLiabilities(prev => prev.map(l => l.id === id ? updatedLiability : l));

      logQueryPerformance('update-liability', startTime);
      showToast('Liability updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating liability:', error);
      showToast(error.message || 'Failed to update liability', 'error');
      throw error;
    }
  };

  const deleteLiability = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      
      const { error } = await supabase
        .from('liabilities')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error deleting liability:', error);
        throw new Error(`Failed to delete liability: ${error.message}`);
      }

      setLiabilities(prev => prev.filter(l => l.id !== id));

      logQueryPerformance('delete-liability', startTime);
      showToast('Liability deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting liability:', error);
      showToast(error.message || 'Failed to delete liability', 'error');
      throw error;
    }
  };

  // Enhanced recurring transaction operations
  const updateRecurringTransaction = async (id: string, updates: Partial<RecurringTransaction>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      const sanitizedUpdates = sanitizeFinancialData(updates, ['amount', 'currentOccurrences']);
      
      const updateData: any = {};
      if (sanitizedUpdates.type) updateData.type = sanitizedUpdates.type;
      if (sanitizedUpdates.amount !== undefined) updateData.amount = toNumber(sanitizedUpdates.amount);
      if (sanitizedUpdates.category) updateData.category = sanitizedUpdates.category;
      if (sanitizedUpdates.description) updateData.description = sanitizedUpdates.description;
      if (sanitizedUpdates.frequency) updateData.frequency = sanitizedUpdates.frequency;
      if (sanitizedUpdates.startDate) updateData.start_date = sanitizedUpdates.startDate.toISOString().split('T')[0];
      if (sanitizedUpdates.endDate !== undefined) updateData.end_date = sanitizedUpdates.endDate?.toISOString().split('T')[0];
      if (sanitizedUpdates.nextOccurrenceDate) updateData.next_occurrence_date = sanitizedUpdates.nextOccurrenceDate.toISOString().split('T')[0];
      if (sanitizedUpdates.lastProcessedDate !== undefined) updateData.last_processed_date = sanitizedUpdates.lastProcessedDate?.toISOString().split('T')[0];
      if (sanitizedUpdates.isActive !== undefined) updateData.is_active = sanitizedUpdates.isActive;
      if (sanitizedUpdates.dayOfWeek !== undefined) updateData.day_of_week = sanitizedUpdates.dayOfWeek;
      if (sanitizedUpdates.dayOfMonth !== undefined) updateData.day_of_month = sanitizedUpdates.dayOfMonth;
      if (sanitizedUpdates.monthOfYear !== undefined) updateData.month_of_year = sanitizedUpdates.monthOfYear;
      if (sanitizedUpdates.maxOccurrences !== undefined) updateData.max_occurrences = sanitizedUpdates.maxOccurrences;
      if (sanitizedUpdates.currentOccurrences !== undefined) updateData.current_occurrences = toNumber(sanitizedUpdates.currentOccurrences);

      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, type, amount, category, description, frequency, start_date, end_date, next_occurrence_date, last_processed_date, is_active, day_of_week, day_of_month, month_of_year, max_occurrences, current_occurrences, created_at')
        .single();

      if (error) {
        console.error('Supabase error updating recurring transaction:', error);
        throw new Error(`Failed to update recurring transaction: ${error.message}`);
      }

      const updatedRecurringTransaction = formatRecurringTransaction({ ...data, user_id: user.id });
      setRecurringTransactions(prev => prev.map(rt => rt.id === id ? updatedRecurringTransaction : rt));

      logQueryPerformance('update-recurring-transaction', startTime);
      showToast('Recurring transaction updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating recurring transaction:', error);
      showToast(error.message || 'Failed to update recurring transaction', 'error');
      throw error;
    }
  };

  const deleteRecurringTransaction = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error deleting recurring transaction:', error);
        throw new Error(`Failed to delete recurring transaction: ${error.message}`);
      }

      setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));

      logQueryPerformance('delete-recurring-transaction', startTime);
      showToast('Recurring transaction deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting recurring transaction:', error);
      showToast(error.message || 'Failed to delete recurring transaction', 'error');
      throw error;
    }
  };

  const updateUserCategory = async (id: string, updates: Partial<UserCategory>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.type) updateData.type = updates.type;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.color !== undefined) updateData.color = updates.color;

      const { data, error } = await supabase
        .from('user_categories')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, name, type, icon, color, created_at, updated_at')
        .single();

      if (error) {
        console.error('Supabase error updating user category:', error);
        throw new Error(`Failed to update category: ${error.message}`);
      }

      const updatedCategory = formatUserCategory({ ...data, user_id: user.id });
      setUserCategories(prev => prev.map(c => c.id === id ? updatedCategory : c));

      logQueryPerformance('update-user-category', startTime);
      showToast('Category updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating user category:', error);
      showToast(error.message || 'Failed to update category', 'error');
      throw error;
    }
  };

  // Helper function to update budget spent amount with better error handling
  const updateBudgetSpent = async (category: string, amount: number) => {
    const budget = budgets.find(b => b.category === category);
    if (!budget) {
      console.warn(`Budget category "${category}" not found. Skipping budget update.`);
      return;
    }
    
    try {
      const newSpent = toNumber(budget.spent) + toNumber(amount);
      await updateBudget(budget.id, { spent: newSpent });
    } catch (error) {
      console.error('Error updating budget spent amount:', error);
      // Don't throw here as this is a secondary operation
    }
  };

  // Split transaction operations
  const addSplitTransaction = async (mainTransaction: Omit<Transaction, 'id' | 'userId'>, splits: SplitTransaction[]) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      
      // First, add the main transaction
      const mainTransactionData = {
        user_id: user.id,
        type: mainTransaction.type,
        amount: toNumber(mainTransaction.amount),
        category: 'Split Transaction',
        description: mainTransaction.description,
        date: mainTransaction.date.toISOString().split('T')[0],
      };

      const { data: mainData, error: mainError } = await supabase
        .from('transactions')
        .insert([mainTransactionData])
        .select('id, type, amount, category, description, date')
        .single();

      if (mainError) throw mainError;

      // Then add the split transactions
      const splitTransactionData = splits.map(split => ({
        user_id: user.id,
        type: mainTransaction.type,
        amount: toNumber(split.amount),
        category: split.category,
        description: split.description || mainTransaction.description,
        date: mainTransaction.date.toISOString().split('T')[0],
        parent_transaction_id: mainData.id,
      }));

      const { data: splitData, error: splitError } = await supabase
        .from('transactions')
        .insert(splitTransactionData)
        .select('id, type, amount, category, description, date, parent_transaction_id');

      if (splitError) throw splitError;

      // Update local state
      const newMainTransaction = formatTransaction({ ...mainData, user_id: user.id });
      const newSplitTransactions = (splitData || []).map(data => formatTransaction({ ...data, user_id: user.id }));
      
      setTransactions(prev => [newMainTransaction, ...newSplitTransactions, ...prev]);

      // Update budgets for each split category
      if (mainTransaction.type === 'expense') {
        for (const split of splits) {
          await updateBudgetSpent(split.category, toNumber(split.amount));
        }
      }

      logQueryPerformance('add-split-transaction', startTime);
      showToast('Split transaction added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding split transaction:', error);
      showToast(error.message || 'Failed to add split transaction', 'error');
      throw error;
    }
  };

  const getSplitTransactions = (parentId: string): Transaction[] => {
    return transactions.filter(t => t.parentTransactionId === parentId);
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      const sanitizedUpdates = sanitizeFinancialData(updates, ['amount']);
      
      const updateData: any = {};
      if (sanitizedUpdates.type) updateData.type = sanitizedUpdates.type;
      if (sanitizedUpdates.amount !== undefined) updateData.amount = toNumber(sanitizedUpdates.amount);
      if (sanitizedUpdates.category) updateData.category = sanitizedUpdates.category;
      if (sanitizedUpdates.description) updateData.description = sanitizedUpdates.description;
      if (sanitizedUpdates.date) updateData.date = sanitizedUpdates.date.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, type, amount, category, description, date, recurring_transaction_id, parent_transaction_id')
        .single();

      if (error) {
        console.error('Supabase error updating transaction:', error);
        throw new Error(`Failed to update transaction: ${error.message}`);
      }

      const updatedTransaction = formatTransaction({ ...data, user_id: user.id });
      setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));

      logQueryPerformance('update-transaction', startTime);
      showToast('Transaction updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      showToast(error.message || 'Failed to update transaction', 'error');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const startTime = Date.now();
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error deleting transaction:', error);
        throw new Error(`Failed to delete transaction: ${error.message}`);
      }

      setTransactions(prev => prev.filter(t => t.id !== id));

      logQueryPerformance('delete-transaction', startTime);
      showToast('Transaction deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      showToast(error.message || 'Failed to delete transaction', 'error');
      throw error;
    }
  };

  // Analytics functions (keeping existing implementation)
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
        .reduce((sum, t) => sum + toNumber(t.amount), 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + toNumber(t.amount), 0);
      
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
    
    const filteredTransactions = transactions.filter(t => 
      t.type === type && t.date >= cutoffDate
    );
    
    const categoryTotals = filteredTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + toNumber(t.amount);
      return acc;
    }, {} as Record<string, number>);
    
    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? calculatePercentage(amount, total) : 0
    }));
  };

  const getNetWorthTrends = (months: number) => {
    const trends = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      // Calculate cumulative values up to this month
      const transactionsUpToDate = transactions.filter(t => t.date <= date);
      const goalsUpToDate = goals.filter(g => g.createdAt <= date);
      const liabilitiesUpToDate = liabilities.filter(l => l.createdAt <= date);
      
      const liquidAssets = transactionsUpToDate
        .reduce((sum, t) => sum + (t.type === 'income' ? toNumber(t.amount) : -toNumber(t.amount)), 0);
      
      const goalSavings = goalsUpToDate
        .reduce((sum, g) => sum + toNumber(g.currentAmount), 0);
      
      const totalLiabilities = liabilitiesUpToDate
        .reduce((sum, l) => sum + toNumber(l.remainingAmount), 0);
      
      const netWorth = liquidAssets + goalSavings - totalLiabilities;
      
      trends.push({
        month: date.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
        netWorth,
        liquidAssets,
        goalSavings,
        totalLiabilities
      });
    }
    
    return trends;
  };

  // Enhanced debt repayment strategy with dynamic redistribution
  const calculateDebtRepaymentStrategy = (strategy: 'snowball' | 'avalanche', extraPayment: number): DebtRepaymentStrategy => {
    const activeDebts = liabilities.filter(l => toNumber(l.remainingAmount) > 0);
    
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
        return toNumber(b.interestRate) - toNumber(a.interestRate);
      } else {
        return toNumber(a.remainingAmount) - toNumber(b.remainingAmount);
      }
    });

    // Enhanced calculation with dynamic extra payment redistribution
    const debtPlans = [];
    let remainingExtraPayment = toNumber(extraPayment);
    let currentDate = new Date();
    
    for (let i = 0; i < sortedDebts.length; i++) {
      const debt = sortedDebts[i];
      const remainingAmount = toNumber(debt.remainingAmount);
      const baseMonthlyPayment = toNumber(debt.monthlyPayment);
      const currentExtraPayment = i === 0 ? remainingExtraPayment : 0; // Apply extra to current priority debt
      const totalMonthlyPayment = baseMonthlyPayment + currentExtraPayment;
      const interestRate = toNumber(debt.interestRate) / 100 / 12;
      
      if (totalMonthlyPayment <= 0 || remainingAmount <= 0) {
        debtPlans.push({
          id: debt.id,
          name: debt.name,
          remainingAmount,
          interestRate: toNumber(debt.interestRate),
          monthlyPayment: totalMonthlyPayment,
          payoffDate: new Date(),
          totalInterest: 0,
          payments: []
        });
        continue;
      }

      let balance = remainingAmount;
      let totalInterest = 0;
      const payments = [];
      let monthDate = new Date(currentDate);

      while (balance > 0.01 && payments.length < 600) { // Cap at 50 years
        const interestPayment = balance * interestRate;
        const principalPayment = Math.min(totalMonthlyPayment - interestPayment, balance);
        
        if (principalPayment <= 0) break;
        
        balance -= principalPayment;
        totalInterest += interestPayment;
        
        payments.push({
          date: new Date(monthDate),
          payment: totalMonthlyPayment,
          principal: principalPayment,
          interest: interestPayment,
          remainingBalance: balance
        });
        
        monthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, monthDate.getDate());
      }

      debtPlans.push({
        id: debt.id,
        name: debt.name,
        remainingAmount,
        interestRate: toNumber(debt.interestRate),
        monthlyPayment: totalMonthlyPayment,
        payoffDate: payments.length > 0 ? payments[payments.length - 1].date : new Date(),
        totalInterest,
        payments
      });
      
      // When this debt is paid off, redistribute extra payment to next debt
      if (balance <= 0.01 && i < sortedDebts.length - 1) {
        remainingExtraPayment += baseMonthlyPayment; // Add this debt's payment to extra for next debt
      }
    }

    const totalMonths = Math.max(...debtPlans.map(plan => plan.payments.length));
    const totalInterestPaid = debtPlans.reduce((sum, plan) => sum + plan.totalInterest, 0);
    const totalPaid = debtPlans.reduce((sum, plan) => sum + plan.remainingAmount + plan.totalInterest, 0);
    const payoffDate = new Date(Math.max(...debtPlans.map(plan => plan.payoffDate.getTime())));

    return {
      totalMonths,
      totalInterestPaid,
      totalPaid,
      payoffDate,
      debtPlans
    };
  };

  // AI and insights functions
  const getFinancialForecast = async () => {
    try {
      const startTime = Date.now();
      const financialData = {
        monthlyIncome: stats.monthlyIncome,
        monthlyExpenses: stats.monthlyExpenses,
        totalSavings: stats.totalSavings,
        totalLiabilities: stats.totalLiabilities,
        netWorth: stats.totalIncome - stats.totalExpenses - stats.totalLiabilities,
        savingsRate: stats.monthlyIncome > 0 ? ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome) * 100 : 0,
        debtToIncomeRatio: stats.monthlyIncome > 0 ? stats.totalLiabilities / (stats.monthlyIncome * 12) : 0,
        budgetUtilization: stats.budgetUtilization,
        goals: goals.map(g => ({
          id: g.id,
          title: g.title,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          targetDate: g.targetDate.toISOString()
        })),
        liabilities: liabilities.map(l => ({
          id: l.id,
          name: l.name,
          remainingAmount: l.remainingAmount,
          interestRate: l.interestRate,
          monthlyPayment: l.monthlyPayment
        }))
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
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      logQueryPerformance('financial-forecast', startTime);
      return result;
    } catch (error) {
      console.error('Error fetching financial forecast:', error);
      throw error;
    }
  };

  const refreshInsights = async () => {
    try {
      const startTime = Date.now();
      const financialData = {
        monthlyIncome: stats.monthlyIncome,
        monthlyExpenses: stats.monthlyExpenses,
        totalSavings: stats.totalSavings,
        totalLiabilities: stats.totalLiabilities,
        netWorth: stats.totalIncome - stats.totalExpenses - stats.totalLiabilities,
        savingsRate: stats.monthlyIncome > 0 ? ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome) * 100 : 0,
        budgetUtilization: stats.budgetUtilization,
        topExpenseCategories: getCategoryBreakdown('expense', 3).slice(0, 5)
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
        throw new Error(`API error: ${response.status}`);
      }

      const newInsights = await response.json();
      setInsights(newInsights);
      logQueryPerformance('refresh-insights', startTime);
    } catch (error) {
      console.error('Error refreshing insights:', error);
      throw error;
    }
  };

  // Data management functions
  const exportData = async (format: 'json' | 'csv'): Promise<string> => {
    const data = {
      transactions,
      goals,
      liabilities,
      budgets,
      recurringTransactions,
      userCategories,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV export (transactions only for simplicity)
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
    try {
      if (format === 'json') {
        const parsedData = JSON.parse(data);
        
        // Import transactions
        if (parsedData.transactions) {
          for (const transaction of parsedData.transactions) {
            await addTransaction({
              type: transaction.type,
              amount: toNumber(transaction.amount),
              category: transaction.category,
              description: transaction.description,
              date: new Date(transaction.date)
            });
          }
        }
        
        // Import goals
        if (parsedData.goals) {
          for (const goal of parsedData.goals) {
            await addGoal({
              title: goal.title,
              description: goal.description,
              targetAmount: toNumber(goal.targetAmount),
              currentAmount: toNumber(goal.currentAmount),
              targetDate: new Date(goal.targetDate),
              category: goal.category
            });
          }
        }
      } else {
        // CSV import (transactions only)
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 5) {
            await addTransaction({
              type: values[1] as 'income' | 'expense',
              amount: toNumber(values[2]),
              category: values[3],
              description: values[4],
              date: new Date(values[0])
            });
          }
        }
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  };

  // Calculate dashboard stats
  const stats: DashboardStats = {
    totalIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + toNumber(t.amount), 0),
    totalExpenses: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + toNumber(t.amount), 0),
    totalSavings: goals.reduce((sum, g) => sum + toNumber(g.currentAmount), 0),
    totalLiabilities: liabilities.reduce((sum, l) => sum + toNumber(l.remainingAmount), 0),
    monthlyIncome: (() => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return transactions
        .filter(t => t.type === 'income' && t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear)
        .reduce((sum, t) => sum + toNumber(t.amount), 0);
    })(),
    monthlyExpenses: (() => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return transactions
        .filter(t => t.type === 'expense' && t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear)
        .reduce((sum, t) => sum + toNumber(t.amount), 0);
    })(),
    budgetUtilization: (() => {
      if (budgets.length === 0) return 0;
      const totalBudgeted = budgets.reduce((sum, b) => sum + toNumber(b.amount), 0);
      const totalSpent = budgets.reduce((sum, b) => sum + toNumber(b.spent), 0);
      return totalBudgeted > 0 ? calculatePercentage(totalSpent, totalBudgeted) : 0;
    })(),
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
    
    // Transaction operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addSplitTransaction,
    getSplitTransactions,
    searchTransactions,
    getTransactionsPaginated,
    
    // Goal operations
    addGoal,
    updateGoal,
    deleteGoal,
    
    // Liability operations
    addLiability,
    updateLiability,
    deleteLiability,
    
    // Budget operations
    addBudget,
    updateBudget,
    deleteBudget,
    
    // Recurring transaction operations
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    
    // Category operations
    addUserCategory,
    updateUserCategory,
    deleteUserCategory,
    
    // Analytics
    getMonthlyTrends,
    getCategoryBreakdown,
    getNetWorthTrends,
    calculateDebtRepaymentStrategy,
    
    // AI and insights
    getFinancialForecast,
    insights,
    refreshInsights,
    
    // Data management
    exportData,
    importData,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};