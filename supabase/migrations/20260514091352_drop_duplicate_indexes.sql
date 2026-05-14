-- Drop duplicate indexes on work_order_services and work_order_parts
--
-- idx_wos_work_order is a duplicate of idx_work_order_services_work_order_id
-- idx_wop_work_order is a duplicate of idx_work_order_parts_work_order_id
-- Both originals were created in 00002_phase1_startup_crm.sql and
-- re-created with IF NOT EXISTS in 00012_fix_schema_drift_and_payments.sql.
-- The duplicates were accidentally added in 20260514081921_add_performance_indexes.sql.

drop index if exists idx_wos_work_order;
drop index if exists idx_wop_work_order;
