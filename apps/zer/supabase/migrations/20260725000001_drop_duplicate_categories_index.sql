-- Drop duplicate index on categories table
-- idx_categories_org_slug duplicates categories_organization_id_slug_unique
-- Identified by Supabase advisor: "duplicate_index"
-- https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index

DROP INDEX IF EXISTS public.idx_categories_org_slug;
