create table if not exists public.linked_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel text not null check (channel in ('messenger', 'instagram')),
  channel_user_id text not null,
  user_id uuid not null,
  linked_at timestamptz not null default now(),
  authorization_token_hash text not null unique
);

create unique index if not exists linked_accounts_channel_identity_idx
  on public.linked_accounts (organization_id, channel, channel_user_id);
create index if not exists linked_accounts_org_user_idx
  on public.linked_accounts (organization_id, user_id);

alter table public.linked_accounts enable row level security;
revoke all on public.linked_accounts from anon, authenticated;
