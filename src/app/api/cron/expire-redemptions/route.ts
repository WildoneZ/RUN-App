import { NextResponse, type NextRequest } from 'next/server';
import { required } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/admin';

/** Vercel cron: mark issued discount codes as expired once past their end date. */
export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${required('CRON_SECRET')}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('redemptions')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('status', 'issued')
    .lt('expires_at', new Date().toISOString())
    .select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expired: (data ?? []).length });
}
