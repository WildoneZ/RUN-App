import { supabaseAdmin } from '@/lib/supabase/admin';
import { accessTokenFor, fetchActivity, type StravaActivity } from '@/lib/strava';
import { categoriseSportType, ruleKeyForCategory, scoreRun } from '@/lib/points';

/**
 * The effectful half of the points engine: turns Strava webhook events into
 * activities rows + append-only ledger rows. Idempotent and delta-correct:
 * re-processing an event, or an activity edit, converges the ledger to the
 * correct total via correction rows (never by editing history).
 */

const ref = (stravaActivityId: number) => `strava:${stravaActivityId}`;

async function netLedgerForActivity(userId: string, activityRef: string): Promise<number> {
  const db = supabaseAdmin();
  const { data } = await db
    .from('points_ledger')
    .select('points')
    .eq('user_id', userId)
    .eq('activity_ref', activityRef);
  return (data ?? []).reduce((sum, row) => sum + row.points, 0);
}

/** Run-source points earned on the given UTC day, excluding one activity's rows. */
async function runPointsOnDay(userId: string, dayIso: string, excludeRef: string): Promise<number> {
  const db = supabaseAdmin();
  const dayStart = `${dayIso}T00:00:00Z`;
  const dayEnd = `${dayIso}T23:59:59.999Z`;
  const { data } = await db
    .from('activities')
    .select('points_awarded, strava_activity_id')
    .eq('user_id', userId)
    .eq('status', 'scored')
    .gte('started_at', dayStart)
    .lte('started_at', dayEnd);
  return (data ?? [])
    .filter((a) => ref(a.strava_activity_id) !== excludeRef)
    .reduce((sum, a) => sum + a.points_awarded, 0);
}

export async function syncActivityById(userId: string, stravaActivityId: number): Promise<void> {
  const token = await accessTokenFor(userId);
  if (!token) return;
  const activity = await fetchActivity(token, stravaActivityId);
  if (!activity) {
    await removeActivity(userId, stravaActivityId);
    return;
  }
  await upsertActivity(userId, activity);
}

export async function upsertActivity(userId: string, a: StravaActivity): Promise<void> {
  const db = supabaseAdmin();
  const category = categoriseSportType(a.sport_type);
  const activityRef = ref(a.id);

  if (!category) {
    // Non-running type: reverse anything previously awarded (type may have been
    // edited from Run -> Ride), then record it as ignored.
    const net = await netLedgerForActivity(userId, activityRef);
    if (net !== 0) {
      await db.from('points_ledger').insert({
        user_id: userId,
        source: 'run',
        activity_ref: activityRef,
        points: -net,
        reason: 'activity type no longer eligible',
      });
    }
    await db.from('activities').upsert(
      {
        user_id: userId,
        strava_activity_id: a.id,
        name: a.name,
        sport_type: a.sport_type,
        category: 'other',
        distance_m: a.distance,
        moving_time_s: a.moving_time,
        started_at: a.start_date,
        is_manual: a.manual,
        status: 'ignored',
        points_awarded: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'strava_activity_id' }
    );
    return;
  }

  const { data: rule } = await db
    .from('points_rules')
    .select('points_per_km, multiplier, daily_cap, allow_manual_activities, enabled, version')
    .eq('key', ruleKeyForCategory(category))
    .maybeSingle();
  if (!rule) return;

  const day = a.start_date.slice(0, 10);
  const alreadyToday = await runPointsOnDay(userId, day, activityRef);
  const score = scoreRun({
    distanceM: a.distance,
    isManual: a.manual,
    rule: {
      pointsPerKm: rule.points_per_km,
      multiplier: rule.multiplier,
      dailyCap: rule.daily_cap,
      allowManualActivities: rule.allow_manual_activities,
      enabled: rule.enabled,
      version: rule.version,
    },
    pointsAlreadyEarnedToday: alreadyToday,
  });

  const net = await netLedgerForActivity(userId, activityRef);
  const delta = score.points - net;
  if (delta !== 0) {
    await db.from('points_ledger').insert({
      user_id: userId,
      source: 'run',
      activity_ref: activityRef,
      points: delta,
      rule_version: rule.version,
      reason: net === 0 ? null : 'activity updated — correction',
    });
  }

  await db.from('activities').upsert(
    {
      user_id: userId,
      strava_activity_id: a.id,
      name: a.name,
      sport_type: a.sport_type,
      category,
      distance_m: a.distance,
      moving_time_s: a.moving_time,
      started_at: a.start_date,
      is_manual: a.manual,
      status: 'scored',
      points_awarded: score.points,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'strava_activity_id' }
  );
}

export async function removeActivity(userId: string, stravaActivityId: number): Promise<void> {
  const db = supabaseAdmin();
  const activityRef = ref(stravaActivityId);
  const net = await netLedgerForActivity(userId, activityRef);
  if (net !== 0) {
    await db.from('points_ledger').insert({
      user_id: userId,
      source: 'run',
      activity_ref: activityRef,
      points: -net,
      reason: 'activity deleted on Strava',
    });
  }
  await db
    .from('activities')
    .update({ status: 'deleted', points_awarded: 0, updated_at: new Date().toISOString() })
    .eq('strava_activity_id', stravaActivityId)
    .eq('user_id', userId);
}
