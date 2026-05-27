-- Fix staff_id foreign key for Supabase join support
-- The join syntax `profiles:staff_id ( full_name )` requires the FK to reference
-- the `profiles` table, not `auth.users`.

ALTER TABLE customer_communications
  DROP CONSTRAINT IF EXISTS customer_communications_staff_id_fkey;

ALTER TABLE customer_communications
  ADD CONSTRAINT customer_communications_staff_id_fkey
  FOREIGN KEY (staff_id) REFERENCES profiles(id) ON DELETE SET NULL;
