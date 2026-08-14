-- Create audit_log table for tracking all changes
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', etc.
    entity_type TEXT NOT NULL, -- 'product', 'sale', 'expense', 'contact', 'invoice', etc.
    entity_id UUID NOT NULL,
    field_changes JSONB, -- { "field_name": { "old": "val", "new": "val" } }
    summary TEXT, -- Human-readable description of what happened
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "audit_log_select_own_org" ON public.audit_log
    FOR SELECT USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "audit_log_insert_own_org" ON public.audit_log
    FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_organization_id ON public.audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON public.audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON public.audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
