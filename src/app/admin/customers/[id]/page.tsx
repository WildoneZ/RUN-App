import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminCustomers, getCustomerLedger } from '@/lib/data';
import { AdjustPointsForm } from './AdjustPointsForm';

export const metadata = { title: 'Customer — RUN Rewards Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminCustomerDetail({ params }: { params: { id: string } }) {
  const customers = await getAdminCustomers();
  const customer = customers.find((c) => c.id === params.id);
  if (!customer) notFound();
  const ledger = await getCustomerLedger(customer.id);

  return (
    <main className="space-y-5">
      <Link href="/admin/customers" className="text-sm text-sky hover:underline">
        ← All customers
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            {`${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || customer.email}
          </h1>
          <p className="text-sm text-paper/60">{customer.email}</p>
          <p className="mt-1 text-xs text-paper/50">
            Joined {new Date(customer.createdAt).toLocaleDateString('en-ZA')} ·{' '}
            <span className={customer.stravaLinked ? 'text-mint' : 'text-paper/40'}>
              Strava {customer.stravaLinked ? 'linked' : 'not linked'}
            </span>{' '}
            ·{' '}
            <span className={customer.shopifyLinked ? 'text-mint' : 'text-paper/40'}>
              Shopify {customer.shopifyLinked ? 'matched' : 'not matched'}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-4xl font-extrabold text-volt tabular-nums">
            {customer.balance.toLocaleString('en-ZA')}
          </p>
          <p className="text-xs text-paper/50">
            +{customer.lifetimeEarned.toLocaleString('en-ZA')} earned · −
            {customer.lifetimeSpent.toLocaleString('en-ZA')} spent
          </p>
        </div>
      </header>

      <AdjustPointsForm customerId={customer.id} />

      <section>
        <h2 className="mb-2 font-display text-lg font-bold">Points ledger</h2>
        <p className="mb-2 text-xs text-paper/50">
          Append-only. Activity details stay private to the runner — the ledger shows points,
          sources and references only.
        </p>
        <div className="overflow-x-auto rounded-card border border-ink-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-ink-soft text-xs uppercase tracking-wide text-paper/50">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Reference / reason</th>
                <th className="px-3 py-2 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.id} className="border-t border-ink-line">
                  <td className="px-3 py-2 text-xs text-paper/60">
                    {new Date(entry.createdAt).toLocaleDateString('en-ZA', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-2">
                    <span className="chip bg-ink-soft text-paper/70">{entry.source}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-paper/60">
                    {entry.reason ?? entry.activityRef ?? '—'}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-display font-bold tabular-nums ${
                      entry.points >= 0 ? 'text-mint' : 'text-accent'
                    }`}
                  >
                    {entry.points >= 0 ? '+' : ''}
                    {entry.points.toLocaleString('en-ZA')}
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-paper/50">
                    No ledger entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
