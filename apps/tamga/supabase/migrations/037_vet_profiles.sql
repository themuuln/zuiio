-- Мал эмнэлгийн профайлын хүснэгт
-- 037_vet_profiles.sql

create table if not exists public.vet_profiles (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  specialization text[],
  license_number text,
  education text,
  experience_years integer,
  consultation_fee integer,
  travel_surcharge integer,
  available_days text[],
  created_at timestamptz not null default now()
);

-- Index for filtering by provider
create index if not exists idx_vet_profiles_provider on public.vet_profiles (provider_id);

-- Enable RLS
alter table public.vet_profiles enable row level security;

-- Everyone can read vet profiles
create policy "Anyone can read vet profiles"
  on public.vet_profiles
  for select
  using (true);

-- Providers can create/update their own vet profile
create policy "Providers can manage their own vet profile"
  on public.vet_profiles
  for insert
  with check (auth.uid() in (
    select user_id from public.service_providers where id = provider_id
  ));

create policy "Providers can update their own vet profile"
  on public.vet_profiles
  for update
  using (auth.uid() in (
    select user_id from public.service_providers where id = provider_id
  ));

create policy "Providers can delete their own vet profile"
  on public.vet_profiles
  for delete
  using (auth.uid() in (
    select user_id from public.service_providers where id = provider_id
  ));
