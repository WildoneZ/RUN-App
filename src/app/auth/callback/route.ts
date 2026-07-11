import { NextResponse, type NextRequest } from 'next/server';
import { isDemo } from '@/lib/env';
import { supabaseServer } from '@/lib/supabase/server';

/** Magic-link landing: exchange the auth code for a session cookie. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get('next') ?? '/home';
  if (isDemo()) return NextResponse.redirect(new URL(next, url.origin));

  const code = url.searchParams.get('code');
  if (code) {
    const db = supabaseServer();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL('/welcome?error=auth', url.origin));
}
