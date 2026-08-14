-- =============================================
-- Delivery Management System
--
-- Extensible provider-based delivery tracking:
-- - Internal couriers (staff-based, MVP)
-- - Future: Lopom, MobiSend, food delivery APIs
-- - Webhook support for provider status updates
-- =============================================

-- 1. Delivery Providers (pluggable: internal, lopom, mobisend, ...)
CREATE TABLE IF NOT EXISTS public.delivery_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL DEFAULT 'internal',
  name TEXT NOT NULL,
  api_key TEXT,
  api_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.delivery_providers IS 'Pluggable delivery providers (internal, Lopom, MobiSend, etc.)';
COMMENT ON COLUMN public.delivery_providers.provider_type IS 'internal | lopom | mobisend | ...';
COMMENT ON COLUMN public.delivery_providers.config IS 'Provider-specific configuration (JSON)';

-- 2. Delivery Zones (pricing by area)
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  free_delivery_threshold NUMERIC(12,2),
  estimated_delivery_minutes INT DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.delivery_zones IS 'Delivery pricing zones per organization';

-- 3. Deliveries (main tracking table)
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.delivery_providers(id),
  zone_id UUID REFERENCES public.delivery_zones(id),

  -- Contact & address
  address TEXT,
  address_note TEXT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,

  -- External tracking (for third-party providers)
  external_tracking_id TEXT,
  external_tracking_url TEXT,

  -- Scheduling
  requested_at TIMESTAMPTZ,
  estimated_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending → assigned → picked_up → in_transit → delivered
  -- pending → cancelled
  -- assigned → cancelled
  -- in_transit → failed → pending (retry)

  assigned_to UUID REFERENCES public.profiles(id),

  -- Pricing
  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Metadata
  notes TEXT,
  courier_notes TEXT,
  provider_data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.deliveries IS 'Delivery tracking for sales orders';
COMMENT ON COLUMN public.deliveries.status IS 'pending | assigned | picked_up | in_transit | delivered | cancelled | failed';
COMMENT ON COLUMN public.deliveries.provider_data IS 'Raw provider response data for extensibility';

-- 4. Delivery Status History (audit trail)
CREATE TABLE IF NOT EXISTS public.delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.delivery_status_history IS 'Audit trail for delivery status changes';

-- 5. Delivery Webhook Configs (for external provider push updates)
CREATE TABLE IF NOT EXISTS public.delivery_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.delivery_providers(id),
  webhook_path TEXT NOT NULL,
  secret_token TEXT,
  is_active BOOLEAN DEFAULT true,
  last_called_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.delivery_webhooks IS 'Webhook configurations for external delivery providers to push status updates';

-- 6. Add tracking flag to organization settings
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS has_delivery_tracking BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.organizations.has_delivery_tracking IS 'Enable delivery management feature';

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_org_status ON public.deliveries(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_sale_id ON public.deliveries(sale_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_assigned_to ON public.deliveries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_org ON public.delivery_zones(organization_id);
CREATE INDEX IF NOT EXISTS idx_delivery_providers_org ON public.delivery_providers(organization_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status_history_delivery ON public.delivery_status_history(delivery_id);

-- 8. Row Level Security
ALTER TABLE public.delivery_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_webhooks ENABLE ROW LEVEL SECURITY;

-- Organization-scoped access
CREATE POLICY "delivery_providers_org_access" ON public.delivery_providers
  USING (organization_id = get_current_organization());

CREATE POLICY "delivery_zones_org_access" ON public.delivery_zones
  USING (organization_id = get_current_organization());

CREATE POLICY "deliveries_org_access" ON public.deliveries
  USING (organization_id = get_current_organization());

CREATE POLICY "delivery_status_history_org_access" ON public.delivery_status_history
  USING (
    EXISTS (
      SELECT 1 FROM public.deliveries d
      WHERE d.id = delivery_id
      AND d.organization_id = get_current_organization()
    )
  );

CREATE POLICY "delivery_webhooks_org_access" ON public.delivery_webhooks
  USING (organization_id = get_current_organization());
