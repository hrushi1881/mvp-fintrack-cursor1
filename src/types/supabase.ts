export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string
          date: string
          created_at: string
          updated_at: string
          recurring_transaction_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string
          date: string
          created_at?: string
          updated_at?: string
          recurring_transaction_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          category?: string
          description?: string
          date?: string
          updated_at?: string
          recurring_transaction_id?: string | null
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          target_amount: number
          current_amount: number
          target_date: string
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          target_amount: number
          current_amount?: number
          target_date: string
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          target_amount?: number
          current_amount?: number
          target_date?: string
          category?: string
          updated_at?: string
        }
      }
      liabilities: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'loan' | 'credit_card' | 'mortgage' | 'other'
          total_amount: number
          remaining_amount: number
          interest_rate: number
          monthly_payment: number
          due_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'loan' | 'credit_card' | 'mortgage' | 'other'
          total_amount: number
          remaining_amount: number
          interest_rate: number
          monthly_payment: number
          due_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'loan' | 'credit_card' | 'mortgage' | 'other'
          total_amount?: number
          remaining_amount?: number
          interest_rate?: number
          monthly_payment?: number
          due_date?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          amount: number
          spent: number
          period: 'weekly' | 'monthly' | 'yearly'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          amount: number
          spent?: number
          period: 'weekly' | 'monthly' | 'yearly'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          amount?: number
          spent?: number
          period?: 'weekly' | 'monthly' | 'yearly'
          updated_at?: string
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
          start_date: string
          end_date: string | null
          next_occurrence_date: string
          last_processed_date: string | null
          is_active: boolean
          day_of_week: number | null
          day_of_month: number | null
          month_of_year: number | null
          max_occurrences: number | null
          current_occurrences: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
          start_date: string
          end_date?: string | null
          next_occurrence_date: string
          last_processed_date?: string | null
          is_active?: boolean
          day_of_week?: number | null
          day_of_month?: number | null
          month_of_year?: number | null
          max_occurrences?: number | null
          current_occurrences?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          category?: string
          description?: string
          frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
          start_date?: string
          end_date?: string | null
          next_occurrence_date?: string
          last_processed_date?: string | null
          is_active?: boolean
          day_of_week?: number | null
          day_of_month?: number | null
          month_of_year?: number | null
          max_occurrences?: number | null
          current_occurrences?: number
          updated_at?: string
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}