# RUN Rewards — Architecture & Design

This is the plan presented for approval, kept in-repo as living documentation.
Phase 1 is implemented; Phases 2–4 build on the same schema without breaking changes.

## 1. System overview

```
┌─────────────┐   OAuth + webhooks   ┌──────────────────────────────┐
│   Strava    │ ───────────────────▶ │  Next.js (Vercel)            │
└─────────────┘                      │  · App Router UI (PWA)       │
┌─────────────┐   Admin GraphQL      │  · API routes (webhooks,     │
│   Shopify   │ ◀──────────────────▶ │    OAuth, gait ingest, cron) │
└─────────────┘                      │  · Server actions (redeem,   │
┌─────────────┐   POST /api/gait/    │    consent, admin edits)     │
│ RUN Analysis│ ───── ingest ──────▶ └──────────────┬───────────────┘
│  (gait app) │        (API key)                    │ service-role (writes)
└─────────────┘                                     │ anon+JWT (reads, RLS)
                                     ┌──────────────▼───────────────┐
                                     │  Supabase (Postgres + Auth)  │
                                     │  RLS on every user table     │
                                     └──────────────────────────────┘
```

**One identity, many sources.** `profiles` (1:1 with Supabase Auth users) is the
spine. `strava_connections`, `shopify_links` and `gait_sessions` hang off it,
each matched by OAuth or verified email. The gait app never shares a database
with us — it POSTs to `/api/gait/ingest` with a bearer API key.

**Server-side ledger.** `points_ledger` is append-only (enforced by triggers +
absence of RLS write policies). Balances are `sum(points)` — computed, never
stored. Every correction (activity edited/deleted on Strava, failed redemption)
is a *new compensating row*, so the history is a complete audit trail.

**Configurable rules.** `points_rules` holds the formulas (pts/km, pts/R100,
flat points, daily caps, multipliers, manual-entry toggle). Saving a rule bumps
its `version`; ledger rows record which version scored them.

**Seamless sync.** A Strava webhook subscription delivers create/update/delete
events. Handlers re-fetch the activity with the athlete's own token (events are
hints, not trusted data), score it, and write delta rows. Token refresh happens
lazily on use plus proactively via cron. Dedupe: unique key per event in
`webhook_events`.

### Strava compliance decisions
- Activities are visible **only to their owner** (RLS: `auth.uid() = user_id`,
  and no admin policy on `activities`). Admin screens see points aggregates only.
- Leaderboards (Phase 2) read the ledger, never activities.
- No Strava data enters any ML/predictive feature. Shoe-lifecycle estimates
  (Phase 4) use purchase dates + points-earning rate (our derived currency).
- Manual entries score 0 by default (`allow_manual_activities` toggle).
- Non-running sport types are ignored; road vs trail from `sport_type`
  (`TrailRun` → trail; `Run`/`VirtualRun` → road).
- Connect screen uses Strava's "Connect with Strava" button; activity views
  carry "Powered by Strava" (drop official SVGs into `public/strava/`).

### Redemption flow (failure-safe)
1. Verify balance from ledger → 2. insert `redemptions` row (pending) + negative
ledger row → 3. mint single-use Shopify code (`discountCodeBasicCreate`,
usageLimit 1, customer-scoped, endsAt) → 4a. mark issued + show code/QR, or
4b. on any failure append a refund row and mark refunded. Points can never be
lost to a Shopify outage.

## 2. Database schema (see supabase/migrations/0001_init.sql)

| table | purpose | key RLS |
|---|---|---|
| profiles | identity spine, role, opt-ins | own-row read/update; role change blocked |
| consents | POPIA consent log w/ timestamps + text version | own-row |
| strava_connections | OAuth tokens (secrets) | **no user policies** — service role only |
| shopify_links | verified-email match to Shopify customer | own-row read |
| activities | scored Strava runs | **owner-only read, even admins excluded** |
| points_rules | editable formulas, versioned | read all / admin write |
| points_ledger | append-only points events | own-row read (+admin); writes server-only; update/delete blocked by trigger |
| rewards | catalogue | read active / admin write |
| redemptions | claims + Shopify codes + status machine | own-row read (+admin) |
| gait_sessions | gait app results by email | own-row read (+admin) |
| webhook_events | dedupe + audit + replay | admin read |

## 3. Design directions

### Direction A — "Podium" (implemented)
Deep RUN navy (#0b1220) base — straight from runstore.co.za — energised with
podium coral (#ff5a3c) and amber (#ffd166). Big rounded cards, odometer
count-up balance, gradient progress bars, emoji-forward iconography. Feels
like a race-day game HUD. Chosen default because it keeps brand recognition
(navy) while clearly signalling "this is the fun one".

### Direction B — "Trail Volt" (one-file swap)
Near-black forest green base (#0c1512), volt green (#c8f542) primary, clay
orange secondary. Grittier, more trail-culture. To preview: swap the `accent`/
`volt`/`ink` values in `tailwind.config.ts` — the component system is
token-driven so nothing else changes.

Shared foundations either way: mobile-first at 390px, tap targets ≥44px,
`prefers-reduced-motion` respected globally, AA contrast on all text.

## 4. Phase 1 test plan → see README.md § Testing Phase 1
