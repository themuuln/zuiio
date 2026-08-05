-- Migration: Standardize updated_at triggers to use canonical function
-- Migrates tables using set_updated_at() to update_updated_at_column()
-- which is the canonical function from phase0 foundation

-- First, ensure the canonical function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Migrate tables from set_updated_at() to update_updated_at_column()
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT trigger_name, event_manipulation, event_object_table
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND action_statement LIKE '%set_updated_at()%'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I',
      t.trigger_name,
      t.event_object_table
    );
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t.trigger_name,
      t.event_object_table
    );
  END LOOP;
END $$;

-- Drop the duplicate function if no longer referenced
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE t.tgname LIKE '%updated_at%'
      AND p.prosrc LIKE '%set_updated_at%'
  ) THEN
    DROP FUNCTION IF EXISTS set_updated_at();
  END IF;
END $$;
