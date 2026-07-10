-- Migration: Add Price Rules Engine
-- Enables orgs to define vehicle-model-based pricing rules with a fallback chain:
--   vehicle_model_parts.specific_price → matching price_rule → price_history → default_price

-- ============================================================
-- 1. Add vehicle class to vehicle_models (luxury / standard / economy / performance)
-- ============================================================
ALTER TABLE public.vehicle_models
  ADD COLUMN IF NOT EXISTS class text CHECK (class IN ('luxury', 'standard', 'economy', 'performance'));

COMMENT ON COLUMN public.vehicle_models.class IS 'Vehicle pricing class: luxury, standard, economy, or performance. Used by price rules engine.';

-- ============================================================
-- 2. Price rules table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.price_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,

  -- What this rule applies to
  apply_to text NOT NULL DEFAULT 'both'
    CHECK (apply_to IN ('part', 'service', 'both')),

  -- Which vehicles this rule targets (jsonb for flexibility)
  -- Example: {"makes": ["Lexus"], "fuel_types": ["hybrid"]}
  -- Example: {"classes": ["luxury"]}
  -- Example: {"makes": ["Toyota"], "models": ["Harrier"], "years": {"start": 2020}}
  -- Example: {"body_types": ["suv"]}
  -- Example: {} (all vehicles / catch-all)
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  conditions_description text,

  -- What adjustment to make
  --   multiply          → price * value
  --   add_fixed         → price + value
  --   set_fixed         → price = value (absolute)
  --   percentage_add    → price * (1 + value/100)
  --   percentage_sub    → price * (1 - value/100)
  operator text NOT NULL CHECK (
    operator IN ('multiply', 'add_fixed', 'set_fixed', 'percentage_add', 'percentage_sub')
  ),

  -- The numeric value for the operator
  -- multiply: 1.3 = 30% markup
  -- add_fixed: 20000 = +20,000₮
  -- set_fixed: 150000 = exactly 150,000₮
  -- percentage_add: 15 = +15%
  -- percentage_sub: 10 = -10%
  value numeric(12,2) NOT NULL,

  -- Priority: lower number = higher priority. First matching rule wins.
  priority integer NOT NULL DEFAULT 100,

  -- Optional part/service category filter
  part_category text,
  service_category text,

  -- Optional part/service name pattern (ilike match)
  part_name_pattern text,
  service_name_pattern text,

  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate rules
  UNIQUE (organization_id, name)
);

COMMENT ON TABLE public.price_rules IS 'Vehicle-specific pricing rules with fallback chain. Rules are evaluated in priority order; first match wins.';

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_price_rules_org ON public.price_rules(organization_id);
CREATE INDEX idx_price_rules_active ON public.price_rules(organization_id, is_active);
CREATE INDEX idx_price_rules_priority ON public.price_rules(organization_id, priority, is_active);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.price_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_rules_select" ON public.price_rules
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "price_rules_insert" ON public.price_rules
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND created_by IS NOT DISTINCT FROM auth.uid()
  );

CREATE POLICY "price_rules_update" ON public.price_rules
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "price_rules_delete" ON public.price_rules
  FOR DELETE TO authenticated
  USING (organization_id = get_user_organization_id());

-- ============================================================
-- Trigger for updated_at
-- ============================================================
CREATE TRIGGER set_updated_at_price_rules
  BEFORE UPDATE ON public.price_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Seed default rules for existing demo org
-- ============================================================
DO $$
DECLARE
  org_id CONSTANT uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Set class on existing vehicle models for the demo org
  UPDATE public.vehicle_models SET class = 'luxury'
    WHERE organization_id = org_id
    AND make IN ('Lexus', 'BMW', 'Mercedes-Benz', 'Audi', 'Land Rover', 'Porsche', 'Genesis');

  UPDATE public.vehicle_models SET class = 'standard'
    WHERE organization_id = org_id
    AND make IN ('Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Hyundai', 'Kia', 'Volkswagen', 'Ford', 'Chevrolet');

  UPDATE public.vehicle_models SET class = 'performance'
    WHERE organization_id = org_id
    AND model IN ('GR Corolla', 'GR Yaris', 'GR Supra', 'GR86', 'LFA', 'LC', 'RC F', 'M3', 'M4', 'M5', 'AMG', '911', 'Cayman', 'Boxster');

  -- Classify remaining unset models as 'standard'
  UPDATE public.vehicle_models SET class = 'standard'
    WHERE organization_id = org_id AND class IS NULL;

  -- Insert seed pricing rules (created_by = NULL since demo auth user may not exist)
  INSERT INTO public.price_rules (organization_id, name, description, apply_to, conditions, conditions_description, operator, value, priority, part_category, service_category, created_by) VALUES
    (org_id, 'Luxury parts × 1.25', '25% markup on parts for luxury vehicles', 'part',
      '{"classes": ["luxury"]}'::jsonb, 'Luxury vehicles (Lexus, BMW, Mercedes, etc.)',
      'multiply', 1.25, 80, NULL, NULL, NULL),
    (org_id, 'Luxury services × 1.20', '20% markup on services for luxury vehicles', 'service',
      '{"classes": ["luxury"]}'::jsonb, 'Luxury vehicles (Lexus, BMW, Mercedes, etc.)',
      'multiply', 1.20, 80, NULL, NULL, NULL),
    (org_id, 'Performance parts × 1.15', '15% markup on parts for performance vehicles', 'part',
      '{"classes": ["performance"]}'::jsonb, 'Performance vehicles (GR, AMG, M, Porsche)',
      'multiply', 1.15, 85, NULL, NULL, NULL),
    (org_id, 'Economy parts × 0.90', '10% discount on parts for economy vehicles', 'part',
      '{"classes": ["economy"]}'::jsonb, 'Economy vehicles — competitive pricing',
      'multiply', 0.90, 90, NULL, NULL, NULL),
    (org_id, 'Hybrid surcharge', '+₮20,000 for hybrid vehicle services (diagnostic complexity)', 'service',
      '{"fuel_types": ["hybrid", "plug-in-hybrid"]}'::jsonb, 'Hybrid and plug-in hybrid vehicles',
      'add_fixed', 20000, 50, NULL, 'Diagnostic', NULL),
    (org_id, 'Lexus RX brake fixed price', 'Fixed price for Lexus RX brake services', 'service',
      '{"makes": ["Lexus"], "models": ["RX"], "body_types": ["suv"]}'::jsonb, 'Lexus RX brake service',
      'set_fixed', 120000, 30, NULL, 'Brakes', NULL),
    (org_id, 'Premium oil for luxury', 'Synthetic oil price for luxury vehicles', 'part',
      '{"classes": ["luxury"], "fuel_types": ["gasoline", "hybrid"]}'::jsonb, 'Luxury gasoline/hybrid → premium oil price',
      'multiply', 1.30, 40, 'Тос, шингэн', NULL, NULL)
  ON CONFLICT (organization_id, name) DO NOTHING;

END $$;
