-- Mechanic commission rules
create table if not exists mechanic_commission_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  mechanic_id uuid references profiles(id) on delete set null,
  name text not null,
  commission_type text not null check (commission_type in ('percentage_of_labor', 'percentage_of_parts', 'percentage_of_revenue', 'fixed_per_work_order')),
  commission_value numeric(10,2) not null default 0,
  min_commission numeric(10,2),
  max_commission numeric(10,2),
  is_active boolean not null default true,
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  deleted_at timestamptz
);

-- Enable RLS
alter table mechanic_commission_rules enable row level security;

-- RLS policies
drop policy if exists "Users can view their org's commission rules" on mechanic_commission_rules;
create policy "Users can view their org's commission rules"
  on mechanic_commission_rules for select
  using (organization_id = (select organization_id from organization_users where user_id = auth.uid() limit 1));

drop policy if exists "Users can insert commission rules in their org" on mechanic_commission_rules;
create policy "Users can insert commission rules in their org"
  on mechanic_commission_rules for insert
  with check (organization_id = (select organization_id from organization_users where user_id = auth.uid() limit 1));

drop policy if exists "Users can update commission rules in their org" on mechanic_commission_rules;
create policy "Users can update commission rules in their org"
  on mechanic_commission_rules for update
  using (organization_id = (select organization_id from organization_users where user_id = auth.uid() limit 1));

drop policy if exists "Users can delete commission rules in their org" on mechanic_commission_rules;
create policy "Users can delete commission rules in their org"
  on mechanic_commission_rules for delete
  using (organization_id = (select organization_id from organization_users where user_id = auth.uid() limit 1));

-- Indexes
create index if not exists idx_commission_rules_org on mechanic_commission_rules(organization_id);
create index if not exists idx_commission_rules_mechanic on mechanic_commission_rules(mechanic_id);

-- Trigger for updated_at
drop trigger if exists set_mechanic_commission_rules_updated_at on mechanic_commission_rules;
create trigger set_mechanic_commission_rules_updated_at
  before update on mechanic_commission_rules
  for each row execute function update_updated_at_column();

-- Add FK from work_order_commissions (created in 00004, deferred until now)
alter table work_order_commissions
  add constraint fk_wo_commissions_rule
  foreign key (commission_rule_id)
  references mechanic_commission_rules(id)
  on delete set null;

