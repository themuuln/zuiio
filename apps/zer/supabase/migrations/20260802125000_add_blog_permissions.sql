-- Blog: add permissions to app_permission enum.
-- Kept separate from the blog_posts table migration: Postgres requires
-- ALTER TYPE ... ADD VALUE to commit before the new value is referenced.
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'blog.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'blog.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'blog.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'blog.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
