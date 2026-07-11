import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { required } from '@/lib/env';

let cached: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses RLS — server-only, used by the points engine,
 * webhooks and admin mutations. NEVER import from client components.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!cached) {
    cached = createClient(
      required('NEXT_PUBLIC_SUPABASE_URL'),
      required('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return cached;
}
