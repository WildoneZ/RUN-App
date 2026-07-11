import { redirect } from 'next/navigation';
import { getPurchases, getSessionUser } from '@/lib/data';

export const metadata = { title: 'My Gear — RUN Rewards' };
export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  const purchases = await getPurchases(user);

  return (
    <main className="space-y-4 px-4 pt-4">
      <h1 className="font-display text-2xl font-extrabold">My Gear</h1>
      <p className="-mt-2 text-sm text-paper/60">
        Everything you’ve bought at RUN — shoe purchases power your future replacement nudges.
      </p>

      <ul className="space-y-3">
        {purchases.map((order) => (
          <li key={order.id} className="card space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-bold text-paper/50">
                {order.orderNumber} ·{' '}
                {new Date(order.processedAt).toLocaleDateString('en-ZA', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="font-display font-extrabold">
                R{order.totalRands.toLocaleString('en-ZA')}
              </p>
            </div>
            <ul className="space-y-2">
              {order.items.map((item, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-3 rounded-xl p-2.5 ${
                    item.isShoe ? 'bg-accent/10 ring-1 ring-accent/30' : 'bg-ink-soft'
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {item.isShoe ? '👟' : '🎽'}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {item.title}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-paper/50">×{item.quantity}</span>
                  )}
                  {item.isShoe && <span className="chip bg-accent/20 text-accent-glow">Shoes</span>}
                </li>
              ))}
            </ul>
          </li>
        ))}
        {purchases.length === 0 && (
          <li className="card py-8 text-center text-sm text-paper/60">
            No purchases linked yet. Shop at RUN with the email you signed up with and your
            orders (and their points!) show up here.
          </li>
        )}
      </ul>
    </main>
  );
}
