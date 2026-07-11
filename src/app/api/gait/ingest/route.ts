import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { required } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Bridge from the separate RUN Analysis gait app.
 * POST { email, session_date, summary, recommendations?, video_url? }
 * Auth: Authorization: Bearer <GAIT_APP_API_KEY>
 * The record is matched to a rewards profile by verified email if one
 * exists; otherwise it is stored and linked when that email signs up.
 */

function keyMatches(header: string | null): boolean {
  const expected = required('GAIT_APP_API_KEY');
  const provided = header?.replace(/^Bearer\s+/i, '') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    if (!keyMatches(request.headers.get('authorization'))) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  } catch {
    return new NextResponse('Gait ingest not configured', { status: 503 });
  }

  let body: {
    email?: string;
    session_date?: string;
    summary?: Record<string, unknown>;
    recommendations?: string;
    video_url?: string;
  };
  try {
    body = await request.json();
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const sessionDate = body.session_date ?? '';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    return NextResponse.json({ error: 'email and session_date (YYYY-MM-DD) are required' }, { status: 422 });
  }

  const db = supabaseAdmin();
  const { data: profile } = await db.from('profiles').select('id').ilike('email', email).maybeSingle();

  const { data: row, error } = await db
    .from('gait_sessions')
    .insert({
      user_id: profile?.id ?? null,
      email,
      session_date: sessionDate,
      summary: body.summary ?? {},
      recommendations: body.recommendations ?? null,
      video_url: body.video_url ?? null,
    })
    .select('id')
    .single();
  if (error || !row) {
    console.error('gait ingest failed', error);
    return new NextResponse('Internal Error', { status: 500 });
  }

  // A completed in-store gait analysis earns points (rule: gait_analysis).
  if (profile?.id) {
    const { data: rule } = await db
      .from('points_rules')
      .select('flat_points, multiplier, enabled, version')
      .eq('key', 'gait_analysis')
      .maybeSingle();
    if (rule?.enabled && rule.flat_points) {
      await db.from('points_ledger').insert({
        user_id: profile.id,
        source: 'gait',
        activity_ref: `gait:${row.id}`,
        points: Math.floor(rule.flat_points * rule.multiplier),
        rule_version: rule.version,
        reason: 'Gait analysis visit',
      });
    }
  }
  return NextResponse.json({ ok: true, id: row.id, linked: Boolean(profile?.id) });
}
