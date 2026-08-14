-- ============================================================================
-- Manufacturing Module: Quality Control (Чанарын хяналт)
-- ============================================================================
-- Creates quality_checks table with RLS, indexes,
-- and defect-photos storage bucket.
-- ============================================================================

-- 1. Create quality_checks table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.quality_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  production_order_id uuid NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  production_stage_id uuid REFERENCES public.production_stages(id) ON DELETE SET NULL,
  check_type text NOT NULL CHECK (check_type IN ('in_process', 'final')),
  result text NOT NULL CHECK (result IN ('pass', 'fail', 'conditional')),
  defect_description text,
  defect_photos text[],
  checked_by uuid NOT NULL REFERENCES auth.users(id),
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_quality_checks_organization_id
  ON public.quality_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_production_order_id
  ON public.quality_checks(production_order_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_check_type
  ON public.quality_checks(check_type);

-- 3. RLS: quality_checks ─────────────────────────────────────────────────────
-- Append-only: SELECT + INSERT only, no UPDATE/DELETE for regular users.

ALTER TABLE public.quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quality_checks_select" ON public.quality_checks
  FOR SELECT USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "quality_checks_insert" ON public.quality_checks
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('quality_checks.create'::public.app_permission)
  );

-- 4. Storage bucket for defect photos ────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('defect-photos', 'defect-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "defect_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'defect-photos'
    AND (storage.foldername(name))[1] = (SELECT get_current_organization())::text
  );

CREATE POLICY "defect_photos_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'defect-photos'
    AND (storage.foldername(name))[1] = (SELECT get_current_organization())::text
  );

CREATE POLICY "defect_photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'defect-photos'
    AND (storage.foldername(name))[1] = (SELECT get_current_organization())::text
  );

-- 5. Comments ────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.quality_checks IS 'Quality inspection records for production orders — append-only audit trail';
COMMENT ON COLUMN public.quality_checks.check_type IS 'in_process = during production, final = before completion';
COMMENT ON COLUMN public.quality_checks.result IS 'pass, fail, or conditional (allow with noted defects)';
COMMENT ON COLUMN public.quality_checks.defect_photos IS 'Array of storage object paths in defect-photos bucket';
