import { redirect } from 'next/navigation';
import { getHomeData, getSessionUser } from '@/lib/data';
import { Odometer } from '@/components/Odometer';
import { ProgressBar } from '@/components/ProgressBar';
import type { LedgerEntry } from '@/lib/types';

export const metadata = { title: 'Home — RUN Rewards' };
export const dynamic = 'force-dynamic';

const SOURCE_META: Record<LedgerEntry['source'], { icon: string; label: string }> = {
  run: { icon: '👟', label: 'Run' },
  purchase: { icon: '🛍️', label: 'Purchase' },
  event: { icon: '📅', label: 'Event' },
  gait: { icon: '🎥', label: 'Gait analysis' },
  challenge_bonus: { icon: '⚡', label: 'Challenge bonus' },
  adjustment: { icon: '💝', label: 'From the RUN team' },
  redemption: { icon: '🎁', label: 'Reward redeemed' },
  redemption_refund: { icon: '↩️', label: 'Points refunded' },
};

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  const data = await getHomeData(user);
  const toNext = data.nextReward ? Math.max(0, data.nextReward.pointsCost - data.balance) : 0;

  return (
    <main className="space-y-5 px-4 pt-4">
      <header className="flex items-baseline justify-between">
        <h1 className="font-display text-xl font-bold">
          Hey {user.firstName ?? 'runner'} 👋
        </h1>
        <p className="text-xs font-bold tracking-[0.2em] text-paper/40">RUN REWARDS</p>
      </header>

      {/* The hero number — opening the app should feel like a game, not a bank */}
      <section className="card relative overflow-hidden bg-gradient-to-br from-ink-card to-ink-soft py-8 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-paper/50">Your points</p>
        <p className="mt-1 font-display text-7xl font-extrabold tabular-nums text-white">
          <Odometer value={data.balance} />
        </p>
        {data.nextReward && (
          <div className="mx-auto mt-5 max-w-xs space-y-2">
            <ProgressBar
              fraction={data.balance / data.nextReward.pointsCost}
              label={`Progress to ${data.nextReward.title}`}
            />
            <p className="text-sm text-paper/70">
              {toNext === 0 ? (
                <>
                  <span className="font-bold text-mint">Ready!</span> You can claim{' '}
                  <span className="font-bold text-paper">{data.nextReward.title}</span> 🎉
                </>
              ) : (
                <>
                  <span className="font-bold text-volt">{toNext.toLocaleString('en-ZA')} pts</span>{' '}
                  to {data.nextReward.title}
                </>
              )}
            </p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="font-display text-3xl font-extrabold text-sky">
            {data.weekKm.toFixed(1)}
            <span className="text-base font-bold text-paper/50"> km</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-paper/60">
            this week · {data.weekRuns} {data.weekRuns === 1 ? 'run' : 'runs'}
          </p>
        </div>
        <div className="card relative text-center">
          <p className="font-display text-3xl font-extrabold text-volt">
            {data.streakWeeks}
            <span className="text-base font-bold text-paper/50"> wk</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-paper/60">
            {data.streakWeeks > 0 ? '🔥 running streak' : 'start your streak!'}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-display text-lg font-bold">Latest points</h2>
        <ul className="space-y-2">
          {data.recentLedger.map((entry) => {
            const meta = SOURCE_META[entry.source];
            return (
              <li key={entry.id} className="card flex items-center gap-3 py-3">
                <span className="text-2xl" aria-hidden>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry.reason ?? meta.label}</p>
                  <p className="text-xs text-paper/50">
                    {new Date(entry.createdAt).toLocaleDateString('en-ZA', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <span
                  className={`font-display text-lg font-extrabold tabular-nums ${
                    entry.points >= 0 ? 'text-mint' : 'text-accent'
                  }`}
                >
                  {entry.points >= 0 ? '+' : ''}
                  {entry.points.toLocaleString('en-ZA')}
                </span>
              </li>
            );
          })}
          {data.recentLedger.length === 0 && (
            <li className="card py-6 text-center text-sm text-paper/60">
              No points yet — your first run changes that. 🏃
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
