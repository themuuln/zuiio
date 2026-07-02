-- ── Cash Register Sessions ──────────────────────────────────
-- Tracks physical cash drawer operations per org per day.
-- One session per org per branch per day. Append-only ledger
-- for cash in/out entries.
-- ────────────────────────────────────────────────────────────

-- ── 1. cash_register_sessions ───────────────────────────────
create table cash_register_sessions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  branch_id       uuid references branches(id),
  date            date not null default current_date,
  status          text not null default 'open',
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,
  opening_balance numeric(12,2) not null default 0,
  closing_balance numeric(12,2),
  expected_balance numeric(12,2),
  cash_in         numeric(12,2) not null default 0,
  cash_out        numeric(12,2) not null default 0,
  discrepancy     numeric(12,2),
  discrepancy_note text,
  opened_by       uuid references profiles(id) on delete set null,
  closed_by       uuid references profiles(id) on delete set null,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ── 2. cash_register_entries (ledger) ───────────────────────
create table cash_register_entries (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references cash_register_sessions(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  entry_type      text not null,
  amount          numeric(12,2) not null,
  source          text not null,
  source_id       uuid,
  description     text,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ── 3. Constraints (idempotent) ────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cash_register_sessions_org_branch_date_key'
    and conrelid = 'cash_register_sessions'::regclass
  ) then
    alter table cash_register_sessions
      add constraint cash_register_sessions_org_branch_date_key
      unique (organization_id, branch_id, date);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cash_register_sessions_status_check'
    and conrelid = 'cash_register_sessions'::regclass
  ) then
    alter table cash_register_sessions
      add constraint cash_register_sessions_status_check
      check (status in ('open', 'closed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cash_register_entries_type_check'
    and conrelid = 'cash_register_entries'::regclass
  ) then
    alter table cash_register_entries
      add constraint cash_register_entries_type_check
      check (entry_type in ('in', 'out'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cash_register_entries_source_check'
    and conrelid = 'cash_register_entries'::regclass
  ) then
    alter table cash_register_entries
      add constraint cash_register_entries_source_check
      check (source in ('payment', 'invoice_payment', 'manual', 'expense', 'refund'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cash_register_entries_amount_check'
    and conrelid = 'cash_register_entries'::regclass
  ) then
    alter table cash_register_entries
      add constraint cash_register_entries_amount_check
      check (amount > 0);
  end if;
end $$;

-- ── 4. Link existing payment tables ────────────────────────

alter table payments
  add column if not exists cash_register_session_id uuid
  references cash_register_sessions(id) on delete set null;

alter table invoice_payments
  add column if not exists cash_register_session_id uuid
  references cash_register_sessions(id) on delete set null;

-- ── 5. RLS ─────────────────────────────────────────────────

alter table cash_register_sessions enable row level security;
alter table cash_register_entries enable row level security;

-- cash_register_sessions policies
create policy "cash_register_sessions_select"
  on cash_register_sessions for select
  using ((select get_user_organization_id()) = organization_id);

create policy "cash_register_sessions_insert"
  on cash_register_sessions for insert
  with check (
    (select get_user_organization_id()) = organization_id
    and created_by = (select auth.uid())
  );

create policy "cash_register_sessions_update"
  on cash_register_sessions for update
  using ((select get_user_organization_id()) = organization_id)
  with check ((select get_user_organization_id()) = organization_id);

create policy "cash_register_sessions_delete"
  on cash_register_sessions for delete
  using ((select get_user_organization_id()) = organization_id);

-- cash_register_entries policies
create policy "cash_register_entries_select"
  on cash_register_entries for select
  using ((select get_user_organization_id()) = organization_id);

create policy "cash_register_entries_insert"
  on cash_register_entries for insert
  with check (
    (select get_user_organization_id()) = organization_id
    and created_by = (select auth.uid())
  );

-- ── 6. Indexes ─────────────────────────────────────────────

-- Partial unique: one open session per org+branch
create unique index idx_cash_register_sessions_open
  on cash_register_sessions (organization_id, branch_id)
  where status = 'open' and deleted_at is null;

-- List queries: org + date range, excluding deleted
create index idx_cash_register_sessions_active
  on cash_register_sessions (organization_id, date desc)
  where deleted_at is null;

-- FK indexes on sessions
create index idx_cash_register_sessions_org
  on cash_register_sessions (organization_id);
create index idx_cash_register_sessions_branch
  on cash_register_sessions (branch_id);
create index idx_cash_register_sessions_opened_by
  on cash_register_sessions (opened_by);
create index idx_cash_register_sessions_closed_by
  on cash_register_sessions (closed_by);

-- Entries: always by session
create index idx_cash_register_entries_session
  on cash_register_entries (session_id);

-- Entries: org-level queries
create index idx_cash_register_entries_org
  on cash_register_entries (organization_id, created_at desc);

-- FK index on entries
create index idx_cash_register_entries_created_by
  on cash_register_entries (created_by);

-- New FK columns on existing tables (partial — only non-null)
create index idx_payments_session
  on payments (cash_register_session_id)
  where cash_register_session_id is not null;

create index idx_invoice_payments_session
  on invoice_payments (cash_register_session_id)
  where cash_register_session_id is not null;

-- Composite: find cash payments during a session
create index idx_payments_session_method
  on payments (cash_register_session_id, payment_method)
  where cash_register_session_id is not null;

create index idx_invoice_payments_session_method
  on invoice_payments (cash_register_session_id, method)
  where cash_register_session_id is not null;

-- ── 7. Auto-update trigger ─────────────────────────────────

create trigger set_cash_register_sessions_updated_at
  before update on cash_register_sessions
  for each row execute function set_updated_at();

-- ── 8. Permissions ─────────────────────────────────────────

do $$
declare
  p_org_id uuid;
begin
  for p_org_id in select id from organizations loop
    insert into permissions (organization_id, name, resource, action, description)
    values
      (p_org_id, 'cash_register.create', 'cash_register', 'create', 'Open cash register session'),
      (p_org_id, 'cash_register.read',   'cash_register', 'read',   'View cash register sessions'),
      (p_org_id, 'cash_register.update', 'cash_register', 'update', 'Close cash register session'),
      (p_org_id, 'cash_register.delete', 'cash_register', 'delete', 'Void cash register session')
    on conflict do nothing;

    insert into role_permissions (role_id, permission_id)
    select r.id, p.id
    from roles r
    join permissions p on p.organization_id = r.organization_id
    where r.organization_id = p_org_id
      and r.name in ('Org Owner', 'Manager')
      and p.resource = 'cash_register'
    on conflict do nothing;
  end loop;
end $$;
