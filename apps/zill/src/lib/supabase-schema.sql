-- Supabase schema for Zill
-- Run this in your Supabase SQL editor when ready to migrate

-- ── Splits ─────────────────────────────────────────────────────────

create table splits (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  date        date not null default current_date,
  payer       text not null,
  created_at  timestamptz not null default now(),
  status      text not null default 'open'
    check (status in ('open', 'confirming', 'settled')),
  privacy_mode text not null default 'private'
    check (privacy_mode in ('private', 'open'))
);

-- ── Items ──────────────────────────────────────────────────────────

create table split_items (
  id       uuid primary key default gen_random_uuid(),
  split_id uuid not null references splits(id) on delete cascade,
  name     text not null,
  amount   integer not null check (amount > 0),
  tag      text not null
    check (tag in ('shared', 'individual', 'alcohol', 'service')),
  sort_order integer not null default 0
);

create index idx_split_items_split on split_items(split_id);

-- ── Participants ──────────────────────────────────────────────────

create table split_participants (
  id       uuid primary key default gen_random_uuid(),
  split_id uuid not null references splits(id) on delete cascade,
  name     text not null,
  unique (split_id, name)
);

create index idx_split_participants_split on split_participants(split_id);

-- ── Selections ────────────────────────────────────────────────────

create table participant_selections (
  split_id           uuid not null references splits(id) on delete cascade,
  participant_name   text not null,
  selected_item_ids  uuid[] not null default '{}',
  confirmed          boolean not null default false,
  saved              boolean not null default false,
  joined_at          timestamptz not null default now(),
  unique (split_id, participant_name)
);

create index idx_participant_selections_split on participant_selections(split_id);

-- ── Row-Level Security (optional, for multi-user later) ────────────

-- alter table splits enable row level security;
-- alter table split_items enable row level security;
-- alter table split_participants enable row level security;
-- alter table participant_selections enable row level security;

-- For now: no RLS because there's no auth.
-- If you add auth later:
-- create policy "Anyone can read splits" on splits for select using (true);
-- create policy "Create splits" on splits for insert with check (true);
