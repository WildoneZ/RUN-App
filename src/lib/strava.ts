import { appUrl, required } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Strava API v3 client: OAuth, token refresh, activity fetch.
 * Compliance notes:
 *  - tokens live server-side only (strava_connections has no user RLS policies)
 *  - activity data is only ever surfaced to its owner
 *  - data feeds the deterministic points formula and nothing else
 */

const STRAVA_OAUTH = 'https://www.strava.com/oauth';
const STRAVA_API = 'https://www.strava.com/api/v3';

export function stravaAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: required('STRAVA_CLIENT_ID'),
    redirect_uri: `${appUrl()}/api/strava/callback`,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read', // activity:read_all not requested — private activities stay private
    state,
  });
  return `${STRAVA_OAUTH}/authorize?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  athlete?: { id: number; firstname?: string };
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${STRAVA_OAUTH}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: required('STRAVA_CLIENT_ID'),
      client_secret: required('STRAVA_CLIENT_SECRET'),
      ...body,
    }),
  });
  if (!res.ok) throw new Error(`Strava token endpoint ${res.status}: ${await res.text()}`);
  return res.json();
}

export function exchangeCode(code: string): Promise<TokenResponse> {
  return tokenRequest({ code, grant_type: 'authorization_code' });
}

/** Returns a valid access token for the user, refreshing (and persisting) if expired. */
export async function accessTokenFor(userId: string): Promise<string | null> {
  const db = supabaseAdmin();
  const { data: conn } = await db
    .from('strava_connections')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (!conn) return null;

  const expiresAt = new Date(conn.expires_at).getTime();
  if (expiresAt - Date.now() > 5 * 60 * 1000) return conn.access_token;

  const fresh = await tokenRequest({
    grant_type: 'refresh_token',
    refresh_token: conn.refresh_token,
  });
  await db
    .from('strava_connections')
    .update({
      access_token: fresh.access_token,
      refresh_token: fresh.refresh_token,
      expires_at: new Date(fresh.expires_at * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  return fresh.access_token;
}

export interface StravaActivity {
  id: number;
  name: string;
  sport_type: string;
  distance: number; // metres
  moving_time: number; // seconds
  start_date: string; // ISO
  manual: boolean;
  trainer?: boolean;
}

export async function fetchActivity(
  accessToken: string,
  activityId: number
): Promise<StravaActivity | null> {
  const res = await fetch(`${STRAVA_API}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Strava activity fetch ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function deauthorize(accessToken: string): Promise<void> {
  await fetch(`${STRAVA_OAUTH}/deauthorize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => undefined); // best effort — account deletion proceeds regardless
}
