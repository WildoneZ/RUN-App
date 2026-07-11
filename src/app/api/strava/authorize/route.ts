import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { isDemo } from '@/lib/env';
import { stravaAuthorizeUrl } from '@/lib/strava';
import { getSessionUser } from '@/lib/data';

/** Kicks off the Strava OAuth dance. CSRF-protected via a state cookie. */
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL('/welcome', origin));
  if (isDemo()) {
    return NextResponse.redirect(new URL('/onboarding?step=done&demo_strava=1', origin));
  }
  const state = randomBytes(16).toString('hex');
  const res = NextResponse.redirect(stravaAuthorizeUrl(state));
  res.cookies.set('strava_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
