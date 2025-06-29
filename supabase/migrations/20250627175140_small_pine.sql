/*
  # Fix RLS Policy for Profiles Table
  
  This migration fixes the Row Level Security (RLS) policy for the profiles table
  to allow both anonymous and authenticated users to insert profiles.
  
  This is necessary because during registration, users start with the 'anon' role
  and need to be able to create their profile before becoming 'authenticated'.
*/

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a new policy that allows both anon and authenticated roles
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = id);