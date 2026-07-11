'use server';

import { redirect } from 'next/navigation';
import { appUrl, isDemo } from '@/lib/env';
import { supabaseServer } from '@/lib/supabase/server';

export interface FormState {
  ok: boolean;
  message: string;
}

export async function sendMagicLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: 'That email doesn’t look right — try again?' };
  }
  if (isDemo()) redirect('/onboarding'); // demo: no real email, jump straight in

  const db = supabaseServer();
  const { error } = await db.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${appUrl()}/auth/callback?next=/onboarding` },
  });
  if (error) return { ok: false, message: 'Could not send the link. Please try again in a minute.' };
  return { ok: true, message: 'Check your inbox — your magic link is on its way. 🏃' };
}

export async function signOut(): Promise<void> {
  if (!isDemo()) {
    const db = supabaseServer();
    await db.auth.signOut();
  }
  redirect('/welcome');
}
