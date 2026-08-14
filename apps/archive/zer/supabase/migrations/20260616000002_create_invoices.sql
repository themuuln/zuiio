-- Create invoices table for invoicing with public share links
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    total_amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partially_paid', 'overdue', 'cancelled')),
    notes TEXT,
    token TEXT UNIQUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    total_price NUMERIC NOT NULL DEFAULT 0
);

-- Auto-generate invoice numbers
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('public.invoice_number_seq')::TEXT, 4, '0');
$$;

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "invoices_select_own_org" ON public.invoices
    FOR SELECT USING (
        organization_id = (SELECT get_current_organization())
        OR token IS NOT NULL -- public access via token
    );

CREATE POLICY "invoices_insert_own_org" ON public.invoices
    FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()));

CREATE POLICY "invoices_update_own_org" ON public.invoices
    FOR UPDATE USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "invoices_delete_own_org" ON public.invoices
    FOR DELETE USING (organization_id = (SELECT get_current_organization()));

-- RLS policies for invoice_items
CREATE POLICY "invoice_items_select_own_org" ON public.invoice_items
    FOR SELECT USING (
        invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = (SELECT get_current_organization()))
        OR invoice_id IN (SELECT id FROM public.invoices WHERE token IS NOT NULL)
    );

CREATE POLICY "invoice_items_insert_own_org" ON public.invoice_items
    FOR INSERT WITH CHECK (
        invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = (SELECT get_current_organization()))
    );

CREATE POLICY "invoice_items_update_own_org" ON public.invoice_items
    FOR UPDATE USING (
        invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = (SELECT get_current_organization()))
    );

CREATE POLICY "invoice_items_delete_own_org" ON public.invoice_items
    FOR DELETE USING (
        invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = (SELECT get_current_organization()))
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_token ON public.invoices(token);
CREATE INDEX IF NOT EXISTS idx_invoices_contact_id ON public.invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
