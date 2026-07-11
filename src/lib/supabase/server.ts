import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { required } from '@/lib/env';

/** Request-scoped client carrying the signed-in user's JWT (RLS applies). */
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    required('NEXT_PUBLIC_SUPABASE_URL'),
    required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component: middleware refreshes sessions.
          }
        },
      },
    }
  );
}
