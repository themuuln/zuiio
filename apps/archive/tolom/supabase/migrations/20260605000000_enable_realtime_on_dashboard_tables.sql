-- Enable Supabase Realtime on tables used by the dashboard realtime subscriptions.
-- Without this, useRealtimeMulti WebSocket events never fire for these tables.
--
-- See: src/app/[locale]/dashboard/page.tsx → useRealtimeMulti

-- Set REPLICA IDENTITY FULL so UPDATE/DELETE events include the full row data.
ALTER TABLE work_orders REPLICA IDENTITY FULL;
ALTER TABLE invoices REPLICA IDENTITY FULL;
ALTER TABLE work_order_services REPLICA IDENTITY FULL;
ALTER TABLE work_order_parts REPLICA IDENTITY FULL;
ALTER TABLE customers REPLICA IDENTITY FULL;

-- Add tables to the realtime publication (idempotent — ON CONFLICT ignores duplicates).
ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE work_order_services;
ALTER PUBLICATION supabase_realtime ADD TABLE work_order_parts;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
