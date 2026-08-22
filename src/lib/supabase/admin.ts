import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for server-only code with no signed-in user
 * (the reminder cron job). Bypasses RLS entirely -- never import this from
 * a Server Component, Client Component, or anywhere the request is on
 * behalf of a specific user. SUPABASE_SERVICE_ROLE_KEY must stay server-only
 * (no NEXT_PUBLIC_ prefix).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
