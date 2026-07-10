-- Add diagnosis_label_id FK to work_orders
alter table work_orders add column if not exists diagnosis_label_id uuid references diagnosis_labels(id) on delete set null;

-- Index for faster lookups
create index if not exists idx_work_orders_diagnosis_label on work_orders(diagnosis_label_id);
