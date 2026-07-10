-- Create shared_reports table for public report sharing
CREATE TABLE IF NOT EXISTS public.shared_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for token lookups (used by public report page)
CREATE INDEX IF NOT EXISTS idx_shared_reports_token ON public.shared_reports(token);

-- Index for organization queries
CREATE INDEX IF NOT EXISTS idx_shared_reports_organization_id ON public.shared_reports(organization_id);

-- Index for upsert lookups (organization + date range)
CREATE INDEX IF NOT EXISTS idx_shared_reports_org_date_range
    ON public.shared_reports(organization_id, date_from, date_to);

-- Enable RLS
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies: authenticated users can manage their own org's share links
CREATE POLICY "shared_reports_select_own_org" ON public.shared_reports
    FOR SELECT USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "shared_reports_insert_own_org" ON public.shared_reports
    FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()));

CREATE POLICY "shared_reports_update_own_org" ON public.shared_reports
    FOR UPDATE USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "shared_reports_delete_own_org" ON public.shared_reports
    FOR DELETE USING (organization_id = (SELECT get_current_organization()));
