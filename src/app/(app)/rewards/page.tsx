import { redirect } from 'next/navigation';
import { getBalance, getRedemptions, getRewardsCatalogue, getSessionUser } from '@/lib/data';
import { RewardCard } from './RewardCard';
import { CodeCard } from './CodeCard';

export const metadata = { title: 'Rewards — RUN Rewards' };
export const dynamic = 'force-dynamic';

export default async function RewardsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  const [balance, catalogue, redemptions] = await Promise.all([
    getBalance(user),
    getRewardsCatalogue(),
    getRedemptions(user),
  ]);
  const activeCodes = redemptions.filter((r) => r.status === 'issued');
  const history = redemptions.filter((r) => r.status !== 'issued');

  return (
    <main className="space-y-5 px-4 pt-4">
      <header className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-extrabold">Rewards</h1>
        <p className="font-display text-lg font-extrabold text-volt">
          {balance.toLocaleString('en-ZA')} pts
        </p>
      </header>

      {activeCodes.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">Ready to use in store</h2>
          {activeCodes.map((r) => (
            <CodeCard
              key={r.id}
              code={r.code ?? ''}
              title={r.rewardTitle}
              expiresAt={r.expiresAt}
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Spend your points</h2>
        {catalogue.map((reward) => (
          <RewardCard key={reward.id} reward={reward} balance={balance} />
        ))}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-lg font-bold">History</h2>
          <ul className="space-y-2">
            {history.map((r) => (
              <li key={r.id} className="card flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold">{r.rewardTitle}</p>
                  <p className="text-xs text-paper/50">
                    {new Date(r.createdAt).toLocaleDateString('en-ZA')} · {r.status}
                  </p>
                </div>
                <span className="font-display font-bold text-paper/60">
                  −{r.pointsSpent.toLocaleString('en-ZA')} pts
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
