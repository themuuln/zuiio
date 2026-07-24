-- Enable citext for case-insensitive usernames
create extension if not exists "citext" with schema "extensions";

-- Profiles table: one-to-one with auth.users on the identity project
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 80),
  username citext unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reserved usernames that cannot be claimed
create table public.reserved_usernames (
  username citext primary key
);

insert into public.reserved_usernames (username) values
  ('admin'), ('api'), ('auth'), ('login'), ('root'),
  ('signup'), ('support'), ('system'), ('zuiio'),
  ('zer'), ('tolom'), ('tamga'), ('onoo'), ('tumurch'),
  ('zraf'), ('zoa'), ('zatly'), ('khosuud'), ('zerbu'),
  ('zunch'), ('card'), ('zill');

-- Username validation function
create or replace function public.validate_username(username_to_check text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Must be 3-32 characters
  if length(username_to_check) < 3 or length(username_to_check) > 32 then
    raise exception 'Username must be 3-32 characters';
  end if;

  -- Must start and end with alphanumeric
  if not (username_to_check ~ '^[a-z0-9]' and username_to_check ~ '[a-z0-9]$') then
    raise exception 'Username must start and end with a letter or number';
  end if;

  -- Only allowed characters
  if username_to_check !~ '^[a-z0-9._-]+$' then
    raise exception 'Username may only contain a-z, 0-9, ., _, or -';
  end if;

  -- Check reserved names
  if exists (select 1 from public.reserved_usernames where username = username_to_check) then
    raise exception 'This username is reserved';
  end if;
end;
$$;

-- Trigger to normalize username and derive full_name on user insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'auth', 'public'
as $$
declare
  desired_username text := nullif(trim(NEW.raw_user_meta_data ->> 'username'), '');
  provider_name text := nullif(trim(NEW.raw_user_meta_data ->> 'name'), '');
  derived_full_name text;
begin
  -- Derive full_name: raw_user_meta_data.full_name > provider name > email local part
  derived_full_name := coalesce(
    nullif(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(provider_name), ''),
    split_part(NEW.email, '@', 1)
  );

  -- Validate and insert username if provided
  if desired_username is not null then
    -- Validate format
    perform public.validate_username(desired_username);

    -- Check uniqueness (citext handles case-insensitivity)
    if exists (select 1 from public.profiles where username = desired_username) then
      raise exception 'Username already taken';
    end if;
  end if;

  insert into public.profiles (id, full_name, username)
  values (
    NEW.id,
    derived_full_name,
    desired_username
  );

  return NEW;
end;
$$;

-- Attach trigger to auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RLS: authenticated users can only read their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id );

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- No direct inserts: profile is created by trigger on auth.users insert
-- No deletes: profile is cascade-deleted when auth.users row is deleted

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
