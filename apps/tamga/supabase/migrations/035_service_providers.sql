-- Үйлчилгээ үзүүлэгчдийн хүснэгт
-- 035_service_providers.sql

create table if not exists public.service_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_type text not null check (provider_type in ('photographer', 'vet')),
  business_name text,
  phone text,
  location_aimag text,
  location_sum text,
  is_verified boolean default false,
  rating double precision default 0,
  created_at timestamptz not null default now()
);

-- Index for filtering by provider type
create index if not exists idx_service_providers_type on public.service_providers (provider_type);

-- Index for filtering by aimag
create index if not exists idx_service_providers_aimag on public.service_providers (location_aimag);

-- Index for filtering by user
create index if not exists idx_service_providers_user on public.service_providers (user_id);

-- Enable RLS
alter table public.service_providers enable row level security;

-- Everyone can read providers
create policy "Anyone can read service providers"
  on public.service_providers
  for select
  using (true);

-- Authenticated users can create their own provider profile
create policy "Users can create their own provider profile"
  on public.service_providers
  for insert
  with check (auth.uid() = user_id);

-- Providers can update their own profiles
create policy "Providers can update their own profile"
  on public.service_providers
  for update
  using (auth.uid() = user_id);

-- Providers can delete their own profile
create policy "Providers can delete their own profile"
  on public.service_providers
  for delete
  using (auth.uid() = user_id);
