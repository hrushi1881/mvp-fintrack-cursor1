/*
  # Fix Profiles Table RLS Policy

  1. Changes
    - Drop the existing "Users can insert own profile" policy
    - Create a new policy that allows both anon and authenticated roles to insert profiles
    - This fixes the registration flow by allowing new users to create their profile

  2. Security
    - Still maintains security by ensuring users can only create profiles with their own ID
    - Only modifies the INSERT policy, keeping all other policies unchanged
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a new policy that allows both anon and authenticated roles
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = id);