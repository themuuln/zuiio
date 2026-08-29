create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel text not null check (channel in ('messenger', 'instagram')),
  page_id text not null,
  sender_id text not null,
  ref text not null,
  source text not null,
  type text not null,
  ad_id text,
  created_at timestamptz not null default now()
);

create index if not exists referral_events_organization_ref_idx
  on public.referral_events (organization_id, ref);

alter table public.referral_events enable row level security;

-- Service-role writes are intentionally the only access path. RLS denies
-- anon/authenticated access by default while service_role bypasses RLS.
revoke all on public.referral_events from anon, authenticated;

