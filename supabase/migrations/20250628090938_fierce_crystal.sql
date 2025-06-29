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

-- Create policies for user_categories (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_categories' AND policyname = 'Users can read own categories'
  ) THEN
    CREATE POLICY "Users can read own categories"
      ON user_categories
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_categories' AND policyname = 'Users can insert own categories'
  ) THEN
    CREATE POLICY "Users can insert own categories"
      ON user_categories
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_categories' AND policyname = 'Users can update own categories'
  ) THEN
    CREATE POLICY "Users can update own categories"
      ON user_categories
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_categories' AND policyname = 'Users can delete own categories'
  ) THEN
    CREATE POLICY "Users can delete own categories"
      ON user_categories
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create trigger for updated_at (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_categories_updated_at'
  ) THEN
    CREATE TRIGGER update_user_categories_updated_at 
    BEFORE UPDATE ON user_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

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