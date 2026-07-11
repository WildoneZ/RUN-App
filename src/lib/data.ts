import 'server-only';
import { cookies } from 'next/headers';
import { isDemo } from '@/lib/env';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fetchOrdersForCustomer, findCustomerByEmail, shopifyConfigured } from '@/lib/shopify';
import { weeklyStreak } from '@/lib/points';
import * as demo from '@/lib/demo';
import type {
  Activity,
  AdminCustomerSummary,
  HomeData,
  LedgerEntry,
  PointsRule,
  Purchase,
  Redemption,
  Reward,
  SessionUser,
} from '@/lib/types';

/**
 * Read-side data layer. Every page reads through here, so demo mode
 * (zero keys configured) serves the complete experience from fixtures.
 * Real mode uses the request-scoped Supabase client — RLS enforces that
 * users only ever see their own rows.
 */

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isDemo()) {
    // In demo mode a cookie toggles the admin persona (set from /settings).
    const isAdminPersona = cookies().get('demo_admin')?.value === '1';
    return { ...demo.demoUser, role: isAdminPersona ? 'admin' : 'customer' };
  }
  const db = supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data: p } = await db
    .from('profiles')
    .select('email, first_name, last_name, role, onboarded_at, marketing_opt_in, leaderboard_opt_in')
    .eq('id', user.id)
    .maybeSingle();
  if (!p) return null;
  return {
    id: user.id,
    email: p.email,
    firstName: p.first_name,
    lastName: p.last_name,
    role: p.role,
    onboarded: Boolean(p.onboarded_at),
    marketingOptIn: p.marketing_opt_in,
    leaderboardOptIn: p.leaderboard_opt_in,
  };
}

export async function getStravaLinked(userId: string): Promise<boolean> {
  if (isDemo()) return true;
  const db = supabaseServer();
  const { data } = await db.rpc('my_strava_status');
  void userId;
  return Boolean(data && data.length > 0);
}

const mapLedger = (rows: Record<string, unknown>[]): LedgerEntry[] =>
  rows.map((r) => ({
    id: String(r.id),
    source: r.source as LedgerEntry['source'],
    activityRef: (r.activity_ref as string) ?? null,
    points: Number(r.points),
    reason: (r.reason as string) ?? null,
    createdAt: String(r.created_at),
  }));

export async function getHomeData(user: SessionUser): Promise<HomeData> {
  if (isDemo()) return demo.demoHomeData();
  const db = supabaseServer();

  const [{ data: balance }, { data: ledgerRows }, { data: weekActs }, { data: allRunDates }, { data: rewards }] =
    await Promise.all([
      db.rpc('my_points_balance'),
      db
        .from('points_ledger')
        .select('id, source, activity_ref, points, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
      db
        .from('activities')
        .select('distance_m')
        .eq('status', 'scored')
        .gte('started_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      db.from('activities').select('started_at').eq('status', 'scored').order('started_at', { ascending: false }).limit(400),
      db.from('rewards').select('title, points_cost').eq('active', true).order('points_cost', { ascending: true }),
    ]);

  const bal = Number(balance ?? 0);
  const next = (rewards ?? []).find((r) => r.points_cost > bal) ?? (rewards ?? [])[0] ?? null;
  return {
    balance: bal,
    weekKm: (weekActs ?? []).reduce((s, a) => s + Number(a.distance_m), 0) / 1000,
    weekRuns: (weekActs ?? []).length,
    streakWeeks: weeklyStreak(
      (allRunDates ?? []).map((a) => new Date(a.started_at)),
      new Date()
    ),
    nextReward: next ? { title: next.title, pointsCost: next.points_cost } : null,
    recentLedger: mapLedger(ledgerRows ?? []),
  };
}

export async function getActivities(user: SessionUser): Promise<Activity[]> {
  if (isDemo()) return demo.demoActivities;
  const db = supabaseServer();
  const { data } = await db
    .from('activities')
    .select('id, name, sport_type, category, distance_m, moving_time_s, started_at, is_manual, points_awarded')
    .neq('status', 'deleted')
    .order('started_at', { ascending: false })
    .limit(50);
  void user;
  return (data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    sportType: a.sport_type,
    category: a.category,
    distanceM: Number(a.distance_m),
    movingTimeS: a.moving_time_s,
    startedAt: a.started_at,
    isManual: a.is_manual,
    pointsAwarded: a.points_awarded,
  }));
}

export async function getPurchases(user: SessionUser): Promise<Purchase[]> {
  if (isDemo()) return demo.demoPurchases;
  if (!shopifyConfigured()) return [];
  const admin = supabaseAdmin();
  let { data: link } = await admin
    .from('shopify_links')
    .select('shopify_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!link) {
    // Lazy match by verified email on first visit.
    const gid = await findCustomerByEmail(user.email).catch(() => null);
    if (!gid) return [];
    await admin.from('shopify_links').insert({ user_id: user.id, shopify_customer_id: gid });
    link = { shopify_customer_id: gid };
  }
  return fetchOrdersForCustomer(link.shopify_customer_id).catch(() => []);
}

export async function getRewardsCatalogue(includeInactive = false): Promise<Reward[]> {
  if (isDemo()) return demo.demoRewards;
  const db = supabaseServer();
  let q = db.from('rewards').select('*').order('sort', { ascending: true });
  if (!includeInactive) q = q.eq('active', true);
  const { data } = await q;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    pointsCost: r.points_cost,
    kind: r.kind,
    valueRands: r.value_rands === null ? null : Number(r.value_rands),
    perkCode: r.perk_code,
    expiryDays: r.expiry_days,
    active: r.active,
    sort: r.sort,
  }));
}

export async function getBalance(user: SessionUser): Promise<number> {
  if (isDemo()) return demo.demoBalance;
  const db = supabaseServer();
  const { data } = await db.rpc('my_points_balance');
  void user;
  return Number(data ?? 0);
}

export async function getRedemptions(user: SessionUser): Promise<Redemption[]> {
  if (isDemo()) return demo.demoRedemptions;
  const db = supabaseServer();
  const { data } = await db
    .from('redemptions')
    .select('id, points_spent, status, shopify_discount_code, expires_at, created_at, rewards(title)')
    .order('created_at', { ascending: false })
    .limit(20);
  void user;
  return (data ?? []).map((r) => {
    const reward = Array.isArray(r.rewards) ? r.rewards[0] : r.rewards;
    return {
      id: r.id,
      rewardTitle: (reward as { title?: string } | null)?.title ?? 'Reward',
      pointsSpent: r.points_spent,
      status: r.status,
      code: r.shopify_discount_code,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    };
  });
}

export async function getGaitSessions(user: SessionUser) {
  if (isDemo()) return demo.demoGaitSessions;
  const db = supabaseServer();
  const { data } = await db
    .from('gait_sessions')
    .select('id, session_date, summary, recommendations, video_url')
    .order('session_date', { ascending: false });
  void user;
  return (data ?? []).map((g) => ({
    id: g.id,
    sessionDate: g.session_date,
    summary: g.summary as Record<string, unknown>,
    recommendations: g.recommendations,
    videoUrl: g.video_url,
  }));
}

// ---------- admin reads (points/aggregate data only — never raw Strava) -----

export async function getAdminCustomers(): Promise<AdminCustomerSummary[]> {
  if (isDemo()) return demo.demoAdminCustomers;
  const db = supabaseServer();
  const { data } = await db.rpc('admin_customer_summaries');
  return (data ?? []).map((c: Record<string, unknown>) => ({
    id: String(c.id),
    email: String(c.email),
    firstName: (c.first_name as string) ?? null,
    lastName: (c.last_name as string) ?? null,
    balance: Number(c.balance),
    lifetimeEarned: Number(c.lifetime_earned),
    lifetimeSpent: Number(c.lifetime_spent),
    stravaLinked: Boolean(c.strava_linked),
    shopifyLinked: Boolean(c.shopify_linked),
    lastActivityAt: (c.last_activity_at as string) ?? null,
    createdAt: String(c.created_at),
  }));
}

export async function getCustomerLedger(customerId: string): Promise<LedgerEntry[]> {
  if (isDemo()) return customerId === demo.demoUser.id ? demo.demoLedger : [];
  const db = supabaseServer(); // RLS: admins can read all ledger rows
  const { data } = await db
    .from('points_ledger')
    .select('id, source, activity_ref, points, reason, created_at')
    .eq('user_id', customerId)
    .order('created_at', { ascending: false })
    .limit(100);
  return mapLedger(data ?? []);
}

export async function getPointsRules(): Promise<PointsRule[]> {
  if (isDemo()) return demo.demoRules;
  const db = supabaseServer();
  const { data } = await db.from('points_rules').select('*').order('key');
  return (data ?? []).map((r) => ({
    id: r.id,
    key: r.key,
    label: r.label,
    category: r.category,
    pointsPerKm: r.points_per_km === null ? null : Number(r.points_per_km),
    pointsPerR100: r.points_per_r100 === null ? null : Number(r.points_per_r100),
    flatPoints: r.flat_points,
    dailyCap: r.daily_cap,
    multiplier: Number(r.multiplier),
    allowManualActivities: r.allow_manual_activities,
    enabled: r.enabled,
    version: r.version,
  }));
}
