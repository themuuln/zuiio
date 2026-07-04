create extension if not exists "pgcrypto";

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  full_name text not null,
  gender text not null default 'unknown' check (gender in ('female', 'male', 'unknown')),
  language text not null default 'Mongolian',
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  subscribed_at timestamptz not null default now(),
  contact_time text not null default 'Unknown',
  avatar_url text not null default '',
  tags text[] not null default '{}',
  subscription_lists text[] not null default '{}',
  opted_in_through text not null default 'Direct',
  paused_automations boolean not null default false,
  psid text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_full_name_idx on public.contacts using gin (to_tsvector('simple', full_name));
create index if not exists contacts_status_idx on public.contacts (status);
create index if not exists contacts_gender_idx on public.contacts (gender);
create index if not exists contacts_subscribed_at_idx on public.contacts (subscribed_at desc);

create or replace function public.set_contacts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_contacts_updated_at on public.contacts;
create trigger trg_set_contacts_updated_at
before update on public.contacts
for each row execute function public.set_contacts_updated_at();

insert into public.contacts (
  first_name,
  last_name,
  full_name,
  gender,
  language,
  status,
  subscribed_at,
  contact_time,
  tags,
  subscription_lists,
  opted_in_through,
  psid
)
values
  ('Tsedev', 'Amgalan', 'Tsedev Amgalan', 'female', 'Mongolian', 'subscribed', now() - interval '3 months', 'Unknown', '{"vip"}', '{"Promo & Updates"}', 'Direct', '24944012975301638'),
  ('Ujin', 'Enkhtsogt', 'Ujin Enkhtsogt', 'female', 'Mongolian', 'subscribed', now() - interval '8 months', 'Unknown', '{}', '{"Promo & Updates"}', 'Direct', '24944012975301639'),
  ('Ganbaatar', 'Nomin Erdene', 'Ganbaatar Nomin Erdene', 'female', 'Mongolian', 'subscribed', now() - interval '9 months', 'Unknown', '{"new lead"}', '{}', 'Direct', '24944012975301640'),
  ('Odnoo', 'Odgoo', 'Odnoo Odgoo', 'female', 'Mongolian', 'subscribed', now() - interval '8 months', 'Unknown', '{}', '{}', 'Direct', '24944012975301641'),
  ('Bayanmunkh', 'Bayarsaikhan', 'Bayanmunkh Bayarsaikhan', 'male', 'Mongolian', 'subscribed', now() - interval '8 months', 'Unknown', '{}', '{}', 'Direct', '24944012975301642')
on conflict (psid) do nothing;

alter table public.contacts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contacts'
      and policyname = 'Service role full access'
  ) then
    create policy "Service role full access"
      on public.contacts
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

