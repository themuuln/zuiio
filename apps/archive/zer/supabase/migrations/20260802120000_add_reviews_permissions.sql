-- Reviews: add permissions to app_permission enum.
-- Kept separate from the reviews table migration: Postgres requires
-- ALTER TYPE ... ADD VALUE to commit before the new value is referenced.
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'reviews.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'reviews.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'reviews.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'reviews.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
