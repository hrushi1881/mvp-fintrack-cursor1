import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Use environment variables or fallback to the provided credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbskidyauxehvswgckrv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFic2tpZHlhdXhlaHZzd2dja3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzA3NDgsImV4cCI6MjA2NjUwNjc0OH0.A2C-1fRXKwLhA9yt6CyQq1BqfjpQ3J46zuHlwjnWBE4';

console.log('Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});