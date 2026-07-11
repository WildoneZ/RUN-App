'use server';

import { redirect } from 'next/navigation';
import { isDemo } from '@/lib/env';
import { supabaseServer } from '@/lib/supabase/server';

/** Version tag of the consent copy shown to the user (bump when the text changes). */
const CONSENT_TEXT_VERSION = 'popia-2026-07-v1';

export async function saveConsent(formData: FormData): Promise<void> {
  const firstName = String(formData.get('first_name') ?? '').trim();
  const lastName = String(formData.get('last_name') ?? '').trim();
  const marketing = formData.get('marketing_opt_in') === 'on';
  const leaderboard = formData.get('leaderboard_opt_in') === 'on';
  const agreed = formData.get('popia_agree') === 'on';
  if (!agreed) redirect('/onboarding?step=consent&error=consent_required');

  if (!isDemo()) {
    const db = supabaseServer();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) redirect('/welcome');
    const now = new Date().toISOString();
    await db
      .from('profiles')
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        marketing_opt_in: marketing,
        marketing_opt_in_at: marketing ? now : null,
        leaderboard_opt_in: leaderboard,
      })
      .eq('id', user.id);
    await db.from('consents').insert([
      { user_id: user.id, kind: 'popia_data_processing', granted: true, text_version: CONSENT_TEXT_VERSION },
      { user_id: user.id, kind: 'marketing_comms', granted: marketing, text_version: CONSENT_TEXT_VERSION },
      { user_id: user.id, kind: 'leaderboard', granted: leaderboard, text_version: CONSENT_TEXT_VERSION },
    ]);
  }
  redirect('/onboarding?step=strava');
}

export async function completeOnboarding(): Promise<void> {
  if (!isDemo()) {
    const db = supabaseServer();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) redirect('/welcome');
    await db.from('profiles').update({ onboarded_at: new Date().toISOString() }).eq('id', user.id);
  }
  redirect('/home');
}
