-- SSO audit log: records consent, grant, session, and MFA events.
-- Service-role only; inserts happen from server routes after the outcome is known.

create table public.sso_audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  client_id uuid,
  event_type text not null check (event_type in (
    'consent_approved',
    'consent_denied',
    'grant_revoked',
    'session_revoked',
    'mfa_enrolled',
    'mfa_unenrolled',
    'mfa_verified',
    'oauth_error'
  )),
  ip_address inet,
  user_agent text,
  metadata jsonb
);

-- Fast queries by user and time
create index idx_sso_audit_user_time on public.sso_audit_events (user_id, occurred_at desc);
create index idx_sso_audit_event_type on public.sso_audit_events (event_type, occurred_at desc);

-- No public access — service-role only
revoke all on public.sso_audit_events from anon, authenticated;
alter table public.sso_audit_events enable row level security;
