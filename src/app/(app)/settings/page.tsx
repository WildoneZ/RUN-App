import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, getStravaLinked } from '@/lib/data';
import { signOut } from '@/lib/actions/auth';
import { deleteAccount, toggleDemoAdmin, updatePreferences } from '@/lib/actions/account';
import { ConnectWithStravaButton } from '@/components/StravaBrand';
import { isDemo } from '@/lib/env';
import { DeleteAccountButton } from './DeleteAccountButton';

export const metadata = { title: 'You — RUN Rewards' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string; demo_delete?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  const stravaLinked = await getStravaLinked(user.id);

  return (
    <main className="space-y-5 px-4 pt-4">
      <header>
        <h1 className="font-display text-2xl font-extrabold">
          {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'You'}
        </h1>
        <p className="text-sm text-paper/60">{user.email}</p>
      </header>

      {searchParams.saved && (
        <p className="rounded-xl bg-mint/15 p-3 text-sm text-mint">Preferences saved ✓</p>
      )}
      {searchParams.demo_delete && (
        <p className="rounded-xl bg-sky/15 p-3 text-sm text-sky">
          Demo mode: in live mode this permanently deletes the account, revokes Strava access
          and anonymises your data.
        </p>
      )}

      <section className="card space-y-3">
        <h2 className="font-display font-bold">Connections</h2>
        <div className="flex items-center justify-between text-sm">
          <span>Strava</span>
          {stravaLinked ? (
            <span className="chip bg-mint/15 text-mint">Connected ✓</span>
          ) : (
            <ConnectWithStravaButton href="/api/strava/authorize" />
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>RUN store account</span>
          <span className="chip bg-mint/15 text-mint">Matched by email ✓</span>
        </div>
      </section>

      <form action={updatePreferences} className="card space-y-3">
        <h2 className="font-display font-bold">Preferences</h2>
        <label className="flex min-h-[44px] items-center justify-between gap-3 text-sm">
          <span>Running tips, challenges &amp; offers</span>
          <input
            type="checkbox"
            name="marketing_opt_in"
            defaultChecked={user.marketingOptIn}
            className="h-6 w-6 accent-[#ff5a3c]"
          />
        </label>
        <label className="flex min-h-[44px] items-center justify-between gap-3 text-sm">
          <span>Show me on the points leaderboard</span>
          <input
            type="checkbox"
            name="leaderboard_opt_in"
            defaultChecked={user.leaderboardOptIn}
            className="h-6 w-6 accent-[#ff5a3c]"
          />
        </label>
        <button type="submit" className="btn-ghost w-full !py-2 text-sm">
          Save preferences
        </button>
      </form>

      <section className="card space-y-3">
        <h2 className="font-display font-bold">Your data (POPIA)</h2>
        <a href="/api/me/export" className="btn-ghost w-full !py-2 text-sm" download>
          ⬇️ Download my data (JSON)
        </a>
        <DeleteAccountButton action={deleteAccount} />
      </section>

      {user.role === 'admin' && (
        <Link href="/admin" className="btn-ghost w-full">
          🛠️ Open admin dashboard
        </Link>
      )}

      {isDemo() && (
        <form action={toggleDemoAdmin}>
          <button type="submit" className="btn-ghost w-full !py-2 text-sm">
            {user.role === 'admin' ? 'Switch to customer view' : '🛠️ Demo: view as admin'}
          </button>
        </form>
      )}

      <form action={signOut}>
        <button type="submit" className="w-full py-3 text-center text-sm font-semibold text-paper/50">
          Sign out
        </button>
      </form>
    </main>
  );
}
