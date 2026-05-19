-- Add unit_cost columns to work_order_services and work_order_parts
-- Enables profit calculation, margin tracking, and COGS analysis

-- Add unit_cost to work_order_services
alter table work_order_services
  add column if not exists unit_cost numeric(12,2) not null default 0;

-- Add unit_cost to work_order_parts
alter table work_order_parts
  add column if not exists unit_cost numeric(12,2) not null default 0;

-- Add comments explaining the columns
comment on column work_order_services.unit_cost is 'Cost of service (labor/materials) for profit calculation';
comment on column work_order_parts.unit_cost is 'Cost of part from purchase/supplier for profit calculation';
