# Database Migration Instructions

The application is failing because the database tables haven't been created yet. You need to apply the migration manually through the Supabase dashboard.

## Steps to Fix:

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project (https://qbskidyauxehvswgckrv.supabase.co)

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/20250626095034_square_tooth.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see the following tables:
     - profiles
     - transactions
     - goals
     - liabilities
     - budgets

## What this migration creates:

- **profiles table**: User profile information
- **transactions table**: Income and expense records
- **goals table**: Financial goals tracking
- **liabilities table**: Debts and loans
- **budgets table**: Budget categories and limits
- **Row Level Security (RLS)**: Ensures users can only access their own data
- **Indexes**: For better query performance
- **Triggers**: For automatic timestamp updates

## After running the migration:

The application should work properly and you'll be able to:
- Create user profiles
- Add transactions
- Set financial goals
- Track budgets
- Manage liabilities

If you encounter any issues, check the Supabase logs in the dashboard for more detailed error messages.