/*
  # Fix RLS Policy for Profiles Table

  This migration fixes the issue with the profiles table RLS policy
  that prevents new users from creating their profiles during registration.

  1. Changes
    - Drop the existing insert policy for profiles table
    - Create a new policy that allows both anon and authenticated roles to insert profiles
    - This ensures that new users can create their profiles during the registration process

  2. Security
    - The policy still maintains the security check that users can only create profiles with their own ID
    - This prevents users from creating profiles for other users
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a new policy that allows both anon and authenticated roles
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = id);