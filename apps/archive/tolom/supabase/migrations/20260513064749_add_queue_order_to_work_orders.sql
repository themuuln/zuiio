-- Add queue_order column to work_orders for drag-to-reorder in waiting queue
alter table public.work_orders
  add column if not exists queue_order integer not null default 0;

-- Index for efficient queue order queries
create index if not exists idx_work_orders_queue_order
  on public.work_orders (organization_id, queue_order asc)
  where bay_number is null and deleted_at is null and status not in ('Completed', 'Cancelled');
