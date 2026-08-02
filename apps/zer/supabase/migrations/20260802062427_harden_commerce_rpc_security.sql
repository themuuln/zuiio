-- Keep the checkout RPCs available to authenticated users while preventing
-- cross-tenant access and invalid financial mutations through direct RPC calls.

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
  IF auth.uid() IS NOT NULL
     AND (public.get_current_organization() IS DISTINCT FROM p_organization_id
       OR auth.uid() IS DISTINCT FROM p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Байгууллагын мэдээлэл буруу байна.');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Зарцуулах дүн буруу байна.');
  END IF;

  IF p_sale_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.sales
       WHERE id = p_sale_id
         AND organization_id = p_organization_id
     ) THEN
    RETURN json_build_object('success', false, 'error', 'Борлуулалтын мэдээлэл олдсонгүй.');
  END IF;

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
  IF p_org_id IS NULL
     OR (auth.uid() IS NOT NULL AND public.get_current_organization() IS DISTINCT FROM p_org_id)
     OR p_items IS NULL
     OR jsonb_typeof(p_items) <> 'array'
     OR p_subtotal IS NULL
     OR p_subtotal < 0 THEN
    RETURN json_build_object('promotions', v_result, 'count', 0);
  END IF;

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

REVOKE EXECUTE ON FUNCTION public.redeem_gift_card(UUID, UUID, NUMERIC, UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.evaluate_promotions(UUID, JSONB, NUMERIC) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_gift_card(UUID, UUID, NUMERIC, UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.evaluate_promotions(UUID, JSONB, NUMERIC) FROM anon;
GRANT EXECUTE ON FUNCTION public.redeem_gift_card(UUID, UUID, NUMERIC, UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.evaluate_promotions(UUID, JSONB, NUMERIC) TO authenticated, service_role;
