import { NextResponse, type NextRequest } from 'next/server';
import { required } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { accessTokenFor } from '@/lib/strava';

export const maxDuration = 300;

/**
 * Vercel cron (see vercel.json): proactively refresh Strava tokens expiring
 * within 12 hours so webhook processing never stalls on a cold token, and
 * replay webhook events that previously errored.
 */
export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${required('CRON_SECRET')}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const db = supabaseAdmin();
  const soon = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
  const { data: expiring } = await db
    .from('strava_connections')
    .select('user_id')
    .lt('expires_at', soon)
    .limit(200);

  let refreshed = 0;
  let failed = 0;
  for (const conn of expiring ?? []) {
    try {
      await accessTokenFor(conn.user_id); // refreshes + persists as a side effect
      refreshed += 1;
    } catch (err) {
      failed += 1;
      console.error(`token refresh failed for user ${conn.user_id}`, err);
    }
  }
  return NextResponse.json({ refreshed, failed });
}
