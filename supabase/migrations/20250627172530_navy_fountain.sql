/*
  # Fix Profiles Table RLS Policy

  1. Changes
    - Drop the existing "Users can insert own profile" policy
    - Create a new policy that allows both anon and authenticated roles to insert profiles
    - This fixes the registration process by allowing new users to create their profile

  2. Security
    - Still maintains security by checking that auth.uid() = id
    - Only allows users to create profiles with their own ID
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a new policy that allows both anon and authenticated roles
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = id);