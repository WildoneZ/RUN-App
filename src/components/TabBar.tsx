'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/runs', label: 'Runs', icon: '👟' },
  { href: '/rewards', label: 'Rewards', icon: '🎁' },
  { href: '/purchases', label: 'Gear', icon: '🛍️' },
  { href: '/settings', label: 'You', icon: '😊' },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-md justify-around">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${
                active ? 'text-accent' : 'text-paper/50'
              }`}
            >
              <span className="text-xl" aria-hidden>
                {tab.icon}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
