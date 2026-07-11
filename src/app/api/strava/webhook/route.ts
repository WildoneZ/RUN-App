import { NextResponse, type NextRequest } from 'next/server';
import { optional, required } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { removeActivity, syncActivityById } from '@/lib/strava-sync';

export const maxDuration = 60; // activity fetch + scoring can take a few seconds

/**
 * Strava webhook subscription endpoint.
 * GET  = subscription validation handshake (echo hub.challenge).
 * POST = event delivery. Strava does not sign event bodies, so validation is:
 *   (1) the verify-token handshake proves we own the endpoint,
 *   (2) each event's subscription_id must match ours,
 *   (3) events are treated as untrusted hints — we always re-fetch the
 *       activity from the API with the athlete's own token before scoring.
 * Events are logged to webhook_events with a dedupe key, so redeliveries no-op.
 */

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === required('STRAVA_WEBHOOK_VERIFY_TOKEN') && challenge) {
    return NextResponse.json({ 'hub.challenge': challenge });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

interface StravaEvent {
  object_type: 'activity' | 'athlete';
  object_id: number;
  aspect_type: 'create' | 'update' | 'delete';
  owner_id: number; // athlete id
  subscription_id: number;
  event_time: number;
  updates?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  let event: StravaEvent;
  try {
    event = await request.json();
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const expectedSub = optional('STRAVA_WEBHOOK_SUBSCRIPTION_ID');
  if (expectedSub && String(event.subscription_id) !== expectedSub) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const db = supabaseAdmin();
  const dedupeKey = `strava:${event.object_type}:${event.object_id}:${event.aspect_type}:${event.event_time}`;
  const { error: insertErr } = await db
    .from('webhook_events')
    .insert({ provider: 'strava', dedupe_key: dedupeKey, payload: event });
  if (insertErr) {
    // unique violation = redelivery of an event we already have
    return NextResponse.json({ ok: true, deduped: true });
  }

  const finish = async (status: 'processed' | 'skipped' | 'error', error?: string) => {
    await db
      .from('webhook_events')
      .update({ status, error: error ?? null, processed_at: new Date().toISOString() })
      .eq('dedupe_key', dedupeKey);
  };

  try {
    if (event.object_type === 'athlete') {
      // 'update' with authorized:false = the athlete revoked access. Honour it.
      if (event.updates?.authorized === 'false') {
        await db.from('strava_connections').delete().eq('athlete_id', event.owner_id);
        await finish('processed');
      } else {
        await finish('skipped');
      }
      return NextResponse.json({ ok: true });
    }

    const { data: conn } = await db
      .from('strava_connections')
      .select('user_id')
      .eq('athlete_id', event.owner_id)
      .maybeSingle();
    if (!conn) {
      await finish('skipped', 'no linked user for athlete');
      return NextResponse.json({ ok: true });
    }

    if (event.aspect_type === 'delete') {
      await removeActivity(conn.user_id, event.object_id);
    } else {
      await syncActivityById(conn.user_id, event.object_id);
    }
    await finish('processed');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('strava webhook processing failed', err);
    await finish('error', err instanceof Error ? err.message : String(err));
    // 200 anyway: Strava retries on non-2xx and the event is already logged;
    // the reconciliation cron can replay failed events.
    return NextResponse.json({ ok: false });
  }
}
