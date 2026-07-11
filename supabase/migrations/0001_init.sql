-- ============================================================
-- RUN Rewards — initial schema
-- One identity, many sources. Server-side immutable ledger.
-- Apply with: supabase db push   (or run in the SQL editor)
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- roles & helpers -------------------------------------------------

-- Admin check used by RLS policies. Role lives on profiles and is only
-- writable via service role (no user-side update policy covers it).
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ---------- profiles (the identity spine) -----------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  first_name text,
  last_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  onboarded_at timestamptz,
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamptz,
  leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- Users may update their own preference fields; role changes go through the
-- service role only (the trigger below blocks self-service escalation).
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.block_role_self_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role changes require an admin';
  end if;
  return new;
end;
$$;

create trigger profiles_block_role_change
  before update on public.profiles
  for each row when (auth.uid() = old.id)
  execute function public.block_role_self_change();

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- POPIA consent records --------------------------------------------

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('popia_data_processing', 'marketing_comms', 'leaderboard')),
  granted boolean not null,
  text_version text not null,      -- which consent copy the user saw
  created_at timestamptz not null default now()
);

alter table public.consents enable row level security;
create policy "consents: read own" on public.consents
  for select using (auth.uid() = user_id or public.is_admin());
create policy "consents: insert own" on public.consents
  for insert with check (auth.uid() = user_id);

-- ---------- linked sources ---------------------------------------------------

-- Strava tokens are secrets: NO user-facing policies at all. Only the
-- service-role key (server) can read/write. Users see a boolean via the
-- strava_link_status view below.
create table public.strava_connections (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  athlete_id bigint not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text not null,
  athlete_firstname text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.strava_connections enable row level security;
-- (no policies: deny-all for anon/authenticated; service role bypasses RLS)

create view public.strava_link_status
with (security_invoker = off) as
  select user_id, connected_at from public.strava_connections;
-- view runs as owner; expose it read-only, scoped by a wrapper function instead
revoke all on public.strava_link_status from anon, authenticated;

create or replace function public.my_strava_status()
returns table (connected boolean, connected_at timestamptz)
language sql stable security definer set search_path = public as $$
  select true, sc.connected_at from public.strava_connections sc
  where sc.user_id = auth.uid();
$$;

create table public.shopify_links (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  shopify_customer_id text not null unique,
  matched_at timestamptz not null default now()
);

alter table public.shopify_links enable row level security;
create policy "shopify_links: read own" on public.shopify_links
  for select using (auth.uid() = user_id or public.is_admin());

-- ---------- activities (Strava-sourced; visible ONLY to the owner) ----------

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  strava_activity_id bigint not null unique,
  name text,
  sport_type text not null,             -- Run, TrailRun, ...
  category text not null default 'road' check (category in ('road', 'trail', 'other')),
  distance_m numeric not null default 0,
  moving_time_s integer not null default 0,
  started_at timestamptz not null,
  is_manual boolean not null default false,
  status text not null default 'scored' check (status in ('scored', 'ignored', 'deleted')),
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_user_started on public.activities (user_id, started_at desc);

alter table public.activities enable row level security;
-- Strava compliance: an athlete's data is visible to that athlete only.
-- Admins do NOT get a browse policy over raw activities.
create policy "activities: read own only" on public.activities
  for select using (auth.uid() = user_id);

-- ---------- points rules (admin-editable, versioned) ------------------------

create table public.points_rules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,             -- road_run, trail_run, purchase, event_attendance
  label text not null,
  category text not null check (category in ('run', 'purchase', 'event', 'other')),
  points_per_km numeric,                -- run rules
  points_per_r100 numeric,              -- purchase rules
  flat_points integer,                  -- event rules
  daily_cap integer,                    -- max points/day from this rule (null = uncapped)
  multiplier numeric not null default 1.0,  -- boosted-challenge multiplier
  allow_manual_activities boolean not null default false, -- anti-cheat toggle
  enabled boolean not null default true,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

alter table public.points_rules enable row level security;
create policy "rules: readable by all signed-in" on public.points_rules
  for select using (auth.role() = 'authenticated');
create policy "rules: admin write" on public.points_rules
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.points_rules
  (key, label, category, points_per_km, points_per_r100, flat_points, daily_cap, multiplier)
values
  ('road_run',  'Road run',            'run',      1.0,  null, null, 30, 1.0),
  ('trail_run', 'Trail run',           'run',      1.5,  null, null, 30, 1.0),
  ('purchase',  'In-store purchase',   'purchase', null, 10,   null, null, 1.0),
  ('event_attendance', 'Event attendance', 'event', null, null, 50, null, 1.0),
  ('gait_analysis', 'Gait analysis visit', 'other', null, null, 150, null, 1.0);

-- ---------- the immutable points ledger --------------------------------------

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null check (source in
    ('run', 'purchase', 'event', 'gait', 'challenge_bonus', 'adjustment', 'redemption', 'redemption_refund')),
  activity_ref text,                    -- e.g. strava:123, shopify_order:456, redemption:<uuid>
  points integer not null,              -- positive = earned, negative = spent
  rule_version integer,
  reason text,                          -- required for manual adjustments
  created_by uuid references public.profiles (id),  -- admin who adjusted, null = system
  created_at timestamptz not null default now()
);

create index ledger_user_created on public.points_ledger (user_id, created_at desc);
create index ledger_activity_ref on public.points_ledger (activity_ref);

alter table public.points_ledger enable row level security;
create policy "ledger: read own" on public.points_ledger
  for select using (auth.uid() = user_id or public.is_admin());
-- No insert/update/delete policies: only the server (service role) writes,
-- and nothing ever updates or deletes a ledger row.

create or replace function public.ledger_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'points_ledger is append-only';
end;
$$;

create trigger ledger_no_update before update on public.points_ledger
  for each row execute function public.ledger_immutable();
create trigger ledger_no_delete before delete on public.points_ledger
  for each row execute function public.ledger_immutable();

-- Derived balance (never stored).
create or replace function public.points_balance(p_user uuid) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce(sum(points), 0)::integer from public.points_ledger
  where user_id = p_user;
$$;

create or replace function public.my_points_balance() returns integer
language sql stable security definer set search_path = public as $$
  select public.points_balance(auth.uid());
$$;

-- ---------- rewards catalogue & redemptions ---------------------------------

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  points_cost integer not null check (points_cost > 0),
  kind text not null check (kind in ('discount_amount', 'discount_percent', 'perk')),
  value_rands numeric,                  -- discount_amount: rand value; discount_percent: percentage
  perk_code text,                       -- perk: internal fulfilment code, e.g. 'gait_analysis'
  expiry_days integer not null default 30,
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.rewards enable row level security;
create policy "rewards: read active" on public.rewards
  for select using (active = true or public.is_admin());
create policy "rewards: admin write" on public.rewards
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.rewards (title, description, points_cost, kind, value_rands, perk_code, expiry_days, sort) values
  ('R100 off in store',  'R100 off any purchase at RUN.',            500,  'discount_amount', 100,  null, 30, 1),
  ('R250 off in store',  'R250 off any purchase at RUN.',            1000, 'discount_amount', 250,  null, 30, 2),
  ('R600 off new shoes', 'Serious mileage deserves fresh legs.',     2000, 'discount_amount', 600,  null, 45, 3),
  ('Free gait analysis', 'A full in-store gait analysis session.',   750,  'perk',            null, 'gait_analysis', 60, 4),
  ('Free event entry',   'Entry to the next RUN community event.',   400,  'perk',            null, 'event_entry',   60, 5);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reward_id uuid not null references public.rewards (id),
  points_spent integer not null,
  status text not null default 'pending' check (status in
    ('pending', 'issued', 'failed', 'refunded', 'used', 'expired')),
  shopify_discount_code text,
  shopify_discount_gid text,            -- Admin API node id, for later attribution
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index redemptions_user on public.redemptions (user_id, created_at desc);

alter table public.redemptions enable row level security;
create policy "redemptions: read own" on public.redemptions
  for select using (auth.uid() = user_id or public.is_admin());

-- ---------- gait analysis bridge ---------------------------------------------
-- The separate gait app POSTs results to /api/gait/ingest with an API key.
-- Rows are matched to a profile by verified email at ingest (or backfilled
-- when that email later signs up).

create table public.gait_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  session_date date not null,
  summary jsonb not null default '{}'::jsonb,   -- metrics from the gait app
  recommendations text,
  video_url text,
  source text not null default 'run-analysis',
  created_at timestamptz not null default now()
);

create index gait_sessions_email on public.gait_sessions (lower(email));

alter table public.gait_sessions enable row level security;
create policy "gait: read own" on public.gait_sessions
  for select using (auth.uid() = user_id or public.is_admin());

-- ---------- webhook event log (idempotency + audit) --------------------------

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,               -- 'strava'
  dedupe_key text not null unique,      -- e.g. strava:activity:123:update:1699999999
  payload jsonb not null,
  status text not null default 'received' check (status in ('received', 'processed', 'skipped', 'error')),
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.webhook_events enable row level security;
create policy "webhooks: admin read" on public.webhook_events
  for select using (public.is_admin());

-- ---------- admin summary (points only — no Strava data exposure) -----------

create or replace function public.admin_customer_summaries()
returns table (
  id uuid, email text, first_name text, last_name text,
  balance integer, lifetime_earned integer, lifetime_spent integer,
  strava_linked boolean, shopify_linked boolean,
  last_activity_at timestamptz, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    p.id, p.email, p.first_name, p.last_name,
    coalesce(sum(l.points), 0)::integer as balance,
    coalesce(sum(l.points) filter (where l.points > 0), 0)::integer as lifetime_earned,
    coalesce(-sum(l.points) filter (where l.points < 0), 0)::integer as lifetime_spent,
    exists (select 1 from public.strava_connections sc where sc.user_id = p.id) as strava_linked,
    exists (select 1 from public.shopify_links sl where sl.user_id = p.id) as shopify_linked,
    max(l.created_at) as last_activity_at,
    p.created_at
  from public.profiles p
  left join public.points_ledger l on l.user_id = p.id
  where public.is_admin()
  group by p.id;
$$;
