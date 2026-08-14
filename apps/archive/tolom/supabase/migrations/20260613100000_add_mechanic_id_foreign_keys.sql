-- Fix foreign key constraints: mechanic_id should reference profiles, not auth.users
-- The FK names already exist but point to auth.users, which breaks Supabase's
-- schema cache when queries use profiles!work_orders_mechanic_id_fkey syntax.

ALTER TABLE work_orders
  DROP CONSTRAINT IF EXISTS work_orders_mechanic_id_fkey;

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_mechanic_id_fkey;

ALTER TABLE work_orders
  ADD CONSTRAINT work_orders_mechanic_id_fkey
  FOREIGN KEY (mechanic_id) REFERENCES profiles(id)
  ON DELETE SET NULL;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_mechanic_id_fkey
  FOREIGN KEY (mechanic_id) REFERENCES profiles(id)
  ON DELETE SET NULL;
