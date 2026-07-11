import type { PointsRule, RunCategory } from '@/lib/types';

/**
 * Pure points arithmetic — no I/O. The effectful sync layer
 * (strava-sync.ts) fetches rules + daily totals and calls these.
 * Points are ALWAYS computed server-side and persisted to the ledger.
 */

/** Strava sport types that count as runs, mapped to our rule categories. */
export function categoriseSportType(sportType: string): RunCategory | null {
  if (sportType === 'TrailRun') return 'trail';
  if (sportType === 'Run' || sportType === 'VirtualRun') return 'road';
  return null; // non-running types are ignored unless a rule enables them later
}

export function ruleKeyForCategory(category: RunCategory): string {
  return category === 'trail' ? 'trail_run' : 'road_run';
}

export interface RunScoreInput {
  distanceM: number;
  isManual: boolean;
  rule: Pick<
    PointsRule,
    'pointsPerKm' | 'multiplier' | 'dailyCap' | 'allowManualActivities' | 'enabled' | 'version'
  >;
  /** Run-source points already banked by this user on the activity's local day. */
  pointsAlreadyEarnedToday: number;
}

export interface RunScore {
  points: number;
  capped: boolean;
  reason: 'scored' | 'manual_blocked' | 'rule_disabled' | 'cap_reached';
}

export function scoreRun(input: RunScoreInput): RunScore {
  const { rule } = input;
  if (!rule.enabled) return { points: 0, capped: false, reason: 'rule_disabled' };
  // Anti-cheat: manual (non-GPS) entries earn zero unless the admin toggle allows them.
  if (input.isManual && !rule.allowManualActivities)
    return { points: 0, capped: false, reason: 'manual_blocked' };

  const km = input.distanceM / 1000;
  const raw = Math.floor(km * (rule.pointsPerKm ?? 0) * rule.multiplier);
  if (raw <= 0) return { points: 0, capped: false, reason: 'scored' };

  if (rule.dailyCap == null) return { points: raw, capped: false, reason: 'scored' };
  const headroom = Math.max(0, rule.dailyCap - input.pointsAlreadyEarnedToday);
  if (headroom === 0) return { points: 0, capped: true, reason: 'cap_reached' };
  const points = Math.min(raw, headroom);
  return { points, capped: points < raw, reason: 'scored' };
}

export function scorePurchase(
  totalRands: number,
  rule: Pick<PointsRule, 'pointsPerR100' | 'multiplier' | 'enabled'>
): number {
  if (!rule.enabled || !rule.pointsPerR100) return 0;
  return Math.floor((totalRands / 100) * rule.pointsPerR100 * rule.multiplier);
}

/** Weekly streak: count consecutive ISO weeks (ending this week or last week)
 *  with at least one scored run. Gentle: an in-progress week never breaks it. */
export function weeklyStreak(runStartDates: Date[], now: Date): number {
  const weekKey = (d: Date) => {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day); // ISO week: Thursday anchors the week
    const jan1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((t.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
    return `${t.getUTCFullYear()}-${week}`;
  };
  const weeks = new Set(runStartDates.map(weekKey));
  let streak = 0;
  const cursor = new Date(now);
  if (!weeks.has(weekKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 7); // grace for current week
  while (weeks.has(weekKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return streak;
}
