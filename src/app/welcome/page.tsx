import { MagicLinkForm } from './MagicLinkForm';

export const metadata = { title: 'Welcome — RUN Rewards' };
export const dynamic = 'force-dynamic';

export default function WelcomePage({
  searchParams,
}: {
  searchParams: { deleted?: string; error?: string };
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between p-6 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <header className="pt-10">
        <p className="font-display text-sm font-bold tracking-[0.3em] text-accent">RUN REWARDS</p>
        <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.05]">
          Every km
          <br />
          counts.
          <br />
          <span className="text-accent">Literally.</span>
        </h1>
        <p className="mt-5 max-w-xs text-lg text-paper/70">
          Run anywhere, earn points automatically, and spend them on real gear at RUN.
          Good people run — good runners get rewarded.
        </p>
      </header>

      <section className="pb-8">
        {searchParams.deleted && (
          <p className="mb-4 rounded-xl bg-ink-card p-3 text-sm text-paper/80">
            Your account has been deleted. Thanks for running with us. 👋
          </p>
        )}
        {searchParams.error && (
          <p className="mb-4 rounded-xl bg-accent/20 p-3 text-sm">
            That sign-in link didn’t work — it may have expired. Request a fresh one below.
          </p>
        )}
        <MagicLinkForm />
        <p className="mt-4 text-center text-xs text-paper/40">
          No passwords. We email you a magic link — tap it and you’re in.
        </p>
      </section>
    </main>
  );
}
