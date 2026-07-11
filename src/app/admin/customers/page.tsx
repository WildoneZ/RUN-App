import Link from 'next/link';
import { getAdminCustomers } from '@/lib/data';

export const metadata = { title: 'Customers — RUN Rewards Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? '').toLowerCase().trim();
  const all = await getAdminCustomers();
  const customers = q
    ? all.filter((c) =>
        [c.email, c.firstName ?? '', c.lastName ?? ''].join(' ').toLowerCase().includes(q)
      )
    : all;

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-extrabold">Customers ({all.length})</h1>
        <form className="flex-1 max-w-xs">
          <input
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Search name or email…"
            className="input !min-h-[40px] !py-2 text-sm"
            aria-label="Search customers"
          />
        </form>
      </div>

      <div className="overflow-x-auto rounded-card border border-ink-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-ink-soft text-xs uppercase tracking-wide text-paper/50">
            <tr>
              <th className="px-3 py-2.5">Customer</th>
              <th className="px-3 py-2.5 text-right">Balance</th>
              <th className="px-3 py-2.5 text-right">Earned / Spent</th>
              <th className="px-3 py-2.5">Linked</th>
              <th className="px-3 py-2.5">Last points</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-ink-line hover:bg-ink-soft/60">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/customers/${c.id}`} className="font-semibold text-sky hover:underline">
                    {c.firstName || c.lastName ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() : '—'}
                  </Link>
                  <p className="text-xs text-paper/50">{c.email}</p>
                </td>
                <td className="px-3 py-2.5 text-right font-display font-extrabold tabular-nums">
                  {c.balance.toLocaleString('en-ZA')}
                </td>
                <td className="px-3 py-2.5 text-right text-xs tabular-nums text-paper/60">
                  +{c.lifetimeEarned.toLocaleString('en-ZA')} / −{c.lifetimeSpent.toLocaleString('en-ZA')}
                </td>
                <td className="px-3 py-2.5 text-xs">
                  <span className={c.stravaLinked ? 'text-mint' : 'text-paper/30'}>Strava</span>{' '}
                  <span className={c.shopifyLinked ? 'text-mint' : 'text-paper/30'}>Shop</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-paper/60">
                  {c.lastActivityAt
                    ? new Date(c.lastActivityAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
                    : 'never'}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-paper/50">
                  No customers match “{searchParams.q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
