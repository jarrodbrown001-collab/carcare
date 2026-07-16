-- CarCare cloud schema.
--
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- for a fresh project. Safe to re-run: every statement is idempotent.
--
-- IDs are `text`, not `uuid` — the app generates its own short IDs client-side
-- (see src/lib/store.js `uid()`) so existing localStorage data can be uploaded
-- as-is during the one-time cloud migration, with no ID remapping needed.

create table if not exists vehicles (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nickname text,
  year text,
  make text,
  model text,
  vin text,
  current_mileage double precision,
  start_mileage double precision,
  mileage_updated_at text,
  new_driver boolean default false,
  notes text,
  created_at text,
  inserted_at timestamptz not null default now()
);

create table if not exists services (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  vehicle_id text not null references vehicles(id) on delete cascade,
  type text,
  date text,
  mileage double precision,
  cost double precision,
  diy boolean default false,
  notes text,
  parts_used text,
  by text,
  inserted_at timestamptz not null default now()
);

create table if not exists schedules (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  vehicle_id text not null references vehicles(id) on delete cascade,
  type text,
  interval_miles double precision,
  interval_months double precision,
  notes text,
  inserted_at timestamptz not null default now()
);

create table if not exists recommendations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  vehicle_id text not null references vehicles(id) on delete cascade,
  title text,
  source text,
  notes text,
  date_identified text,
  mileage_identified double precision,
  est_low double precision,
  est_high double precision,
  target_date text,
  status text default 'open',
  resolved_service_id text,
  resolved_date text,
  inserted_at timestamptz not null default now()
);

create table if not exists fillups (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  vehicle_id text not null references vehicles(id) on delete cascade,
  date text,
  mileage double precision,
  gallons double precision,
  cost double precision,
  inserted_at timestamptz not null default now()
);

create index if not exists vehicles_user_id_idx on vehicles(user_id);
create index if not exists services_user_id_idx on services(user_id);
create index if not exists services_vehicle_id_idx on services(vehicle_id);
create index if not exists schedules_user_id_idx on schedules(user_id);
create index if not exists schedules_vehicle_id_idx on schedules(vehicle_id);
create index if not exists recommendations_user_id_idx on recommendations(user_id);
create index if not exists recommendations_vehicle_id_idx on recommendations(vehicle_id);
create index if not exists fillups_user_id_idx on fillups(user_id);
create index if not exists fillups_vehicle_id_idx on fillups(vehicle_id);

alter table vehicles enable row level security;
alter table services enable row level security;
alter table schedules enable row level security;
alter table recommendations enable row level security;
alter table fillups enable row level security;

-- Each user can only ever see/touch their own rows.
do $$
declare
  t text;
begin
  foreach t in array array['vehicles', 'services', 'schedules', 'recommendations', 'fillups']
  loop
    execute format('drop policy if exists "select own" on %I', t);
    execute format('create policy "select own" on %I for select using (user_id = auth.uid())', t);
    execute format('drop policy if exists "insert own" on %I', t);
    execute format('create policy "insert own" on %I for insert with check (user_id = auth.uid())', t);
    execute format('drop policy if exists "update own" on %I', t);
    execute format('create policy "update own" on %I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('drop policy if exists "delete own" on %I', t);
    execute format('create policy "delete own" on %I for delete using (user_id = auth.uid())', t);
  end loop;
end $$;

-- Private bucket for owner's-manual PDFs, one object per vehicle at
-- `${auth.uid()}/${vehicleId}.pdf`. Policies below restrict each user to
-- their own folder.
insert into storage.buckets (id, name, public)
values ('manuals', 'manuals', false)
on conflict (id) do nothing;

drop policy if exists "manuals select own" on storage.objects;
create policy "manuals select own" on storage.objects for select
  using (bucket_id = 'manuals' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "manuals insert own" on storage.objects;
create policy "manuals insert own" on storage.objects for insert
  with check (bucket_id = 'manuals' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "manuals update own" on storage.objects;
create policy "manuals update own" on storage.objects for update
  using (bucket_id = 'manuals' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "manuals delete own" on storage.objects;
create policy "manuals delete own" on storage.objects for delete
  using (bucket_id = 'manuals' and (storage.foldername(name))[1] = auth.uid()::text);

-- Enable realtime change feeds so other signed-in devices pick up edits live.
do $$
declare
  t text;
begin
  foreach t in array array['vehicles', 'services', 'schedules', 'recommendations', 'fillups']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;
