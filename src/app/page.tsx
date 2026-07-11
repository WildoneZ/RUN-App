import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  if (!user.onboarded) redirect('/onboarding');
  redirect('/home');
}
