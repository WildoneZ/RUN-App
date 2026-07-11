# RUN Rewards

A gamified running loyalty PWA for [RUN](https://runstore.co.za): customers link
Strava once, every run banks points automatically, points become single-use
in-store discount codes via Shopify. Includes a role-gated admin dashboard
(customers, points rules, rewards catalogue, manual adjustments).

Architecture, schema and design rationale: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick start (demo mode — zero keys)

```bash
cd rewards
npm install
npm run dev        # http://localhost:3000
```

With no env configured the app boots in **demo mode**: a fully populated
sample account (runs, purchases, ledger, redemptions), working onboarding flow
and admin dashboard (Settings → "Demo: view as admin"). No external calls are
made and redemptions return a fake code.

## Going live

### 1. Supabase
1. Create a project at supabase.com. Copy the URL + anon key + service-role key
   into `.env.local` (see `.env.example` — every variable is documented there).
2. Apply the schema: `supabase link && supabase db push`, or paste
   `supabase/migrations/0001_init.sql` into the SQL editor. It creates all
   tables, RLS policies, the append-only ledger triggers, and seeds default
   points rules (road 1 pt/km, trail 1.5 pts/km, 30 pts/day cap, 10 pts/R100,
   event 50 pts, gait 150 pts) plus a starter rewards catalogue.
3. Auth → Providers: enable Email (magic links). Auth → URL configuration: set
   your site URL and add `https://<your-domain>/auth/callback` to redirect URLs.
4. Make yourself admin: `update profiles set role = 'admin' where email = 'you@runstore.co.za';`

### 2. Strava developer app
1. https://www.strava.com/settings/api → create an application.
   *Authorization Callback Domain* = your host (e.g. `rewards.runstore.co.za`).
2. Copy client ID/secret into env. The app requests `read,activity:read` only.
3. Create the webhook subscription (after deploying, once):
   ```bash
   curl -X POST https://www.strava.com/api/v3/push_subscriptions \
     -F client_id=$STRAVA_CLIENT_ID \
     -F client_secret=$STRAVA_CLIENT_SECRET \
     -F callback_url=https://<your-domain>/api/strava/webhook \
     -F verify_token=$STRAVA_WEBHOOK_VERIFY_TOKEN
   ```
   Strava GETs the callback URL (handled automatically), then returns an `id` —
   put it in `STRAVA_WEBHOOK_SUBSCRIPTION_ID` and redeploy.
4. Brand assets: download the official kit from
   https://developers.strava.com/guidelines/ and place the "Connect with
   Strava" + "Powered by Strava" SVGs in `public/strava/` (the components in
   `src/components/StravaBrand.tsx` currently render a spec-faithful fallback).

### 3. Shopify custom app
Admin → Settings → Apps and sales channels → Develop apps → Create app.
Admin API scopes: **read_customers, read_orders, write_discounts**.
Install, copy the Admin API access token + your `*.myshopify.com` domain into env.

### 4. Vercel
- Import the repo, set the root directory to `rewards/`, add all env vars
  (service-role key, Strava/Shopify secrets, `CRON_SECRET`, `GAIT_APP_API_KEY`).
- `vercel.json` schedules the crons: Strava token refresh (6-hourly) and
  redemption expiry (daily).

### 5. Gait app bridge
The RUN Analysis app POSTs completed sessions:

```bash
curl -X POST https://<your-domain>/api/gait/ingest \
  -H "Authorization: Bearer $GAIT_APP_API_KEY" -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","session_date":"2026-07-11",
       "summary":{"cadence":172,"footStrike":"midfoot"},
       "recommendations":"Neutral shoe suits your gait."}'
```

Records match a rewards profile by email (linked retroactively at signup) and
award the `gait_analysis` rule's points when a profile exists.

## Testing Phase 1

**Demo review (no keys):** run `npm run dev` and walk:
1. `/welcome` → magic link form (demo: jumps straight to onboarding).
2. Onboarding: consent screen (required box enforced), Strava screen, done.
3. Home: count-up balance, tier progress, weekly km, streak, recent points.
4. Runs: road/trail chips, manual entry shows "0 pts", Powered by Strava mark.
5. Gear: orders with shoes visually distinct.
6. Rewards: claim "R100 off" → confirmation → code + QR appears; wallet shows
   an active code and history.
7. Settings: preferences save, Download my data (JSON), delete-account flow,
   demo admin toggle → admin: customer list/search, detail + ledger + manual
   adjustment validation, rules editor, rewards editor.
8. PWA: Lighthouse → installable; DevTools offline → `/offline` shell. Layouts at 390px.

**Live smoke test (staging keys):**
1. Sign up with a real email → magic link lands, profile row created, consents logged with timestamps.
2. Connect Strava → row in `strava_connections`; record a short GPS run → webhook fires, activity + ledger row appear without opening the app; points = floor(km × rate), capped at 30/day.
3. Edit the run's distance on Strava → correction row converges the total; delete it → reversal row.
4. Manual Strava entry → 0 pts; flip `allow_manual_activities` and re-trigger to see it score.
5. Place a Shopify test order with the same email → order appears in Gear.
6. Redeem a reward → single-use code exists in Shopify admin with correct value/expiry; break the Shopify token and redeem again → points refunded, status `refunded`.
7. POST a gait session (curl above) → appears in customer detail; +150 pts.
8. RLS probe: with a second user's JWT, select from `activities`/`points_ledger` → only own rows return.

## Repository layout

```
rewards/
  src/app/            routes (customer app, /admin, /api)
  src/lib/            env, supabase clients, points engine (pure: points.ts,
                      effectful: strava-sync.ts), strava.ts, shopify.ts,
                      data.ts (read layer w/ demo mode), actions/ (mutations)
  src/components/     Odometer, ProgressBar, TabBar, Strava brand, SW register
  supabase/migrations 0001_init.sql — schema + RLS + seeds
  public/             manifest, service worker, generated icons
  scripts/            make-icons.mjs (zero-dep PNG generator)
```

## Phase status

- **Phase 1 (this code): core loop** — onboarding, home, runs, purchases,
  rewards + redemption, admin (customers/rules/rewards/adjustments). ✅
- Phase 2: challenges, badges/streaks page, opt-in points leaderboard.
- Phase 3: events + RSVP + check-in, notification campaigns, My Gait section.
- Phase 4: analytics dashboard, shoe lifecycle prompts (first-party data only).
