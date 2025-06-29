/*
  # Add Recurring Transactions Table

  1. New Tables
    - `recurring_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text, 'income' or 'expense')
      - `amount` (numeric)
      - `category` (text)
      - `description` (text)
      - `frequency` (text, 'daily', 'weekly', 'monthly', or 'yearly')
      - `start_date` (date)
      - `end_date` (date, nullable)
      - `next_occurrence_date` (date)
      - `last_processed_date` (date, nullable)
      - `is_active` (boolean)
      - `day_of_week` (integer, nullable)
      - `day_of_month` (integer, nullable)
      - `month_of_year` (integer, nullable)
      - `max_occurrences` (integer, nullable)
      - `current_occurrences` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on the new table
    - Add policies for authenticated users to manage their own recurring transactions
    
  3. Changes
    - Add a new column to transactions table to link to recurring transactions
*/

-- Create recurring_transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  description text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  next_occurrence_date date NOT NULL,
  last_processed_date date,
  is_active boolean NOT NULL DEFAULT true,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month integer CHECK (day_of_month >= 1 AND day_of_month <= 31),
  month_of_year integer CHECK (month_of_year >= 1 AND month_of_year <= 12),
  max_occurrences integer,
  current_occurrences integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add recurring_transaction_id column to transactions table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'recurring_transaction_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN recurring_transaction_id uuid REFERENCES recurring_transactions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS recurring_transactions_user_id_idx ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS recurring_transactions_next_occurrence_date_idx ON recurring_transactions(next_occurrence_date);
CREATE INDEX IF NOT EXISTS transactions_recurring_transaction_id_idx ON transactions(recurring_transaction_id);

-- Enable Row Level Security
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for recurring_transactions
CREATE POLICY "Users can read own recurring transactions"
  ON recurring_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring transactions"
  ON recurring_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions"
  ON recurring_transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions"
  ON recurring_transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_recurring_transactions_updated_at 
BEFORE UPDATE ON recurring_transactions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();