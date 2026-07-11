'use server';

import { revalidatePath } from 'next/cache';
import { isDemo } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/data';
import { createSingleUseDiscount, shopifyConfigured } from '@/lib/shopify';

export interface RedeemResult {
  ok: boolean;
  message: string;
  code?: string;
  expiresAt?: string;
}

/**
 * Redemption is the one place points are spent. Order of operations:
 *  1. verify balance (derived from the ledger, server-side)
 *  2. create a pending redemption + the negative ledger row
 *  3. call Shopify to mint a unique single-use code
 *  4a. success -> mark issued, attach code
 *  4b. failure -> append a compensating refund row and mark refunded
 * The ledger is append-only throughout: no row is ever edited or removed.
 */
export async function redeemReward(rewardId: string): Promise<RedeemResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: 'Please sign in again.' };

  if (isDemo()) {
    return {
      ok: true,
      message: 'Demo redemption — in live mode this mints a real Shopify code.',
      code: 'RUN-DEMO4YOU',
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
  }

  const db = supabaseAdmin();
  const { data: reward } = await db
    .from('rewards')
    .select('id, title, points_cost, kind, value_rands, perk_code, expiry_days, active')
    .eq('id', rewardId)
    .maybeSingle();
  if (!reward || !reward.active) return { ok: false, message: 'That reward is no longer available.' };

  const { data: balance } = await db.rpc('points_balance', { p_user: user.id });
  if (Number(balance ?? 0) < reward.points_cost) {
    return { ok: false, message: 'Not enough points yet — keep running!' };
  }

  const { data: redemption, error: rErr } = await db
    .from('redemptions')
    .insert({ user_id: user.id, reward_id: reward.id, points_spent: reward.points_cost })
    .select('id')
    .single();
  if (rErr || !redemption) return { ok: false, message: 'Something went wrong. No points were taken.' };

  const activityRef = `redemption:${redemption.id}`;
  const { error: lErr } = await db.from('points_ledger').insert({
    user_id: user.id,
    source: 'redemption',
    activity_ref: activityRef,
    points: -reward.points_cost,
    reason: reward.title,
  });
  if (lErr) {
    await db.from('redemptions').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', redemption.id);
    return { ok: false, message: 'Something went wrong. No points were taken.' };
  }

  const refund = async (why: string) => {
    await db.from('points_ledger').insert({
      user_id: user.id,
      source: 'redemption_refund',
      activity_ref: activityRef,
      points: reward.points_cost,
      reason: why,
    });
    await db
      .from('redemptions')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', redemption.id);
  };

  try {
    if (reward.kind === 'perk') {
      // Perks are fulfilled in store: issue an internal voucher reference.
      const code = `RUN-${(reward.perk_code ?? 'PERK').toUpperCase().slice(0, 6)}-${redemption.id.slice(0, 6).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + reward.expiry_days * 86400000).toISOString();
      await db
        .from('redemptions')
        .update({ status: 'issued', shopify_discount_code: code, expires_at: expiresAt, updated_at: new Date().toISOString() })
        .eq('id', redemption.id);
      revalidatePath('/rewards');
      return { ok: true, message: 'Perk unlocked! Show this code in store.', code, expiresAt };
    }

    if (!shopifyConfigured()) {
      await refund('Shopify not configured');
      return { ok: false, message: 'Redemptions aren’t live yet — your points were not spent.' };
    }
    const { data: link } = await db
      .from('shopify_links')
      .select('shopify_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const issued = await createSingleUseDiscount({
      kind: reward.kind,
      valueRands: Number(reward.value_rands ?? 0),
      expiryDays: reward.expiry_days,
      shopifyCustomerGid: link?.shopify_customer_id ?? null,
    });
    await db
      .from('redemptions')
      .update({
        status: 'issued',
        shopify_discount_code: issued.code,
        shopify_discount_gid: issued.gid,
        expires_at: issued.endsAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', redemption.id);
    revalidatePath('/rewards');
    return { ok: true, message: 'Reward unlocked! Show this code at the till.', code: issued.code, expiresAt: issued.endsAt };
  } catch (err) {
    console.error('redeemReward: code generation failed', err);
    await refund('Shopify code generation failed — points refunded');
    return {
      ok: false,
      message: 'We couldn’t generate your code, so your points have been refunded. Please try again.',
    };
  }
}
