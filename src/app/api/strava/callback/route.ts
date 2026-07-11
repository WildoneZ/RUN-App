import { NextResponse, type NextRequest } from 'next/server';
import { exchangeCode } from '@/lib/strava';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/data';
import { isDemo } from '@/lib/env';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  if (isDemo()) return NextResponse.redirect(new URL('/onboarding?step=done', origin));

  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL('/welcome', origin));

  const stateCookie = request.cookies.get('strava_oauth_state')?.value;
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const denied = url.searchParams.get('error'); // user clicked "cancel" on Strava

  const fail = (why: string) =>
    NextResponse.redirect(new URL(`/onboarding?step=strava&error=${why}`, origin));

  if (denied) return fail('denied');
  if (!code || !state || !stateCookie || state !== stateCookie) return fail('state');

  try {
    const token = await exchangeCode(code);
    if (!token.athlete?.id) return fail('exchange');
    const db = supabaseAdmin();
    const { error } = await db.from('strava_connections').upsert(
      {
        user_id: user.id,
        athlete_id: token.athlete.id,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: new Date(token.expires_at * 1000).toISOString(),
        scope: 'read,activity:read',
        athlete_firstname: token.athlete.firstname ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) {
      console.error('strava callback: failed to persist connection', error);
      return fail('persist');
    }
    const res = NextResponse.redirect(new URL('/onboarding?step=done', origin));
    res.cookies.delete('strava_oauth_state');
    return res;
  } catch (err) {
    console.error('strava callback: token exchange failed', err);
    return fail('exchange');
  }
}
