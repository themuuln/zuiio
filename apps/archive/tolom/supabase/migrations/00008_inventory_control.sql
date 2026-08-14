-- Phase 2: Inventory Control — Stock Ledger, Suppliers, Purchase Orders
-- TOLOM auto repair SaaS platform
-- Created: 2026-05-12

-- ============================================================
-- Movement Types
-- ============================================================
create type inventory_movement_type as enum (
  'purchase',       -- Stock purchased from supplier
  'sale',           -- Sold via work order
  'adjustment',     -- Manual stock count adjustment
  'transfer_in',    -- Transferred from another branch
  'transfer_out',   -- Transferred to another branch
  'return',         -- Returned to supplier
  'waste'           -- Damaged/expired
);

-- ============================================================
-- Tables
-- ============================================================

-- Inventory ledger: every stock change recorded immutably
create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  part_id uuid not null references parts_catalog(id),
  movement_type inventory_movement_type not null,
  quantity numeric(12,2) not null,
  unit_cost numeric(12,2),
  unit_price numeric(12,2),
  reference_type text,  -- 'work_order', 'purchase_order', 'adjustment'
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now()
);

-- Suppliers
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  tax_id text,
  payment_terms text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Purchase orders
create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  supplier_id uuid references suppliers(id),
  order_number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'ordered', 'partial', 'received', 'cancelled')),
  order_date date not null default current_date,
  expected_at date,
  received_at timestamp with time zone,
  notes text,
  total_amount numeric(12,2) not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Purchase order line items
create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  purchase_order_id uuid not null references purchase_orders(id),
  part_id uuid not null references parts_catalog(id),
  quantity_ordered numeric(12,2) not null,
  quantity_received numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Low stock thresholds
create table stock_thresholds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  part_id uuid not null references parts_catalog(id),
  minimum_quantity numeric(12,2) not null default 0,
  maximum_quantity numeric(12,2),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(organization_id, branch_id, part_id)
);

-- ============================================================
-- Current Balance View (computed from ledger)
-- ============================================================
create view inventory_balances as
select
  im.organization_id,
  im.branch_id,
  im.part_id,
  pc.name as part_name,
  pc.part_number,
  pc.category,
  pc.unit,
  pc.default_price,
  coalesce(sum(case
    when im.movement_type in ('purchase', 'transfer_in', 'return') then im.quantity
    when im.movement_type in ('sale', 'transfer_out', 'waste', 'adjustment') then -im.quantity
    else 0
  end), 0) as quantity_on_hand,
  max(im.created_at) as last_movement_at
from inventory_movements im
join parts_catalog pc on pc.id = im.part_id
group by im.organization_id, im.branch_id, im.part_id, pc.name, pc.part_number, pc.category, pc.unit, pc.default_price;

-- ============================================================
-- RLS
-- ============================================================
alter table inventory_movements enable row level security;
alter table suppliers enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table stock_thresholds enable row level security;

-- Inventory Movements RLS
create policy "Users can view movements in their org"
  on inventory_movements for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert movements in their org"
  on inventory_movements for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

-- inventory_movements: immutable, no update/delete

-- Suppliers RLS
create policy "Users can view suppliers in their org"
  on suppliers for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert suppliers in their org"
  on suppliers for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update suppliers in their org"
  on suppliers for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete suppliers in their org"
  on suppliers for delete
  using (organization_id = get_user_organization_id());

-- Purchase Orders RLS
create policy "Users can view POs in their org"
  on purchase_orders for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert POs in their org"
  on purchase_orders for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update POs in their org"
  on purchase_orders for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete POs in their org"
  on purchase_orders for delete
  using (organization_id = get_user_organization_id());

-- Purchase Order Items RLS
create policy "Users can view PO items in their org"
  on purchase_order_items for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert PO items in their org"
  on purchase_order_items for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update PO items in their org"
  on purchase_order_items for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete PO items in their org"
  on purchase_order_items for delete
  using (organization_id = get_user_organization_id());

-- Stock Thresholds RLS
create policy "Users can view thresholds in their org"
  on stock_thresholds for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert thresholds in their org"
  on stock_thresholds for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update thresholds in their org"
  on stock_thresholds for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete thresholds in their org"
  on stock_thresholds for delete
  using (organization_id = get_user_organization_id());

-- ============================================================
-- Indexes
-- ============================================================
create index idx_inventory_movements_part on inventory_movements(part_id);
create index idx_inventory_movements_org on inventory_movements(organization_id);
create index idx_inventory_movements_type on inventory_movements(organization_id, movement_type);
create index idx_inventory_movements_reference on inventory_movements(reference_type, reference_id);

create index idx_suppliers_org on suppliers(organization_id);
create index idx_purchase_orders_org on purchase_orders(organization_id);
create index idx_purchase_orders_supplier on purchase_orders(supplier_id);
create index idx_purchase_order_items_po on purchase_order_items(purchase_order_id);
create index idx_stock_thresholds_part on stock_thresholds(part_id);
