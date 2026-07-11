import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/data';

export const dynamic = 'force-dynamic';

/** Role gate: server-side check on every admin request (RLS backs it up). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  if (user.role !== 'admin') redirect('/home');

  const nav = [
    { href: '/admin/customers', label: 'Customers' },
    { href: '/admin/rules', label: 'Points rules' },
    { href: '/admin/rewards', label: 'Rewards' },
  ];

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 pb-16 pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-line pb-3">
        <Link href="/admin" className="font-display text-lg font-extrabold">
          RUN Rewards <span className="text-accent">Admin</span>
        </Link>
        <nav className="flex gap-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="btn-ghost !min-h-[36px] !px-3 !py-1 text-xs">
              {item.label}
            </Link>
          ))}
          <Link href="/home" className="btn-ghost !min-h-[36px] !px-3 !py-1 text-xs text-paper/50">
            ← App
          </Link>
        </nav>
      </header>
      <div className="pt-5">{children}</div>
    </div>
  );
}
