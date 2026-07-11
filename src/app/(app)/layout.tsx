import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/data';
import { TabBar } from '@/components/TabBar';
import { isDemo } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-24 pt-[max(env(safe-area-inset-top),0.5rem)]">
      {isDemo() && (
        <p className="mx-4 mt-2 rounded-pill bg-sky/15 px-3 py-1 text-center text-[11px] font-bold text-sky">
          DEMO MODE — sample data, no live keys needed
        </p>
      )}
      {children}
      <TabBar />
    </div>
  );
}
