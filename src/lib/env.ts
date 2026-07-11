/**
 * Central env access. Everything is read lazily so `next build` succeeds
 * before any keys exist, and so demo mode can run with zero configuration.
 * Secrets are only ever read in server code — never import this into a
 * client component except via the NEXT_PUBLIC_* helpers.
 */

export function isDemo(): boolean {
  if (process.env.DEMO_MODE === 'true') return true;
  // No Supabase configured -> fall back to demo so the app is always reviewable.
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
