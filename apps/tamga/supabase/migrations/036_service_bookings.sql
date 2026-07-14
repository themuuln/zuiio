-- Үйлчилгээний захиалгын хүснэгт
-- 036_service_bookings.sql

create table if not exists public.service_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid references public.service_providers(id),
  provider_type text not null,
  service_type text not null,
  horse_ids text[] default '{}',
  location_aimag text,
  location_sum text,
  address text,
  booking_date date not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  total_amount integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for filtering by user
create index if not exists idx_service_bookings_user on public.service_bookings (user_id);

-- Index for filtering by provider
create index if not exists idx_service_bookings_provider on public.service_bookings (provider_id);

-- Index for filtering by status
create index if not exists idx_service_bookings_status on public.service_bookings (status);

-- Index for date ordering
create index if not exists idx_service_bookings_date on public.service_bookings (booking_date desc);

-- Enable RLS
alter table public.service_bookings enable row level security;

-- Users can read their own bookings
create policy "Users can read their own bookings"
  on public.service_bookings
  for select
  using (auth.uid() = user_id);

-- Providers can read their assigned bookings
create policy "Providers can read their assigned bookings"
  on public.service_bookings
  for select
  using (auth.uid() in (
    select user_id from public.service_providers where id = provider_id
  ));

-- Users can create bookings
create policy "Users can create bookings"
  on public.service_bookings
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own bookings
create policy "Users can update their own bookings"
  on public.service_bookings
  for update
  using (auth.uid() = user_id);

-- Providers can update their assigned bookings
create policy "Providers can update their assigned bookings"
  on public.service_bookings
  for update
  using (auth.uid() in (
    select user_id from public.service_providers where id = provider_id
  ));
