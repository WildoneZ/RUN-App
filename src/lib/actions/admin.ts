'use server';

import { revalidatePath } from 'next/cache';
import { isDemo } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/data';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') throw new Error('admin only');
  return user;
}

export async function updatePointsRule(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (isDemo()) {
    revalidatePath('/admin/rules');
    return; // demo: pretend-save so the flow is reviewable
  }
  const id = String(formData.get('id'));
  const num = (name: string): number | null => {
    const v = String(formData.get(name) ?? '').trim();
    return v === '' ? null : Number(v);
  };
  const db = supabaseAdmin();
  const { data: current } = await db.from('points_rules').select('version').eq('id', id).single();
  await db
    .from('points_rules')
    .update({
      points_per_km: num('points_per_km'),
      points_per_r100: num('points_per_r100'),
      flat_points: num('flat_points'),
      daily_cap: num('daily_cap'),
      multiplier: num('multiplier') ?? 1,
      allow_manual_activities: formData.get('allow_manual_activities') === 'on',
      enabled: formData.get('enabled') === 'on',
      version: (current?.version ?? 0) + 1,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    })
    .eq('id', id);
  revalidatePath('/admin/rules');
}

export async function upsertReward(formData: FormData): Promise<void> {
  await requireAdmin();
  if (isDemo()) {
    revalidatePath('/admin/rewards');
    return;
  }
  const id = String(formData.get('id') ?? '');
  const kind = String(formData.get('kind'));
  const row = {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    points_cost: Number(formData.get('points_cost')),
    kind,
    value_rands: kind === 'perk' ? null : Number(formData.get('value_rands') || 0),
    perk_code: kind === 'perk' ? String(formData.get('perk_code') ?? '').trim() || null : null,
    expiry_days: Number(formData.get('expiry_days') || 30),
    active: formData.get('active') === 'on',
    sort: Number(formData.get('sort') || 0),
  };
  if (!row.title || !row.points_cost || row.points_cost <= 0) return;
  const db = supabaseAdmin();
  if (id) await db.from('rewards').update(row).eq('id', id);
  else await db.from('rewards').insert(row);
  revalidatePath('/admin/rewards');
  revalidatePath('/rewards');
}

export interface AdjustState {
  ok: boolean;
  message: string;
}

/** Manual goodwill/fix adjustments: always a fresh ledger row with a reason. */
export async function adjustPoints(_prev: AdjustState, formData: FormData): Promise<AdjustState> {
  const admin = await requireAdmin();
  const customerId = String(formData.get('customer_id'));
  const points = Math.trunc(Number(formData.get('points')));
  const reason = String(formData.get('reason') ?? '').trim();
  if (!points || Number.isNaN(points)) return { ok: false, message: 'Enter a non-zero points amount.' };
  if (reason.length < 5) return { ok: false, message: 'A reason is required (min 5 characters).' };

  if (isDemo()) {
    return { ok: true, message: `Demo: would adjust by ${points} pts — "${reason}"` };
  }
  const db = supabaseAdmin();
  const { error } = await db.from('points_ledger').insert({
    user_id: customerId,
    source: 'adjustment',
    points,
    reason,
    created_by: admin.id,
  });
  if (error) return { ok: false, message: 'Adjustment failed — see server logs.' };
  revalidatePath(`/admin/customers/${customerId}`);
  return { ok: true, message: `Adjusted by ${points > 0 ? '+' : ''}${points} pts.` };
}
