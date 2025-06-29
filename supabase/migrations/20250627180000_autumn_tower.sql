/*
  # Fix Profiles RLS Policy for Registration

  This migration fixes the Row Level Security (RLS) policy for the profiles table
  to allow both anonymous and authenticated users to create their own profiles.
  
  This is necessary because during registration, the user is still in the 'anon' role
  when they need to create their profile.
*/

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a new policy that allows both anon and authenticated roles
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = id);