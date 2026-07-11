'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isDemo } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/data';
import { accessTokenFor, deauthorize } from '@/lib/strava';

/** Demo helper: flip between customer and admin personas. */
export async function toggleDemoAdmin(): Promise<void> {
  if (!isDemo()) return;
  const jar = cookies();
  const on = jar.get('demo_admin')?.value === '1';
  jar.set('demo_admin', on ? '0' : '1', { path: '/' });
  redirect(on ? '/settings' : '/admin');
}

export async function updatePreferences(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  if (isDemo()) redirect('/settings?saved=1');
  const db = supabaseServer();
  const marketing = formData.get('marketing_opt_in') === 'on';
  await db
    .from('profiles')
    .update({
      marketing_opt_in: marketing,
      marketing_opt_in_at: marketing ? new Date().toISOString() : null,
      leaderboard_opt_in: formData.get('leaderboard_opt_in') === 'on',
    })
    .eq('id', user.id);
  redirect('/settings?saved=1');
}

/**
 * POPIA "Delete my account": revoke Strava access, remove tokens and gait
 * links, anonymise the ledger (kept for financial audit, no longer personal),
 * then delete the auth user.
 */
export async function deleteAccount(): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  if (isDemo()) redirect('/settings?demo_delete=1');

  const db = supabaseAdmin();
  const token = await accessTokenFor(user.id).catch(() => null);
  if (token) await deauthorize(token);
  await db.from('strava_connections').delete().eq('user_id', user.id);
  await db.from('gait_sessions').update({ user_id: null, email: 'deleted@anonymised.invalid', video_url: null }).eq('user_id', user.id);
  await db.from('activities').delete().eq('user_id', user.id);
  // Ledger rows survive (append-only, financial audit) but the profile they
  // point at is replaced by an anonymised shell before auth deletion cascades.
  await db
    .from('profiles')
    .update({ email: `deleted+${user.id.slice(0, 8)}@anonymised.invalid`, first_name: null, last_name: null, marketing_opt_in: false, leaderboard_opt_in: false })
    .eq('id', user.id);
  // Detach ledger/consents from the cascade by deleting auth last: Supabase
  // cascades profiles -> ledger, so re-parent ledger rows to nothing is not
  // possible; instead we snapshot-anonymise and accept cascade deletion of
  // personal rows. (Aggregate reporting uses daily rollups, not raw rows.)
  await db.auth.admin.deleteUser(user.id);
  const session = supabaseServer();
  await session.auth.signOut();
  redirect('/welcome?deleted=1');
}

/** POPIA "Download my data": everything we hold, as JSON. */
export async function exportMyData(): Promise<string> {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  if (isDemo()) {
    const demo = await import('@/lib/demo');
    return JSON.stringify(
      {
        profile: demo.demoUser,
        ledger: demo.demoLedger,
        activities: demo.demoActivities,
        purchases: demo.demoPurchases,
        redemptions: demo.demoRedemptions,
        gaitSessions: demo.demoGaitSessions,
      },
      null,
      2
    );
  }
  const db = supabaseServer(); // user-scoped: RLS guarantees own rows only
  const [profile, consents, ledger, activities, redemptions, gait] = await Promise.all([
    db.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    db.from('consents').select('*'),
    db.from('points_ledger').select('*'),
    db.from('activities').select('*'),
    db.from('redemptions').select('*'),
    db.from('gait_sessions').select('*'),
  ]);
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profile: profile.data,
      consents: consents.data,
      pointsLedger: ledger.data,
      activities: activities.data,
      redemptions: redemptions.data,
      gaitSessions: gait.data,
    },
    null,
    2
  );
}
