-- Component type enum
create type component_type as enum (
  'chain',
  'cassette',
  'chainring',
  'tire_front',
  'tire_rear',
  'brake_pads',
  'cables',
  'bar_tape',
  'custom'
);

-- Distance unit enum
create type distance_unit as enum ('km', 'mi');

-- Users (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  strava_athlete_id bigint unique,
  strava_access_token text,
  strava_refresh_token text,
  strava_token_expires_at timestamptz,
  distance_unit distance_unit not null default 'km',
  created_at timestamptz not null default now()
);

-- Bikes
create table public.bikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  strava_gear_id text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Components
create table public.components (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.bikes(id) on delete cascade,
  name text not null,
  type component_type not null,
  max_distance_km numeric not null check (max_distance_km > 0),
  installed_at timestamptz not null default now(),
  retired_at timestamptz,
  created_at timestamptz not null default now()
);

-- Rides (synced from Strava)
create table public.rides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  bike_id uuid references public.bikes(id) on delete set null,
  strava_activity_id bigint unique,
  name text not null,
  distance_km numeric not null default 0,
  moving_time_seconds integer not null default 0,
  started_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_bikes_user_id on public.bikes(user_id);
create index idx_components_bike_id on public.components(bike_id);
create index idx_rides_user_id on public.rides(user_id);
create index idx_rides_bike_id on public.rides(bike_id);
create index idx_rides_started_at on public.rides(started_at);

-- Row Level Security
alter table public.users enable row level security;
alter table public.bikes enable row level security;
alter table public.components enable row level security;
alter table public.rides enable row level security;

-- Users: can only read/update own row
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Bikes: users see only their own
create policy "Users can view own bikes"
  on public.bikes for select
  using (auth.uid() = user_id);

create policy "Users can insert own bikes"
  on public.bikes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bikes"
  on public.bikes for update
  using (auth.uid() = user_id);

create policy "Users can delete own bikes"
  on public.bikes for delete
  using (auth.uid() = user_id);

-- Components: access through bike ownership
create policy "Users can view own components"
  on public.components for select
  using (
    exists (
      select 1 from public.bikes
      where bikes.id = components.bike_id
      and bikes.user_id = auth.uid()
    )
  );

create policy "Users can insert own components"
  on public.components for insert
  with check (
    exists (
      select 1 from public.bikes
      where bikes.id = components.bike_id
      and bikes.user_id = auth.uid()
    )
  );

create policy "Users can update own components"
  on public.components for update
  using (
    exists (
      select 1 from public.bikes
      where bikes.id = components.bike_id
      and bikes.user_id = auth.uid()
    )
  );

create policy "Users can delete own components"
  on public.components for delete
  using (
    exists (
      select 1 from public.bikes
      where bikes.id = components.bike_id
      and bikes.user_id = auth.uid()
    )
  );

-- Rides: users see only their own
create policy "Users can view own rides"
  on public.rides for select
  using (auth.uid() = user_id);

create policy "Users can insert own rides"
  on public.rides for insert
  with check (auth.uid() = user_id);

create policy "Users can update own rides"
  on public.rides for update
  using (auth.uid() = user_id);

create policy "Users can delete own rides"
  on public.rides for delete
  using (auth.uid() = user_id);
