-- Reconcile remote environments where the original commerce migrations are
-- recorded as applied but their objects are missing.

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC(12, 2) NOT NULL,
  min_purchase_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC(12, 2),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'selected_products', 'selected_categories')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_org ON public.coupons (organization_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (organization_id, code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons (organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_contact ON public.coupon_usage (contact_id);

CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  initial_balance NUMERIC(12, 2) NOT NULL CHECK (initial_balance > 0),
  current_balance NUMERIC(12, 2) NOT NULL CHECK (current_balance >= 0),
  currency_code TEXT NOT NULL DEFAULT 'MNT',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  recipient_name TEXT,
  recipient_email TEXT,
  sender_name TEXT,
  message TEXT,
  issued_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('issuance', 'topup', 'redemption', 'expiry', 'adjustment')),
  amount NUMERIC(12, 2) NOT NULL,
  balance_before NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_org ON public.gift_cards (organization_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards (organization_id, code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_active ON public.gift_cards (organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gct_gift_card ON public.gift_card_transactions (gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gct_org ON public.gift_card_transactions (organization_id);

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('buy_x_get_y', 'threshold_discount', 'free_shipping', 'bundle_discount')),
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

CREATE TABLE IF NOT EXISTS public.promotion_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('min_quantity', 'min_amount', 'specific_products', 'specific_categories')),
  operator TEXT NOT NULL DEFAULT 'gte' CHECK (operator IN ('eq', 'gte', 'lte')),
  condition_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotion_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('free_product', 'percentage_discount', 'fixed_discount', 'free_shipping')),
  reward_value NUMERIC(12, 2) NOT NULL,
  reward_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  reward_max_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_org ON public.promotions (organization_id);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions (type);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions (organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_promotion_conditions_promo ON public.promotion_conditions (promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_rewards_promo ON public.promotion_rewards (promotion_id);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_rewards ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT SELECT, INSERT ON public.coupon_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_cards TO authenticated;
GRANT SELECT, INSERT ON public.gift_card_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.promotion_conditions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.promotion_rewards TO authenticated;
GRANT ALL PRIVILEGES ON public.coupons, public.coupon_usage, public.gift_cards, public.gift_card_transactions, public.promotions, public.promotion_conditions, public.promotion_rewards TO service_role;

CREATE OR REPLACE FUNCTION public.redeem_gift_card(
  p_gift_card_id UUID,
  p_organization_id UUID,
  p_amount NUMERIC,
  p_sale_id UUID,
  p_user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_redeem_amount NUMERIC;
BEGIN
  SELECT current_balance INTO v_current_balance
  FROM public.gift_cards
  WHERE id = p_gift_card_id
    AND organization_id = p_organization_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Бэлгийн карт олдсонгүй эсвэл идэвхгүй байна.');
  END IF;

  v_redeem_amount := LEAST(p_amount, v_current_balance);

  UPDATE public.gift_cards
  SET current_balance = v_current_balance - v_redeem_amount
  WHERE id = p_gift_card_id;

  INSERT INTO public.gift_card_transactions
    (gift_card_id, organization_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, created_by)
  VALUES
    (p_gift_card_id, p_organization_id, 'redemption', v_redeem_amount, v_current_balance, v_current_balance - v_redeem_amount, 'sale', p_sale_id, p_user_id);

  RETURN json_build_object(
    'success', true,
    'redeemed_amount', v_redeem_amount,
    'remaining_balance', v_current_balance - v_redeem_amount
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.evaluate_promotions(
  p_org_id UUID,
  p_items JSONB,
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

    IF v_conditions_met THEN
      SELECT * INTO v_reward FROM public.promotion_rewards
      WHERE promotion_id = v_promo.id LIMIT 1;

      v_reward_amount := 0;

      IF v_reward.reward_type = 'percentage_discount' THEN
        v_reward_amount := p_subtotal * v_reward.reward_value / 100;
      ELSIF v_reward.reward_type IN ('fixed_discount', 'free_shipping') THEN
        v_reward_amount := v_reward.reward_value;
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

GRANT EXECUTE ON FUNCTION public.redeem_gift_card(UUID, UUID, NUMERIC, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_promotions(UUID, JSONB, NUMERIC) TO authenticated;

DROP POLICY IF EXISTS coupons_select_own_org ON public.coupons;
CREATE POLICY coupons_select_own_org ON public.coupons FOR SELECT USING (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('coupons.read'::public.app_permission)
);
DROP POLICY IF EXISTS coupons_insert_own_org ON public.coupons;
CREATE POLICY coupons_insert_own_org ON public.coupons FOR INSERT WITH CHECK (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('coupons.create'::public.app_permission)
);
DROP POLICY IF EXISTS coupons_update_own_org ON public.coupons;
CREATE POLICY coupons_update_own_org ON public.coupons FOR UPDATE USING (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('coupons.update'::public.app_permission)
) WITH CHECK (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('coupons.update'::public.app_permission)
);
DROP POLICY IF EXISTS coupons_delete_own_org ON public.coupons;
CREATE POLICY coupons_delete_own_org ON public.coupons FOR DELETE USING (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('coupons.delete'::public.app_permission)
);

DROP POLICY IF EXISTS coupon_usage_select_own_org ON public.coupon_usage;
CREATE POLICY coupon_usage_select_own_org ON public.coupon_usage FOR SELECT USING (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('sales.read'::public.app_permission)
);
DROP POLICY IF EXISTS coupon_usage_insert_own_org ON public.coupon_usage;
CREATE POLICY coupon_usage_insert_own_org ON public.coupon_usage FOR INSERT WITH CHECK (
  organization_id = (SELECT public.get_current_organization())
  AND (public.has_permission('sales.create'::public.app_permission) OR public.has_permission('coupons.update'::public.app_permission))
);

DROP POLICY IF EXISTS gift_cards_select_own_org ON public.gift_cards;
CREATE POLICY gift_cards_select_own_org ON public.gift_cards FOR SELECT USING (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('gift_cards.read'::public.app_permission)
);
DROP POLICY IF EXISTS gift_cards_insert_own_org ON public.gift_cards;
CREATE POLICY gift_cards_insert_own_org ON public.gift_cards FOR INSERT WITH CHECK (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('gift_cards.create'::public.app_permission)
);
DROP POLICY IF EXISTS gift_cards_update_own_org ON public.gift_cards;
CREATE POLICY gift_cards_update_own_org ON public.gift_cards FOR UPDATE USING (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('gift_cards.update'::public.app_permission)
) WITH CHECK (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('gift_cards.update'::public.app_permission)
);
DROP POLICY IF EXISTS gift_cards_delete_own_org ON public.gift_cards;
CREATE POLICY gift_cards_delete_own_org ON public.gift_cards FOR DELETE USING (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('gift_cards.delete'::public.app_permission)
);

DROP POLICY IF EXISTS gct_select_own_org ON public.gift_card_transactions;
CREATE POLICY gct_select_own_org ON public.gift_card_transactions FOR SELECT USING (
  organization_id = (SELECT public.get_current_organization())
  AND (public.has_permission('gift_cards.read'::public.app_permission) OR public.has_permission('sales.read'::public.app_permission))
);
DROP POLICY IF EXISTS gct_insert_own_org ON public.gift_card_transactions;
CREATE POLICY gct_insert_own_org ON public.gift_card_transactions FOR INSERT WITH CHECK (
  organization_id = (SELECT public.get_current_organization())
  AND (public.has_permission('gift_cards.update'::public.app_permission) OR public.has_permission('sales.create'::public.app_permission))
);

DROP POLICY IF EXISTS promotions_select_own_org ON public.promotions;
CREATE POLICY promotions_select_own_org ON public.promotions FOR SELECT USING (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('promotions.read'::public.app_permission)
);
DROP POLICY IF EXISTS promotions_insert_own_org ON public.promotions;
CREATE POLICY promotions_insert_own_org ON public.promotions FOR INSERT WITH CHECK (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('promotions.create'::public.app_permission)
);
DROP POLICY IF EXISTS promotions_update_own_org ON public.promotions;
CREATE POLICY promotions_update_own_org ON public.promotions FOR UPDATE USING (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('promotions.update'::public.app_permission)
) WITH CHECK (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('promotions.update'::public.app_permission)
);
DROP POLICY IF EXISTS promotions_delete_own_org ON public.promotions;
CREATE POLICY promotions_delete_own_org ON public.promotions FOR DELETE USING (
  organization_id = (SELECT public.get_current_organization())
  AND public.has_permission('promotions.delete'::public.app_permission)
);

DROP POLICY IF EXISTS promotion_conditions_select ON public.promotion_conditions;
CREATE POLICY promotion_conditions_select ON public.promotion_conditions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.promotions p WHERE p.id = promotion_id AND p.organization_id = (SELECT public.get_current_organization()) AND public.has_permission('promotions.read'::public.app_permission))
);
DROP POLICY IF EXISTS promotion_conditions_insert ON public.promotion_conditions;
CREATE POLICY promotion_conditions_insert ON public.promotion_conditions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.promotions p WHERE p.id = promotion_id AND p.organization_id = (SELECT public.get_current_organization()) AND public.has_permission('promotions.create'::public.app_permission))
);
DROP POLICY IF EXISTS promotion_conditions_delete ON public.promotion_conditions;
CREATE POLICY promotion_conditions_delete ON public.promotion_conditions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.promotions p WHERE p.id = promotion_id AND p.organization_id = (SELECT public.get_current_organization()) AND public.has_permission('promotions.update'::public.app_permission))
);

DROP POLICY IF EXISTS promotion_rewards_select ON public.promotion_rewards;
CREATE POLICY promotion_rewards_select ON public.promotion_rewards FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.promotions p WHERE p.id = promotion_id AND p.organization_id = (SELECT public.get_current_organization()) AND public.has_permission('promotions.read'::public.app_permission))
);
DROP POLICY IF EXISTS promotion_rewards_insert ON public.promotion_rewards;
CREATE POLICY promotion_rewards_insert ON public.promotion_rewards FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.promotions p WHERE p.id = promotion_id AND p.organization_id = (SELECT public.get_current_organization()) AND public.has_permission('promotions.create'::public.app_permission))
);
DROP POLICY IF EXISTS promotion_rewards_delete ON public.promotion_rewards;
CREATE POLICY promotion_rewards_delete ON public.promotion_rewards FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.promotions p WHERE p.id = promotion_id AND p.organization_id = (SELECT public.get_current_organization()) AND public.has_permission('promotions.update'::public.app_permission))
);
