-- =============================================
-- Add slug column to categories
-- Required by seedBuddhistCategories() upsert
-- with onConflict: "organization_id,slug"
-- Applied remotely via MCP: 2026-07-12
-- =============================================

-- 1. Add slug column (nullable first for backfill)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Backfill existing rows: generate slug from name (cyrillic + latin safe)
UPDATE public.categories
SET slug = lower(regexp_replace(name, '[^a-zA-Zа-яА-ЯёЁ0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- 3. Make slug NOT NULL after backfill
ALTER TABLE public.categories
  ALTER COLUMN slug SET NOT NULL;

-- 4. Unique constraint per org (required by upsert onConflict)
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_org_slug
  ON public.categories(organization_id, slug);

-- 5. Recreate the org+name index
DROP INDEX IF EXISTS public.idx_categories_org_name;
CREATE INDEX IF NOT EXISTS idx_categories_org_name
  ON public.categories(organization_id, name);

-- 6. Auto-generate slug trigger (deduplicates within org)
CREATE OR REPLACE FUNCTION public.generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Zа-яА-ЯёЁ0-9]+', '-', 'g'));
    DECLARE
      base_slug TEXT := NEW.slug;
      counter INT := 1;
    BEGIN
      WHILE EXISTS (
        SELECT 1 FROM public.categories
        WHERE organization_id = NEW.organization_id AND slug = NEW.slug
        AND (TG_OP = 'INSERT' OR id != NEW.id)
      ) LOOP
        NEW.slug := base_slug || '-' || counter;
        counter := counter + 1;
      END LOOP;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_category_slug ON public.categories;
CREATE TRIGGER trg_generate_category_slug
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_category_slug();
