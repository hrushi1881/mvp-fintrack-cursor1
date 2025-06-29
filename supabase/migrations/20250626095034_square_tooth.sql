/*
  # Initial Schema for Finance Tracker

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `name` (text)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text, 'income' or 'expense')
      - `amount` (numeric)
      - `category` (text)
      - `description` (text)
      - `date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `target_amount` (numeric)
      - `current_amount` (numeric, default 0)
      - `target_date` (date)
      - `category` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `liabilities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `type` (text)
      - `total_amount` (numeric)
      - `remaining_amount` (numeric)
      - `interest_rate` (numeric)
      - `monthly_payment` (numeric)
      - `due_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `budgets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `category` (text)
      - `amount` (numeric)
      - `spent` (numeric, default 0)
      - `period` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  current_amount numeric DEFAULT 0 CHECK (current_amount >= 0),
  target_date date NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create liabilities table
CREATE TABLE IF NOT EXISTS liabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('loan', 'credit_card', 'mortgage', 'other')),
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  remaining_amount numeric NOT NULL CHECK (remaining_amount >= 0),
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
  monthly_payment numeric NOT NULL CHECK (monthly_payment > 0),
  due_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  spent numeric DEFAULT 0 CHECK (spent >= 0),
  period text NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for transactions
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for goals
CREATE POLICY "Users can read own goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for liabilities
CREATE POLICY "Users can read own liabilities"
  ON liabilities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own liabilities"
  ON liabilities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own liabilities"
  ON liabilities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own liabilities"
  ON liabilities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for budgets
CREATE POLICY "Users can read own budgets"
  ON budgets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions(date);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions(category);
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals(user_id);
CREATE INDEX IF NOT EXISTS liabilities_user_id_idx ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON budgets(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_liabilities_updated_at BEFORE UPDATE ON liabilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();