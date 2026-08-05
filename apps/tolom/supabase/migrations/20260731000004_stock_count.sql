-- Stock Count / Cycle Counting
-- TOLOM auto repair SaaS platform
-- Adds stock count sessions + items tracking, new count_adjustment movement type
-- Created: 2026-07-31

-- ============================================================
-- 1. Add count_adjustment to movement type enum
-- ============================================================
-- count_adjustment: positive = physical > system (adds stock), negative = physical < system (removes stock)
-- This differs from 'adjustment' which has inverted sign (positive subtracts stock).
-- Using a separate type keeps reconciliation code readable and correct.
alter type inventory_movement_type add value 'count_adjustment';

-- ============================================================
-- 2. Stock Count Session Status enum
-- ============================================================
create type stock_count_session_status as enum (
  'in_progress',
  'completed',
  'cancelled'
);

-- ============================================================
-- 3. Stock Count Sessions table
-- ============================================================
create table stock_count_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  status stock_count_session_status not null default 'in_progress',
  counted_by uuid not null references auth.users(id),
  total_items int not null default 0,
  total_variance int not null default 0,
  notes text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ============================================================
-- 4. Stock Count Items table
-- ============================================================
create table stock_count_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references stock_count_sessions(id) on delete cascade,
  part_id uuid not null references parts_catalog(id),
  system_quantity numeric not null,  -- frozen at count time from inventory_balances
  physical_quantity numeric not null, -- user-entered physical count
  variance numeric generated always as (physical_quantity - system_quantity) stored,
  notes text
);

-- Unique: one count per part per session
create unique index idx_stock_count_items_session_part
  on stock_count_items(session_id, part_id);

-- Fast lookup within a session
create index idx_stock_count_items_session
  on stock_count_items(session_id);

-- Fast session listing by org + status
create index idx_stock_count_sessions_org_status
  on stock_count_sessions(organization_id, status);

-- ============================================================
-- 5. Row Level Security
-- ============================================================
alter table stock_count_sessions enable row level security;
alter table stock_count_items enable row level security;

-- stock_count_sessions RLS
create policy "org_members_select_stock_count_sessions"
  on stock_count_sessions for select
  using (
    organization_id = get_user_organization_id()
  );

create policy "org_members_insert_stock_count_sessions"
  on stock_count_sessions for insert
  with check (
    organization_id = get_user_organization_id()
    and counted_by = auth.uid()
  );

create policy "org_members_update_stock_count_sessions"
  on stock_count_sessions for update
  using (
    organization_id = get_user_organization_id()
  );

-- stock_count_items RLS (cascading org check via session)
create policy "org_members_select_stock_count_items"
  on stock_count_items for select
  using (
    exists (
      select 1 from stock_count_sessions
      where stock_count_sessions.id = stock_count_items.session_id
        and stock_count_sessions.organization_id = get_user_organization_id()
    )
  );

create policy "org_members_insert_stock_count_items"
  on stock_count_items for insert
  with check (
    exists (
      select 1 from stock_count_sessions
      where stock_count_sessions.id = stock_count_items.session_id
        and stock_count_sessions.organization_id = get_user_organization_id()
    )
  );

create policy "org_members_delete_stock_count_items"
  on stock_count_items for delete
  using (
    exists (
      select 1 from stock_count_sessions
      where stock_count_sessions.id = stock_count_items.session_id
        and stock_count_sessions.organization_id = get_user_organization_id()
    )
  );

-- ============================================================
-- 6. Update refresh_inventory_balance to handle count_adjustment
-- ============================================================
-- count_adjustment uses natural sign: positive = add stock (physical > system)
-- This goes in the same CASE branch as purchase/transfer_in/return
create or replace function refresh_inventory_balance(p_part_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from inventory_balances where part_id = p_part_id;

  insert into inventory_balances (
    organization_id, branch_id, part_id, part_name, part_number,
    category, unit, default_price, quantity_on_hand, last_movement_at
  )
  select
    im.organization_id,
    im.branch_id,
    im.part_id,
    max(pc.name),
    max(pc.part_number),
    max(pc.category),
    max(pc.unit),
    max(pc.default_price),
    coalesce(sum(case
      when im.movement_type in ('purchase', 'transfer_in', 'return', 'count_adjustment') then im.quantity
      when im.movement_type in ('sale', 'transfer_out', 'waste', 'adjustment') then -im.quantity
      else 0
    end), 0),
    max(im.created_at)
  from inventory_movements im
  join parts_catalog pc on pc.id = im.part_id
  where im.part_id = p_part_id
  group by im.organization_id, im.branch_id, im.part_id;
end;
$$;

create unique index if not exists idx_inventory_movements_stock_count_unique
  on inventory_movements (reference_type, reference_id, part_id)
  where reference_type = 'stock_count';

-- ============================================================
-- 7. Atomic stock-count reconciliation
-- ============================================================
create or replace function reconcile_stock_count_session(
  p_org_id uuid,
  p_session_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session stock_count_sessions%rowtype;
  v_item_count integer;
  v_movement_count integer;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception using
      errcode = '42501',
      message = 'The authenticated user does not match the reconciliation actor';
  end if;

  if not exists (
    select 1
    from organization_users ou
    join roles r on r.id = ou.role_id
    where ou.organization_id = p_org_id
      and ou.user_id = p_user_id
      and r.name in ('Org Owner', 'Manager')
      and r.deleted_at is null
  ) then
    raise exception using
      errcode = '42501',
      message = 'The user is not authorized to reconcile stock counts';
  end if;

  select *
  into v_session
  from stock_count_sessions
  where id = p_session_id
    and organization_id = p_org_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'Stock count session not found';
  end if;

  if v_session.status <> 'in_progress' then
    raise exception using
      errcode = 'P0001',
      message = 'Session is already completed or cancelled';
  end if;

  if v_session.branch_id is not null
    and not exists (
      select 1
      from branches
      where id = v_session.branch_id
        and organization_id = p_org_id
    ) then
    raise exception using
      errcode = 'P0001',
      message = 'Stock count branch does not belong to the organization';
  end if;


  select count(*)
  into v_item_count
  from stock_count_items
  where session_id = p_session_id;

  if v_item_count = 0 then
    raise exception using
      errcode = 'P0001',
      message = 'No items in session to reconcile';
  end if;

  if exists (
    select 1
    from stock_count_items item
    join parts_catalog part on part.id = item.part_id
    where item.session_id = p_session_id
      and part.organization_id <> p_org_id
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Stock count contains a part from another organization';
  end if;


  insert into inventory_movements (
    organization_id,
    branch_id,
    part_id,
    movement_type,
    quantity,
    unit_cost,
    reference_type,
    reference_id,
    notes,
    created_by
  )
  select
    p_org_id,
    v_session.branch_id,
    item.part_id,
    'count_adjustment',
    item.variance,
    0,
    'stock_count',
    p_session_id,
    format('Stock count adjustment for session %s', p_session_id),
    p_user_id
  from stock_count_items item
  join parts_catalog part
    on part.id = item.part_id
   and part.organization_id = p_org_id
  where item.session_id = p_session_id
    and item.variance <> 0;

  get diagnostics v_movement_count = row_count;

  update stock_count_sessions
  set status = 'completed',
      completed_at = now()
  where id = p_session_id
    and organization_id = p_org_id;

  v_session.status := 'completed';
  v_session.completed_at := now();

  return jsonb_build_object(
    'session', to_jsonb(v_session),
    'movements_created', v_movement_count
  );
end;
$$;

revoke execute on function reconcile_stock_count_session(uuid, uuid, uuid) from public;
grant execute on function reconcile_stock_count_session(uuid, uuid, uuid) to authenticated, service_role;
