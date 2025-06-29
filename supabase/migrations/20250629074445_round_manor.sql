/*
  # Update Liability Schema for Enhanced Debt Tracking

  1. Changes
    - Modify the `type` column to support 'loan' and 'purchase' types
    - Add `start_date` column to track when the liability was created
    - Add `linked_purchase_id` column to link liabilities to purchase transactions
    - Create index for `linked_purchase_id` for better query performance

  2. Security
    - Maintain existing RLS policies
    - Ensure proper foreign key constraints
*/

-- First, drop the existing type check constraint
ALTER TABLE liabilities DROP CONSTRAINT IF EXISTS liabilities_type_check;

-- Add the new type check constraint with updated values
ALTER TABLE liabilities ADD CONSTRAINT liabilities_type_check 
  CHECK (type IN ('loan', 'credit_card', 'mortgage', 'purchase', 'other'));

-- Add start_date column with default value for existing rows
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN start_date date DEFAULT CURRENT_DATE NOT NULL;
  END IF;
END $$;

-- Add linked_purchase_id column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'liabilities' AND column_name = 'linked_purchase_id'
  ) THEN
    ALTER TABLE liabilities ADD COLUMN linked_purchase_id uuid REFERENCES transactions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for linked_purchase_id
CREATE INDEX IF NOT EXISTS liabilities_linked_purchase_id_idx ON liabilities(linked_purchase_id);