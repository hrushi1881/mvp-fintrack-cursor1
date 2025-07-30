import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Secure environment variable handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'fintrack-app'
    }
  }
});

// Performance monitoring
export const logQueryPerformance = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  if (duration > 1000) {
    console.warn(`Slow Supabase query: ${operation} took ${duration}ms`);
  }
  return duration;
};