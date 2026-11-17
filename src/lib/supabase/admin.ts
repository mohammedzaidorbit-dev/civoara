import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Trusted Admin Client using the Supabase Service Role Key.
 *
 * SECURITY NOTICE:
 * This client bypasses Row Level Security (RLS).
 * It must ONLY be invoked within secure Server Actions, route handlers,
 * or migration/seed scripts. NEVER import or execute this module in client components.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.CIVOARA_SUPABASE_URL ||
    'https://udorjqovbxehugwiqbxt.supabase.co';
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.CIVOARA_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.CIVOARA_SUPABASE_SECRET_KEY ||
    '';

  if (!serviceRoleKey) {
    console.warn(
      '[CIVOARA SECURITY] SUPABASE_SERVICE_ROLE_KEY is not defined. Admin actions will fall back to restricted permissions.'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey || 'placeholder-service-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
