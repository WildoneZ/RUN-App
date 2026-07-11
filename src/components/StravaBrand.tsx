/**
 * Strava brand components. Strava's guidelines require their official assets
 * for "Connect with Strava" buttons and "Powered by Strava" logos:
 * download the brand kit at https://developers.strava.com/guidelines/ and
 * drop the SVGs into public/strava/ (see README). Until those files exist we
 * render a spec-faithful fallback (Strava orange #FC5200, exact wording).
 */

export function ConnectWithStravaButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[48px] items-center justify-center rounded-md px-6 font-bold text-white"
      style={{ backgroundColor: '#FC5200' }}
    >
      Connect with Strava
    </a>
  );
}

export function PoweredByStrava() {
  return (
    <p className="text-right text-[11px] font-bold tracking-wide" style={{ color: '#FC5200' }}>
      POWERED BY STRAVA
    </p>
  );
}
