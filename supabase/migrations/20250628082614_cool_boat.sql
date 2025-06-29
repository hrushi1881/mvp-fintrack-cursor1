/*
  # Add User Categories and Transaction Splitting Support

  1. New Tables
    - `user_categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `type` (text, 'income' or 'expense')
      - `icon` (text, optional)
      - `color` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Changes to Transactions Table
    - Add `parent_transaction_id` column to support transaction splitting
    - This allows transactions to be linked to a parent transaction

  3. Security
    - Enable RLS on the new table
    - Add policies for authenticated users to manage their own categories
*/

-- Create user_categories table
CREATE TABLE IF NOT EXISTS user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add parent_transaction_id column to transactions table for split transactions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'parent_transaction_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN parent_transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS user_categories_user_id_idx ON user_categories(user_id);
CREATE INDEX IF NOT EXISTS transactions_parent_transaction_id_idx ON transactions(parent_transaction_id);

-- Enable Row Level Security
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for user_categories
CREATE POLICY "Users can read own categories"
  ON user_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON user_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON user_categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON user_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_categories_updated_at 
BEFORE UPDATE ON user_categories 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories for all existing users
INSERT INTO user_categories (user_id, name, type)
SELECT 
  p.id, 
  c.name, 
  c.type
FROM 
  profiles p,
  (VALUES 
    ('Salary', 'income'),
    ('Freelance', 'income'),
    ('Investment', 'income'),
    ('Business', 'income'),
    ('Bonus', 'income'),
    ('Gift', 'income'),
    ('Other', 'income'),
    ('Housing', 'expense'),
    ('Food', 'expense'),
    ('Transportation', 'expense'),
    ('Entertainment', 'expense'),
    ('Healthcare', 'expense'),
    ('Shopping', 'expense'),
    ('Bills', 'expense'),
    ('Savings', 'expense'),
    ('Other', 'expense')
  ) AS c(name, type)
ON CONFLICT DO NOTHING;