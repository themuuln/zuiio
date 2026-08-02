-- =============================================
-- Smart Promotions Engine
--
-- "Buy X get Y", "1+1", "2+1", free shipping,
-- order-threshold rewards.
-- =============================================

-- =============================================
-- 1. Add promotion permissions
-- =============================================
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'promotions.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'promotions.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'promotions.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'promotions.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 2. Promotions table
-- =============================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'buy_x_get_y',       -- Buy X quantity, get Y free (1+1, 2+1)
    'threshold_discount', -- Spend X, get Y% or Y₮ off
    'free_shipping',      -- Free shipping at threshold
    'bundle_discount'     -- Buy specific products together for discount
  )),
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  stackable BOOLEAN NOT NULL DEFAULT false,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 3. Promotion conditions
-- =============================================
CREATE TABLE IF NOT EXISTS public.promotion_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL CHECK (condition_type IN (
    'min_quantity',       -- At least N items in cart
    'min_amount',         -- At least X₮ subtotal
    'specific_products',  -- Specific product(s) in cart
    'specific_categories' -- Specific category(s) in cart
  )),
  operator TEXT NOT NULL DEFAULT 'gte' CHECK (operator IN ('eq', 'gte', 'lte')),
  condition_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 4. Promotion rewards
-- =============================================
CREATE TABLE IF NOT EXISTS public.promotion_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN (
    'free_product',        -- Specific product free
    'percentage_discount', -- % off entire order
    'fixed_discount',      -- Fixed amount off
    'free_shipping'        -- Free shipping
  )),
  reward_value NUMERIC(12, 2) NOT NULL,
  reward_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  reward_max_count INTEGER, -- For buy_x_get_y, max free items
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 5. Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_promotions_org ON public.promotions(organization_id);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_promotion_conditions_promo ON public.promotion_conditions(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_rewards_promo ON public.promotion_rewards(promotion_id);

-- =============================================
-- 6. RLS
-- =============================================
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_rewards ENABLE ROW LEVEL SECURITY;


-- =============================================
-- 7. Grants
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.promotion_conditions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.promotion_rewards TO authenticated;

-- =============================================
-- 8. Evaluation function
-- =============================================
-- Evaluates all active promotions for a given cart.
-- Returns JSON array of applicable promotions with calculated discounts.
CREATE OR REPLACE FUNCTION public.evaluate_promotions(
  p_org_id UUID,
  p_items JSONB,     -- [{product_id, quantity, unit_price, category_id}]
  p_subtotal NUMERIC
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_promo RECORD;
  v_condition RECORD;
  v_reward RECORD;
  v_result JSONB := '[]'::JSONB;
  v_conditions_met BOOLEAN;
  v_item JSONB;
  v_matching_qty NUMERIC;
  v_reward_amount NUMERIC;
BEGIN
  FOR v_promo IN
    SELECT p.* FROM public.promotions p
    WHERE p.organization_id = p_org_id
      AND p.is_active = true
      AND (p.valid_until IS NULL OR p.valid_until > now())
      AND (p.usage_limit IS NULL OR p.used_count < p.usage_limit)
    ORDER BY p.priority DESC, p.created_at ASC
  LOOP
    v_conditions_met := true;

    -- Check all conditions
    FOR v_condition IN
      SELECT * FROM public.promotion_conditions
      WHERE promotion_id = v_promo.id
    LOOP
      IF v_condition.condition_type = 'min_amount' THEN
        IF p_subtotal < v_condition.condition_value::NUMERIC THEN
          v_conditions_met := false;
          EXIT;
        END IF;
      ELSIF v_condition.condition_type = 'min_quantity' THEN
        v_matching_qty := 0;
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
          v_matching_qty := v_matching_qty + (v_item->>'quantity')::NUMERIC;
        END LOOP;
        IF v_matching_qty < v_condition.condition_value::NUMERIC THEN
          v_conditions_met := false;
          EXIT;
        END IF;
      ELSIF v_condition.condition_type = 'specific_products' THEN
        -- Check at least one matching product in cart
        v_matching_qty := 0;
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
          IF (v_item->>'product_id') = v_condition.condition_value THEN
            v_matching_qty := v_matching_qty + (v_item->>'quantity')::NUMERIC;
          END IF;
        END LOOP;
        IF v_matching_qty = 0 THEN
          v_conditions_met := false;
          EXIT;
        END IF;
      ELSIF v_condition.condition_type = 'specific_categories' THEN
        v_matching_qty := 0;
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
          IF (v_item->>'category_id') = v_condition.condition_value THEN
            v_matching_qty := v_matching_qty + (v_item->>'quantity')::NUMERIC;
          END IF;
        END LOOP;
        IF v_matching_qty = 0 THEN
          v_conditions_met := false;
          EXIT;
        END IF;
      END IF;
    END LOOP;

    -- If conditions met, calculate reward
    IF v_conditions_met THEN
      SELECT * INTO v_reward FROM public.promotion_rewards
      WHERE promotion_id = v_promo.id LIMIT 1;

      v_reward_amount := 0;

      IF v_reward.reward_type = 'percentage_discount' THEN
        v_reward_amount := p_subtotal * v_reward.reward_value / 100;
      ELSIF v_reward.reward_type = 'fixed_discount' THEN
        v_reward_amount := v_reward.reward_value;
      ELSIF v_reward.reward_type = 'free_shipping' THEN
        v_reward_amount := v_reward.reward_value; -- shipping cost
      END IF;

      v_result := v_result || jsonb_build_object(
        'promotion_id', v_promo.id,
        'promotion_name', v_promo.name,
        'promotion_type', v_promo.type,
        'reward_type', v_reward.reward_type,
        'reward_amount', v_reward_amount,
        'reward_product_id', v_reward.reward_product_id,
        'stackable', v_promo.stackable
      );
    END IF;
  END LOOP;

  RETURN json_build_object('promotions', v_result, 'count', jsonb_array_length(v_result));
END;
$$;

GRANT EXECUTE ON FUNCTION public.evaluate_promotions(UUID, JSONB, NUMERIC) TO authenticated;
