import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.CIVOARA_SUPABASE_URL ||
    'https://udorjqovbxehugwiqbxt.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.CIVOARA_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_CIVOARA_SUPABASE_PUBLISHABLE_KEY ||
    '';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
