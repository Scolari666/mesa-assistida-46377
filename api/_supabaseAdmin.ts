import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for trusted server code only (Vercel
 * functions). Bypasses RLS, so it must never be reachable from the browser —
 * these two env vars are intentionally NOT prefixed with VITE_.
 */
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
