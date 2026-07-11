import { redirect } from 'next/navigation';
import { getActivities, getSessionUser, getStravaLinked } from '@/lib/data';
import { ConnectWithStravaButton, PoweredByStrava } from '@/components/StravaBrand';

export const metadata = { title: 'My Runs — RUN Rewards' };
export const dynamic = 'force-dynamic';

function fmtPace(distanceM: number, movingTimeS: number): string {
  if (distanceM <= 0) return '—';
  const secPerKm = movingTimeS / (distanceM / 1000);
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')} /km`;
}

export default async function RunsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  const [activities, linked] = await Promise.all([getActivities(user), getStravaLinked(user.id)]);

  return (
    <main className="space-y-4 px-4 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">My Runs</h1>
        <PoweredByStrava />
      </header>

      {!linked && (
        <section className="card space-y-3 text-center">
          <p className="text-3xl" aria-hidden>👟</p>
          <p className="text-sm text-paper/75">
            Connect Strava and every run earns points automatically — nothing to log, nothing
            to remember.
          </p>
          <div className="flex justify-center">
            <ConnectWithStravaButton href="/api/strava/authorize" />
          </div>
        </section>
      )}

      <ul className="space-y-2">
        {activities.map((a) => (
          <li key={a.id} className="card py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{a.name ?? 'Run'}</p>
                <p className="mt-0.5 text-xs text-paper/50">
                  {new Date(a.startedAt).toLocaleDateString('en-ZA', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  · {(a.distanceM / 1000).toFixed(2)} km · {fmtPace(a.distanceM, a.movingTimeS)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-display text-lg font-extrabold tabular-nums ${
                    a.pointsAwarded > 0 ? 'text-mint' : 'text-paper/40'
                  }`}
                >
                  +{a.pointsAwarded}
                </p>
                <p className="text-[10px] font-bold uppercase text-paper/40">pts</p>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <span
                className={`chip ${
                  a.category === 'trail' ? 'bg-mint/15 text-mint' : 'bg-sky/15 text-sky'
                }`}
              >
                {a.category === 'trail' ? '⛰️ Trail' : '🛣️ Road'}
              </span>
              {a.isManual && (
                <span className="chip bg-volt/15 text-volt" title="Manual entries don’t earn points">
                  ✍️ Manual · 0 pts
                </span>
              )}
            </div>
          </li>
        ))}
        {activities.length === 0 && linked && (
          <li className="card py-8 text-center text-sm text-paper/60">
            No runs yet — lace up! Your next Strava activity will appear here on its own.
          </li>
        )}
      </ul>
    </main>
  );
}
