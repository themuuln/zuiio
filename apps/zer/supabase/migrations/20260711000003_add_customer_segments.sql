-- =============================================
-- Customer Segments
--
-- Configurable customer segmentation for temple
-- commerce pricing and filtering.
-- =============================================

-- 1. Customer Segments table
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT customer_segments_org_slug_unique UNIQUE (organization_id, slug)
);

-- 2. Add segment FK to contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS customer_segment_id UUID REFERENCES public.customer_segments(id) ON DELETE SET NULL;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_cs_org ON public.customer_segments(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_segment ON public.contacts(customer_segment_id) WHERE customer_segment_id IS NOT NULL;

-- 4. RLS
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_select" ON public.customer_segments
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('contacts.read')
  );

CREATE POLICY "cs_insert" ON public.customer_segments
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('contacts.create')
  );

CREATE POLICY "cs_update" ON public.customer_segments
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('contacts.update')
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('contacts.update')
  );

CREATE POLICY "cs_delete" ON public.customer_segments
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('contacts.delete')
  );

-- 5. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_segments TO authenticated;
