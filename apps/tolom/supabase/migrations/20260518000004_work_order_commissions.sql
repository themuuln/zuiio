-- Calculated commissions per work order
create table if not exists work_order_commissions (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  mechanic_id uuid not null references profiles(id),
  commission_rule_id uuid,
  commission_type text not null,
  commission_rate numeric(10,2) not null,
  commission_amount numeric(12,2) not null default 0,
  labor_amount numeric(12,2) not null default 0,
  parts_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table work_order_commissions enable row level security;

create policy "Users can view their org's commission records"
  on work_order_commissions for select
  using (work_order_id in (select id from work_orders where organization_id in (select organization_id from organization_users where user_id = auth.uid())));

create policy "Users can insert commission records"
  on work_order_commissions for insert
  with check (true);

create index idx_wo_commissions_work_order on work_order_commissions(work_order_id);
create index idx_wo_commissions_mechanic on work_order_commissions(mechanic_id);
create index idx_wo_commissions_created on work_order_commissions(created_at);
