import { redirect } from 'next/navigation';
import { getSessionUser, getStravaLinked } from '@/lib/data';
import { completeOnboarding, saveConsent } from '@/lib/actions/onboarding';
import { ConnectWithStravaButton } from '@/components/StravaBrand';

export const metadata = { title: 'Get set — RUN Rewards' };
export const dynamic = 'force-dynamic';

/** Three screens max: consent → Strava → done. Step lives in the URL. */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { step?: string; error?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/welcome');
  const step = searchParams.step ?? 'consent';

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col p-6 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <StepDots step={step} />
      {step === 'consent' && <ConsentStep error={searchParams.error} />}
      {step === 'strava' && <StravaStep error={searchParams.error} />}
      {step === 'done' && <DoneStep stravaLinked={await getStravaLinked(user.id)} />}
    </main>
  );
}

function StepDots({ step }: { step: string }) {
  const idx = step === 'consent' ? 0 : step === 'strava' ? 1 : 2;
  return (
    <div className="mb-6 flex gap-2 pt-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-pill ${i <= idx ? 'bg-accent' : 'bg-ink-line'}`}
        />
      ))}
    </div>
  );
}

function ConsentStep({ error }: { error?: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="font-display text-3xl font-extrabold">First, the honest bit.</h1>
      <p className="mt-2 text-paper/70">
        POPIA gives you control of your information — here’s exactly what we do with it.
      </p>

      <div className="card mt-5 space-y-3 text-sm leading-relaxed text-paper/85">
        <p>
          <strong className="text-paper">What we collect:</strong> your purchases at RUN, the
          runs you choose to share from Strava (distance, time and type — only ever visible to
          you), and your in-store gait analysis results.
        </p>
        <p>
          <strong className="text-paper">What it’s for:</strong> turning your running and
          shopping into points, personalising shoe advice, and nothing else. We never sell your
          data, and your Strava activities are never shown to other customers.
        </p>
        <p>
          <strong className="text-paper">Your rights:</strong> download everything we hold about
          you, or delete your account entirely, any time from Settings.
        </p>
      </div>

      {error === 'consent_required' && (
        <p className="mt-3 rounded-xl bg-accent/15 p-3 text-sm text-accent-glow">
          We need your consent to run the programme — tick the first box to continue.
        </p>
      )}

      <form action={saveConsent} className="mt-5 flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="first_name">First name</label>
            <input id="first_name" name="first_name" className="input" autoComplete="given-name" required />
          </div>
          <div>
            <label className="label" htmlFor="last_name">Last name</label>
            <input id="last_name" name="last_name" className="input" autoComplete="family-name" required />
          </div>
        </div>

        <label className="flex min-h-[44px] items-start gap-3 text-sm">
          <input type="checkbox" name="popia_agree" className="mt-1 h-5 w-5 accent-[#ff5a3c]" />
          <span>
            I agree to RUN processing my purchases, shared running activity and gait analysis
            results to run the rewards programme. <span className="text-paper/50">(required)</span>
          </span>
        </label>
        <label className="flex min-h-[44px] items-start gap-3 text-sm">
          <input type="checkbox" name="marketing_opt_in" className="mt-1 h-5 w-5 accent-[#ff5a3c]" />
          <span>
            Send me useful running stuff — new challenges, events and offers.{' '}
            <span className="text-paper/50">(optional, unsubscribe anytime)</span>
          </span>
        </label>
        <label className="flex min-h-[44px] items-start gap-3 text-sm">
          <input type="checkbox" name="leaderboard_opt_in" className="mt-1 h-5 w-5 accent-[#ff5a3c]" />
          <span>
            Show me on the monthly points leaderboard as “FirstName L.” — points only, never
            your runs. <span className="text-paper/50">(optional)</span>
          </span>
        </label>

        <div className="mt-auto pb-6">
          <button type="submit" className="btn-primary w-full">Sounds fair — let’s go</button>
        </div>
      </form>
    </div>
  );
}

function StravaStep({ error }: { error?: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="font-display text-3xl font-extrabold">Now, make it automatic.</h1>
      <p className="mt-2 text-paper/70">
        Link Strava once and every run banks points on its own — no check-ins, no screenshots,
        no admin. You run, we count.
      </p>
      <div className="card mt-6 space-y-2 text-sm text-paper/85">
        <p>🔒 Your activities stay yours: only you can see them in this app.</p>
        <p>🧮 We read distance, time and run type — just enough to score points.</p>
        <p>🙅 We never post to your Strava, ever.</p>
      </div>
      {error && (
        <p className="mt-4 rounded-xl bg-accent/15 p-3 text-sm text-accent-glow">
          {error === 'denied'
            ? 'No stress — you can connect later from Settings. Points from runs need Strava though!'
            : 'That didn’t work. Give it another go?'}
        </p>
      )}
      <div className="mt-auto space-y-3 pb-6">
        <div className="flex justify-center">
          <ConnectWithStravaButton href="/api/strava/authorize" />
        </div>
        <form action={completeOnboarding}>
          <button type="submit" className="btn-ghost w-full">
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}

function DoneStep({ stravaLinked }: { stravaLinked: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <div className="text-7xl" aria-hidden>
        🎉
      </div>
      <h1 className="font-display text-4xl font-extrabold">You’re in!</h1>
      <p className="max-w-xs text-paper/70">
        {stravaLinked
          ? 'Strava is connected. Your next run earns points before you’ve even stretched.'
          : 'You can connect Strava anytime from Settings to start earning on your runs.'}
      </p>
      <form action={completeOnboarding}>
        <button type="submit" className="btn-primary">
          Show me my points
        </button>
      </form>
    </div>
  );
}
