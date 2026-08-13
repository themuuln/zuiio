-- =============================================
-- Storefront loyalty points + hardware config (2026-08-13)
--
--   1. G-LOYALTY (storefront slice): earn/spend wiring.
--      * sales.points_redeemed — ledger trace of points spent on an order.
--      * get_public_loyalty(slug) — buyer-facing RPC: balance, earn rules,
--        points history, redeemable rewards. Buyer identity = the contact
--        matched by the signed-in store_account's phone/email within the
--        org (points are org-scoped; one buyer can shop many stores).
--      * submit_shop_order gains p_redeem_points: server-priced points
--        discount (points / points_per_mnt, capped at the payable amount,
--        applied before gift card) + automatic earn on the net merchandise
--        amount. Both are one transaction with the sale insert, so the
--        idempotency replay path can never double-award.
--   2. M-HW (hardware slice): ESC/POS printer + cash drawer config.
--      * organizations.has_cash_drawer — open the drawer kick on cash sales.
--      * organizations.escpos_host / escpos_port — network ESC/POS printer
--        (raw TCP 9100). When set, the POS prints through the ESC/POS
--        driver instead of the browser print dialog.
-- =============================================

-- ─────────────────────────────────────────────
-- 1. Hardware columns on organizations
-- ─────────────────────────────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS has_cash_drawer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS escpos_host text,
  ADD COLUMN IF NOT EXISTS escpos_port integer DEFAULT 9100;

COMMENT ON COLUMN public.organizations.has_cash_drawer IS
  'Open the cash drawer (ESC/POS kick pulse) whenever a cash sale completes in the POS register.';
COMMENT ON COLUMN public.organizations.escpos_host IS
  'Network ESC/POS receipt printer host (IP or hostname). Empty = no ESC/POS printer configured; receipts fall back to the browser print dialog.';
COMMENT ON COLUMN public.organizations.escpos_port IS
  'Network ESC/POS printer port (raw TCP, typically 9100).';

-- ─────────────────────────────────────────────
-- 2. sales.points_redeemed — ledger trace
-- ─────────────────────────────────────────────
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS points_redeemed integer;

COMMENT ON COLUMN public.sales.points_redeemed IS
  'Loyalty points the buyer redeemed on this order (0/NULL = none). The resulting discount is folded into discount_amount; points_discount is returned by submit_shop_order.';

-- ─────────────────────────────────────────────
-- 3. loyalty_points history index (points page)
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_loyalty_points_org_customer_created
  ON public.loyalty_points (organization_id, customer_id, created_at DESC);

-- ─────────────────────────────────────────────
-- 4. get_public_loyalty — buyer loyalty overview
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_public_loyalty(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_settings RECORD;
  v_contact RECORD;
  v_history jsonb;
  v_rewards jsonb;
BEGIN
  SELECT o.id INTO v_org_id
  FROM public.organizations o
  JOIN public.organization_public_profiles pp ON pp.organization_id = o.id
  WHERE o.slug = p_slug AND pp.catalog_enabled = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_settings
  FROM public.loyalty_settings
  WHERE organization_id = v_org_id;

  IF NOT FOUND OR v_settings.is_enabled IS NOT TRUE THEN
    RETURN jsonb_build_object(
      'enabled', false,
      'balance', 0,
      'points_per_mnt', 0,
      'min_purchase', 0,
      'history', '[]'::jsonb,
      'rewards', '[]'::jsonb
    );
  END IF;

  -- Buyer identity: contact matched by the store account's phone or email
  -- within this org. A phone match wins over an email match when both exist.
  SELECT c.id, COALESCE(c.points_balance, 0)::numeric AS balance
  INTO v_contact
  FROM public.store_accounts sa
  JOIN public.contacts c
    ON c.organization_id = v_org_id
   AND c.type = 'customer'
   AND (
     (sa.phone IS NOT NULL AND c.phone = sa.phone)
     OR (sa.email IS NOT NULL AND c.email = sa.email)
   )
  WHERE sa.id = auth.uid()
  ORDER BY (c.phone = sa.phone) DESC
  LIMIT 1;

  IF v_contact.id IS NULL THEN
    RETURN jsonb_build_object(
      'enabled', true,
      'balance', 0,
      'points_per_mnt', v_settings.points_per_mnt,
      'min_purchase', v_settings.min_purchase,
      'history', '[]'::jsonb,
      'rewards', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', id,
          'name', name,
          'description', description,
          'points_cost', points_cost,
          'discount_type', discount_type,
          'discount_value', discount_value
        ) ORDER BY points_cost), '[]'::jsonb)
        FROM public.loyalty_rewards
        WHERE organization_id = v_org_id AND is_active = true
      )
    );
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', lp.id,
    'points', lp.points,
    'type', lp.type,
    'notes', lp.notes,
    'reference_id', lp.reference_id,
    'created_at', lp.created_at
  ) ORDER BY lp.created_at DESC), '[]'::jsonb)
  INTO v_history
  FROM (
    SELECT lp.id, lp.points, lp.type, lp.notes, lp.reference_id, lp.created_at
    FROM public.loyalty_points lp
    WHERE lp.organization_id = v_org_id AND lp.customer_id = v_contact.id
    ORDER BY lp.created_at DESC
    LIMIT 50
  ) lp;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'name', name,
    'description', description,
    'points_cost', points_cost,
    'discount_type', discount_type,
    'discount_value', discount_value
  ) ORDER BY points_cost), '[]'::jsonb)
  INTO v_rewards
  FROM public.loyalty_rewards
  WHERE organization_id = v_org_id AND is_active = true;

  RETURN jsonb_build_object(
    'enabled', true,
    'balance', v_contact.balance,
    'points_per_mnt', v_settings.points_per_mnt,
    'min_purchase', v_settings.min_purchase,
    'history', v_history,
    'rewards', v_rewards
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_loyalty(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_loyalty(text) TO authenticated;

-- ─────────────────────────────────────────────
-- 5. submit_shop_order — loyalty earn/spend
-- ─────────────────────────────────────────────
-- Drop every historical signature before the rewrite (matches the original
-- migration's approach).
DROP FUNCTION IF EXISTS public.submit_shop_order(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.submit_shop_order(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.submit_shop_order(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.submit_shop_order(
  p_org_slug TEXT,
  p_items JSONB,
  p_payment_method TEXT DEFAULT 'cash',
  p_currency_code TEXT DEFAULT 'MNT',
  p_contact_name TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_branch_slug TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_delivery_type TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_address_note TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_coupon_code TEXT DEFAULT NULL,
  p_gift_card_code TEXT DEFAULT NULL,
  p_pickup_branch_slug TEXT DEFAULT NULL,
  p_redeem_points INTEGER DEFAULT 0
)
RETURNS TABLE(
  order_id UUID,
  total_amount NUMERIC,
  status TEXT,
  delivery_fee NUMERIC,
  discount_amount NUMERIC,
  gift_card_amount NUMERIC,
  payment_instructions JSONB,
  points_discount NUMERIC,
  points_redeemed INTEGER,
  points_earned INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_profile RECORD;                 -- org public profile (checkout config)
  v_branch_id UUID;
  v_sale_id UUID;
  v_contact_id UUID;
  v_store_account_id UUID;
  v_total NUMERIC := 0;             -- item subtotal (server-priced)
  v_item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_qty NUMERIC;
  v_unit_price NUMERIC;
  v_current_stock NUMERIC;
  v_agg RECORD;
  v_recent_pending INT;
  v_recent_phone INT;
  -- Dedicated lookup targets for the idempotency pre-check: a zero-row
  -- SELECT ... INTO sets its targets to NULL, which would clobber state.
  v_existing_id UUID;
  v_existing_total NUMERIC;
  v_existing_status TEXT;
  v_existing_fee NUMERIC;
  v_existing_discount NUMERIC;
  v_existing_gift NUMERIC;
  -- Delivery
  v_delivery_type TEXT;
  v_address TEXT;
  v_address_note TEXT;
  v_fee NUMERIC := 0;
  -- Coupon
  v_coupon RECORD;
  v_coupon_id UUID;
  v_coupon_discount NUMERIC := 0;
  v_coupon_usage_count INT;
  v_eligible_subtotal NUMERIC := 0;  -- server-priced sum of the cart lines a scoped coupon may discount
  -- Promotion (best single monetary discount + optional free shipping)
  v_promo RECORD;
  v_cond RECORD;
  v_reward RECORD;
  v_conditions_met BOOLEAN;
  v_cart_qty NUMERIC;
  v_threshold_qty NUMERIC;
  v_free_units NUMERIC;
  v_free_unit_price NUMERIC;
  v_best_discount NUMERIC := 0;
  v_best_promo_id UUID;
  v_free_shipping BOOLEAN := false;
  v_free_shipping_promo_id UUID;
  v_promotion_id UUID;
  v_promotion_discount NUMERIC := 0;
  -- Gift card
  v_gift_card RECORD;
  v_gift_card_id UUID;
  v_gift_amt NUMERIC := 0;
  -- Loyalty (storefront earn/spend)
  v_points_per_mnt NUMERIC := 0;
  v_min_purchase NUMERIC := 0;
  v_loyalty_enabled BOOLEAN := false;
  v_buyer_contact_id UUID;
  v_buyer_balance NUMERIC := 0;
  v_points_redeemed INTEGER := 0;
  v_points_discount NUMERIC := 0;
  v_points_earned INTEGER := 0;
  -- Totals
  v_discount_total NUMERIC := 0;
  v_payable NUMERIC := 0;
  v_total_amount NUMERIC := 0;
  v_payment_instructions JSONB;
BEGIN
  -- 0. Resolve storefront org by public slug; catalog must be enabled.
  SELECT o.id, o.name INTO v_org_id, v_org_name
  FROM public.organizations o
  JOIN public.organization_public_profiles pp ON pp.organization_id = o.id
  WHERE o.slug = p_org_slug
    AND pp.catalog_enabled = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Дэлгүүр олдсонгүй';
  END IF;

  -- Full profile row (composite assignment — must use SELECT * INTO for a
  -- RECORD; a single composite column leaves the record structure
  -- indeterminate in plpgsql).
  SELECT * INTO v_profile
  FROM public.organization_public_profiles pp
  WHERE pp.organization_id = v_org_id;

  -- 0.2 Payment instructions for bank transfer / QPay (null when unset).
  SELECT jsonb_build_object(
    'bank_name', pp.payment_bank_name,
    'bank_account', pp.payment_bank_account,
    'account_name', pp.payment_account_name,
    'qpay_qr_url', pp.qpay_qr_url
  ) INTO v_payment_instructions
  FROM public.organization_public_profiles pp
  WHERE pp.organization_id = v_org_id
    AND (pp.payment_bank_name IS NOT NULL
      OR pp.payment_bank_account IS NOT NULL
      OR pp.payment_account_name IS NOT NULL
      OR pp.qpay_qr_url IS NOT NULL);

  -- 0.5 Idempotent replay — a retry after a crash must return the order
  -- created by the first attempt, never create a second one.
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT s.id, s.total_amount, s.status,
           s.delivery_fee, s.discount_amount, s.gift_card_amount
    INTO v_existing_id, v_existing_total, v_existing_status,
         v_existing_fee, v_existing_discount, v_existing_gift
    FROM public.sales s
    WHERE s.organization_id = v_org_id AND s.dedupe_key = p_idempotency_key;
    IF FOUND THEN
      RETURN QUERY
        SELECT v_existing_id, v_existing_total, COALESCE(v_existing_status, 'pending'::TEXT),
               COALESCE(v_existing_fee, 0), COALESCE(v_existing_discount, 0),
               COALESCE(v_existing_gift, 0), v_payment_instructions,
               0::NUMERIC, 0::INTEGER, 0::INTEGER;
      RETURN;
    END IF;
  END IF;

  -- 0.6 Flood protection — this is the public anon entry point, so both
  -- checks run BEFORE any stock validation work.
  SELECT count(*) INTO v_recent_pending
  FROM public.sales s
  WHERE s.organization_id = v_org_id
    AND s.status = 'pending'
    AND s.deleted_at IS NULL
    AND s.created_at > now() - interval '1 hour';
  IF v_recent_pending >= 20 THEN
    RAISE EXCEPTION 'Хэт олон захиалга ирсэн байна. Түр хүлээгээд дахин оролдоно уу.';
  END IF;

  IF p_contact_phone IS NOT NULL AND p_contact_phone <> '' THEN
    SELECT count(*) INTO v_recent_phone
    FROM public.sales s
    JOIN public.contacts c ON c.id = s.contact_id
    WHERE s.organization_id = v_org_id
      AND s.status = 'pending'
      AND s.deleted_at IS NULL
      AND c.phone = p_contact_phone
      AND s.created_at > now() - interval '1 hour';
    IF v_recent_phone >= 5 THEN
      RAISE EXCEPTION 'Хэт олон захиалга ирсэн байна. Түр хүлээгээд дахин оролдоно уу.';
    END IF;
  END IF;

  -- 1. Delivery vs pickup. NULL delivery_type = pickup WITHOUT the
  -- pickup_enabled gate (backward compat for legacy callers); an EXPLICIT
  -- 'pickup' requires the org to have enabled pickup.
  v_delivery_type := COALESCE(NULLIF(p_delivery_type, ''), 'pickup');
  IF v_delivery_type NOT IN ('delivery', 'pickup') THEN
    RAISE EXCEPTION 'Хүргэлтийн төрөл буруу байна';
  END IF;

  IF v_delivery_type = 'delivery' THEN
    IF v_profile.delivery_enabled IS NOT TRUE THEN
      RAISE EXCEPTION 'Хүргэлт ашиглах боломжгүй байна';
    END IF;
    IF p_address IS NULL OR btrim(p_address) = '' THEN
      RAISE EXCEPTION 'Хүргэлтийн хаяг оруулна уу';
    END IF;
    IF p_contact_name IS NULL OR btrim(p_contact_name) = ''
       OR p_contact_phone IS NULL OR btrim(p_contact_phone) = '' THEN
      RAISE EXCEPTION 'Холбогдох нэр, утасны дугаараа оруулна уу';
    END IF;
    v_address := p_address;
    v_address_note := p_address_note;
  ELSIF p_delivery_type IS NOT NULL AND btrim(p_delivery_type) <> '' THEN
    -- Explicit 'pickup' — org must have pickup enabled.
    IF v_profile.pickup_enabled IS NOT TRUE THEN
      RAISE EXCEPTION 'Дэлгүүрээс авах боломжгүй байна';
    END IF;
  END IF;

  -- 2. Resolve branch: pickup may name a branch (p_pickup_branch_slug or
  -- legacy p_branch_slug); delivery uses p_branch_slug. Default branch fallback.
  IF COALESCE(NULLIF(p_pickup_branch_slug, ''), NULLIF(p_branch_slug, '')) IS NOT NULL THEN
    SELECT b.id INTO v_branch_id
    FROM public.branches b
    WHERE b.organization_id = v_org_id
      AND b.slug = COALESCE(NULLIF(p_pickup_branch_slug, ''), NULLIF(p_branch_slug, ''));
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Салбар олдсонгүй';
    END IF;
  ELSE
    SELECT b.id INTO v_branch_id
    FROM public.branches b
    WHERE b.organization_id = v_org_id
      AND b.is_default = true
    LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Дэлгүүр салбар тохируулаагүй байна';
    END IF;
  END IF;

  -- 3. Validate item payload shape.
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Захиалгын мэдээлэл буруу байна';
  END IF;
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Захиалга хоосон байна';
  END IF;
  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Хэт олон бараа байна';
  END IF;

  -- 4. Validate stock + compute totals server-side (prices from DB, never client).
  --    Quantities are AGGREGATED per product/variant first so duplicate lines
  --    for the same product cannot collectively oversell the available stock.
  FOR v_agg IN
    SELECT product_id, variant_id, SUM(quantity)::numeric AS total_qty
    FROM (
      SELECT
        (i->>'product_id')::uuid AS product_id,
        NULLIF(i->>'variant_id', '')::uuid AS variant_id,
        (i->>'quantity')::numeric AS quantity
      FROM jsonb_array_elements(p_items) AS i
    ) AS lines
    GROUP BY product_id, variant_id
    ORDER BY product_id::text
  LOOP
    v_product_id := v_agg.product_id;
    v_variant_id := v_agg.variant_id;
    v_qty := v_agg.total_qty;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Барааны тоо буруу байна';
    END IF;
    IF v_qty > 999 THEN
      RAISE EXCEPTION 'Барааны тоо хэт их байна';
    END IF;

    SELECT p.sale_price, p.current_stock INTO v_unit_price, v_current_stock
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.organization_id = v_org_id
      AND p.deleted_at IS NULL
    FOR UPDATE;

    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'Бүтээгдэхүүн олдсонгүй';
    END IF;

    IF v_variant_id IS NOT NULL THEN
      SELECT pv.current_stock, COALESCE(pv.sale_price, v_unit_price)
      INTO v_current_stock, v_unit_price
      FROM public.product_variants pv
      WHERE pv.id = v_variant_id
        AND pv.product_id = v_product_id
      FOR UPDATE;

      IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Вариант олдсонгүй';
      END IF;
    END IF;

    IF v_current_stock IS NULL OR v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Нөөц хүрэлцэхгүй байна';
    END IF;

    v_total := v_total + (v_unit_price * v_qty);
  END LOOP;

  -- Per-line sanity pass (bounds only) — the aggregate loop above already
  -- covers stock; this rejects malformed individual lines.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) AS item LOOP
    v_qty := (v_item->>'quantity')::numeric;
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 999 THEN
      RAISE EXCEPTION 'Барааны тоо буруу байна';
    END IF;
  END LOOP;

  -- 5. Optional contact (staff can reach the buyer).
  v_contact_id := NULL;
  IF p_contact_phone IS NOT NULL AND p_contact_phone <> '' THEN
    SELECT c.id INTO v_contact_id
    FROM public.contacts c
    WHERE c.organization_id = v_org_id
      AND c.phone = p_contact_phone
      AND c.type = 'customer'
    LIMIT 1;
    IF NOT FOUND AND p_contact_name IS NOT NULL AND p_contact_name <> '' THEN
      INSERT INTO public.contacts (organization_id, name, phone, type)
      VALUES (v_org_id, p_contact_name, p_contact_phone, 'customer')
      RETURNING id INTO v_contact_id;
    END IF;
  END IF;

  -- 6. Link the order to a signed-in store account when one exists.
  v_store_account_id := NULL;
  IF auth.uid() IS NOT NULL THEN
    SELECT sa.id INTO v_store_account_id
    FROM public.store_accounts sa
    WHERE sa.id = auth.uid();
  END IF;

  -- 6.5 Loyalty: resolve the buyer's points contact + earn rules. The
  -- loyalty identity is the contact matched by the store account's
  -- phone/email in this org — independent of the sale's CRM contact.
  v_points_redeemed := GREATEST(p_redeem_points, 0);
  IF v_points_redeemed > 0 AND v_store_account_id IS NULL THEN
    RAISE EXCEPTION 'Оноо ашиглахын тулд нэвтрэх шаардлагатай';
  END IF;

  SELECT ls.points_per_mnt, ls.min_purchase, ls.is_enabled
  INTO v_points_per_mnt, v_min_purchase, v_loyalty_enabled
  FROM public.loyalty_settings ls
  WHERE ls.organization_id = v_org_id;

  IF v_loyalty_enabled AND v_store_account_id IS NOT NULL THEN
    SELECT c.id, COALESCE(c.points_balance, 0)::numeric
    INTO v_buyer_contact_id, v_buyer_balance
    FROM public.store_accounts sa
    JOIN public.contacts c
      ON c.organization_id = v_org_id
     AND c.type = 'customer'
     AND (
       (sa.phone IS NOT NULL AND c.phone = sa.phone)
       OR (sa.email IS NOT NULL AND c.email = sa.email)
     )
    WHERE sa.id = v_store_account_id
    ORDER BY (c.phone = sa.phone) DESC
    LIMIT 1;
  END IF;

  IF v_points_redeemed > 0 THEN
    IF v_loyalty_enabled IS NOT TRUE THEN
      RAISE EXCEPTION 'Лоялти хөтөлбөр идэвхгүй байна';
    END IF;
    IF v_buyer_contact_id IS NULL THEN
      RAISE EXCEPTION 'Оноо ашиглахын тулд утасны дугаараа бүртгүүлнэ үү';
    END IF;
    IF v_buyer_balance < v_points_redeemed THEN
      RAISE EXCEPTION 'Оноо хүрэлцэхгүй байна';
    END IF;
  END IF;

  -- 7. Coupon validation + discount (row locked so concurrent checkouts
  -- cannot overshoot usage_limit; per-customer limit against coupon_usage).
  IF p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '' THEN
    SELECT id, discount_type, discount_value, min_purchase_amount,
           max_discount_amount, used_count, usage_limit, per_customer_limit,
           applies_to, is_active, valid_from, valid_until
    INTO v_coupon
    FROM public.coupons
    WHERE organization_id = v_org_id AND code = p_coupon_code
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Купон олдсонгүй';
    END IF;
    IF v_coupon.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Купон идэвхгүй байна';
    END IF;
    IF v_coupon.valid_from > now()
       OR (v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now()) THEN
      RAISE EXCEPTION 'Купоны хүчинтэй хугацаа дууссан';
    END IF;
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
      RAISE EXCEPTION 'Купоны ашиглалтын хязгаар хүрсэн';
    END IF;
    -- Scope evaluation (coupon_product_scope / coupon_category_scope):
    -- a scoped coupon only discounts the cart lines it is scoped to. The
    -- ELIGIBLE SUBTOTAL is the server-priced sum of the matching lines only
    -- (variant price with product-price fallback — identical pricing to the
    -- step-4 stock loop and the sale_items insert). min_purchase_amount,
    -- the percent/fixed base and every discount cap are evaluated against
    -- the eligible subtotal, so a scoped coupon never discounts a
    -- non-matching line. 'all'-scope coupons keep the whole-cart subtotal
    -- (v_total), preserving the pre-scope behavior exactly. A scoped coupon
    -- whose cart has no matching line rejects the order.
    v_eligible_subtotal := v_total;
    IF v_coupon.applies_to = 'selected_products' THEN
      SELECT COALESCE(SUM(
               (i->>'quantity')::NUMERIC * COALESCE(
                 (SELECT pv.sale_price FROM public.product_variants pv
                  WHERE pv.id = NULLIF(i->>'variant_id', '')::UUID
                    AND pv.product_id = (i->>'product_id')::UUID),
                 (SELECT p.sale_price FROM public.products p
                  WHERE p.id = (i->>'product_id')::UUID
                    AND p.organization_id = v_org_id
                    AND p.deleted_at IS NULL)
               )
             ), 0)
      INTO v_eligible_subtotal
      FROM jsonb_array_elements(p_items) AS i
      WHERE (i->>'product_id')::UUID IN (
        SELECT cps.product_id
        FROM public.coupon_product_scope cps
        WHERE cps.coupon_id = v_coupon.id
      );
      IF v_eligible_subtotal <= 0 THEN
        RAISE EXCEPTION 'Купон энэ захиалгад тохирохгүй байна';
      END IF;
    ELSIF v_coupon.applies_to = 'selected_categories' THEN
      SELECT COALESCE(SUM(
               (i->>'quantity')::NUMERIC * COALESCE(
                 (SELECT pv.sale_price FROM public.product_variants pv
                  WHERE pv.id = NULLIF(i->>'variant_id', '')::UUID
                    AND pv.product_id = (i->>'product_id')::UUID),
                 (SELECT p.sale_price FROM public.products p
                  WHERE p.id = (i->>'product_id')::UUID
                    AND p.organization_id = v_org_id
                    AND p.deleted_at IS NULL)
               )
             ), 0)
      INTO v_eligible_subtotal
      FROM jsonb_array_elements(p_items) AS i
      JOIN public.products lp
        ON lp.id = (i->>'product_id')::UUID
       AND lp.organization_id = v_org_id
       AND lp.deleted_at IS NULL
      WHERE lp.category_id IN (
        SELECT ccs.category_id
        FROM public.coupon_category_scope ccs
        WHERE ccs.coupon_id = v_coupon.id
      );
      IF v_eligible_subtotal <= 0 THEN
        RAISE EXCEPTION 'Купон энэ захиалгад тохирохгүй байна';
      END IF;
    END IF;
    IF v_eligible_subtotal < v_coupon.min_purchase_amount THEN
      RAISE EXCEPTION 'Захиалгын дүн купоны нөхцөлийг хангахгүй байна';
    END IF;
    IF v_contact_id IS NOT NULL AND v_coupon.per_customer_limit IS NOT NULL THEN
      SELECT count(*) INTO v_coupon_usage_count
      FROM public.coupon_usage
      WHERE coupon_id = v_coupon.id AND contact_id = v_contact_id;
      IF v_coupon_usage_count >= v_coupon.per_customer_limit THEN
        RAISE EXCEPTION 'Купоны ашиглалтын хязгаар хүрсэн';
      END IF;
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_coupon_discount := v_eligible_subtotal * v_coupon.discount_value / 100;
    ELSE
      v_coupon_discount := v_coupon.discount_value;
    END IF;
    IF v_coupon.max_discount_amount IS NOT NULL THEN
      v_coupon_discount := LEAST(v_coupon_discount, v_coupon.max_discount_amount);
    END IF;
    v_coupon_discount := LEAST(v_coupon_discount, v_eligible_subtotal);
    v_coupon_id := v_coupon.id;
  END IF;

  -- 8. Promotions — evaluate the org's active promotions against the cart.
  -- Deterministic rules (documented):
  --   * A promotion applies when ALL its conditions are met (min_amount vs
  --     subtotal, min_quantity vs total cart quantity, specific_products /
  --     specific_categories vs cart lines).
  --   * The FIRST reward row per promotion is used.
  --   * Only ONE monetary promotion is applied: the best computed discount
  --     (ties → higher priority, then earlier created).
  --   * free_shipping reward forces the delivery fee to 0 (independent of
  --     the monetary best) and, when no monetary promotion wins, is still
  --     recorded as the applied promotion.
  --   * usage_limit is enforced; used_count is incremented for every
  --     applied promotion.
  FOR v_promo IN
    SELECT p.id, p.priority, p.created_at
    FROM public.promotions p
    WHERE p.organization_id = v_org_id
      AND p.is_active = true
      AND (p.valid_until IS NULL OR p.valid_until > now())
      AND (p.usage_limit IS NULL OR p.used_count < p.usage_limit)
    ORDER BY p.priority DESC, p.created_at ASC
  LOOP
    v_conditions_met := true;
    FOR v_cond IN
      SELECT * FROM public.promotion_conditions
      WHERE promotion_id = v_promo.id
    LOOP
      IF v_cond.condition_type = 'min_amount' THEN
        IF v_total < v_cond.condition_value::NUMERIC THEN
          v_conditions_met := false;
          EXIT;
        END IF;
      ELSIF v_cond.condition_type = 'min_quantity' THEN
        SELECT COALESCE(SUM((i->>'quantity')::NUMERIC), 0) INTO v_cart_qty
        FROM jsonb_array_elements(p_items) i;
        IF v_cart_qty < v_cond.condition_value::NUMERIC THEN
          v_conditions_met := false;
          EXIT;
        END IF;
      ELSIF v_cond.condition_type = 'specific_products' THEN
        SELECT count(*) INTO v_cart_qty
        FROM jsonb_array_elements(p_items) i
        WHERE (i->>'product_id') = v_cond.condition_value;
        IF v_cart_qty = 0 THEN
          v_conditions_met := false;
          EXIT;
        END IF;
      ELSIF v_cond.condition_type = 'specific_categories' THEN
        SELECT count(*) INTO v_cart_qty
        FROM jsonb_array_elements(p_items) i
        JOIN public.products lp ON lp.id = (i->>'product_id')::uuid
        WHERE lp.category_id::text = v_cond.condition_value;
        IF v_cart_qty = 0 THEN
          v_conditions_met := false;
          EXIT;
        END IF;
      END IF;
    END LOOP;

    IF NOT v_conditions_met THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_reward
    FROM public.promotion_rewards
    WHERE promotion_id = v_promo.id
    ORDER BY created_at ASC
    LIMIT 1;
    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    IF v_reward.reward_type = 'free_shipping' THEN
      v_free_shipping := true;
      IF v_free_shipping_promo_id IS NULL THEN
        v_free_shipping_promo_id := v_promo.id;
      END IF;
    ELSIF v_reward.reward_type = 'percentage_discount' THEN
      v_promotion_discount := v_total * v_reward.reward_value / 100;
      IF v_promotion_discount > v_best_discount THEN
        v_best_discount := v_promotion_discount;
        v_best_promo_id := v_promo.id;
      END IF;
    ELSIF v_reward.reward_type = 'fixed_discount' THEN
      v_promotion_discount := v_reward.reward_value;
      IF v_promotion_discount > v_best_discount THEN
        v_best_discount := v_promotion_discount;
        v_best_promo_id := v_promo.id;
      END IF;
    ELSIF v_reward.reward_type = 'free_product' THEN
      -- Buy X get Y: X from the min_quantity condition (default 2); free
      -- units = floor(cart qty of the reward product / X), capped at
      -- reward_max_count; discount = free units × reward product sale price.
      v_threshold_qty := 2;
      SELECT condition_value::NUMERIC INTO v_threshold_qty
      FROM public.promotion_conditions
      WHERE promotion_id = v_promo.id AND condition_type = 'min_quantity'
      LIMIT 1;
      IF v_reward.reward_product_id IS NOT NULL AND COALESCE(v_threshold_qty, 0) > 0 THEN
        SELECT COALESCE(SUM((i->>'quantity')::NUMERIC), 0) INTO v_cart_qty
        FROM jsonb_array_elements(p_items) i
        WHERE (i->>'product_id') = v_reward.reward_product_id::text;
        v_free_units := floor(v_cart_qty / v_threshold_qty);
        IF v_reward.reward_max_count IS NOT NULL THEN
          v_free_units := LEAST(v_free_units, v_reward.reward_max_count::NUMERIC);
        END IF;
        SELECT sale_price INTO v_free_unit_price
        FROM public.products
        WHERE id = v_reward.reward_product_id;
        v_promotion_discount := v_free_units * COALESCE(v_free_unit_price, 0);
        IF v_promotion_discount > v_best_discount THEN
          v_best_discount := v_promotion_discount;
          v_best_promo_id := v_promo.id;
        END IF;
      END IF;
    END IF;
  END LOOP;

  IF v_best_discount > 0 THEN
    v_promotion_discount := v_best_discount;
    v_promotion_id := v_best_promo_id;
  ELSIF v_free_shipping_promo_id IS NOT NULL THEN
    v_promotion_discount := 0;
    v_promotion_id := v_free_shipping_promo_id;
  END IF;

  -- 9. Gift card — validate + lock; applied against merchandise payable
  -- (subtotal − discounts). The delivery fee is paid by the selected
  -- payment method; a card never covers more than the merchandise.
  IF p_gift_card_code IS NOT NULL AND btrim(p_gift_card_code) <> '' THEN
    SELECT id, current_balance, currency_code, expires_at, is_active
    INTO v_gift_card
    FROM public.gift_cards
    WHERE organization_id = v_org_id AND code = p_gift_card_code
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Бэлгийн карт олдсонгүй';
    END IF;
    IF v_gift_card.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Бэлгийн карт идэвхгүй байна';
    END IF;
    IF v_gift_card.expires_at IS NOT NULL AND v_gift_card.expires_at < now() THEN
      RAISE EXCEPTION 'Бэлгийн картын хугацаа дууссан';
    END IF;
    IF v_gift_card.currency_code IS DISTINCT FROM p_currency_code THEN
      RAISE EXCEPTION 'Бэлгийн картын валют тохирохгүй байна';
    END IF;
    IF v_gift_card.current_balance <= 0 THEN
      RAISE EXCEPTION 'Бэлгийн картын үлдэгдэл хүрэлцэхгүй байна';
    END IF;
    v_gift_card_id := v_gift_card.id;
  END IF;

  -- 10. Totals.
  -- original_amount = item subtotal (v_total)
  -- discount_amount = coupon + promotion + points discount, capped at subtotal
  -- total_amount   = max(0, subtotal − discounts) + delivery_fee
  -- Points discount (earn/spend): redeem value = points / points_per_mnt,
  -- capped at the payable amount; applied BEFORE the gift card so the card
  -- never covers the points' share.
  v_discount_total := LEAST(v_coupon_discount + v_promotion_discount, v_total);
  v_payable := GREATEST(v_total - v_discount_total, 0);

  IF v_points_redeemed > 0 THEN
    v_points_discount := LEAST(
      COALESCE(v_points_redeemed::NUMERIC / NULLIF(v_points_per_mnt, 0), 0),
      v_payable
    );
    v_payable := v_payable - v_points_discount;
    v_discount_total := v_discount_total + v_points_discount;
  END IF;

  IF v_delivery_type = 'delivery' THEN
    IF v_free_shipping THEN
      v_fee := 0;
    ELSIF COALESCE(v_profile.free_delivery_threshold, 0) > 0
          AND v_payable < v_profile.free_delivery_threshold THEN
      v_fee := COALESCE(v_profile.delivery_fee_amount, 0);
    ELSE
      v_fee := 0;
    END IF;
  END IF;

  IF v_gift_card_id IS NOT NULL THEN
    v_gift_amt := LEAST(v_gift_card.current_balance, v_payable);
  END IF;

  v_total_amount := v_payable + v_fee;

  -- Earn: floor(net merchandise amount × points_per_mnt) once the order
  -- clears the min_purchase threshold. The buyer must be identifiable.
  IF v_loyalty_enabled AND v_buyer_contact_id IS NOT NULL
     AND v_payable >= v_min_purchase THEN
    v_points_earned := floor(v_payable * v_points_per_mnt)::integer;
  END IF;

  -- 11. Insert the sale (pending — staff confirms and collects payment).
  INSERT INTO public.sales (
    organization_id, branch_id, contact_id, sale_date,
    total_amount, original_amount, paid_amount,
    payment_method, payment_splits, status,
    created_by, salesperson_id, store_account_id, currency_code,
    dedupe_key, is_online,
    delivery_type, delivery_address, delivery_note, delivery_fee,
    discount_amount, coupon_id, gift_card_id, gift_card_amount,
    promotion_id, promotion_discount, contact_email,
    points_redeemed
  ) VALUES (
    v_org_id, v_branch_id, v_contact_id, now(),
    v_total_amount, v_total, v_gift_amt,
    p_payment_method,
    jsonb_build_object(
      p_payment_method, GREATEST(v_total_amount - v_gift_amt, 0),
      'gift_card', v_gift_amt
    ),
    'pending',
    NULL, NULL, v_store_account_id, p_currency_code,
    NULLIF(p_idempotency_key, ''), true,
    v_delivery_type, v_address, v_address_note, v_fee,
    v_discount_total, v_coupon_id, v_gift_card_id, v_gift_amt,
    v_promotion_id, v_promotion_discount, p_contact_email,
    NULLIF(v_points_redeemed, 0)
  ) RETURNING id INTO v_sale_id;

  -- 11.5 Loyalty ledger (same transaction — a crash before commit rolls
  -- back points AND the sale, so a retry with the idempotency key can
  -- never double-award or double-redeem).
  IF v_points_redeemed > 0 AND v_buyer_contact_id IS NOT NULL THEN
    INSERT INTO public.loyalty_points (
      organization_id, customer_id, points, type, reference_id, notes
    ) VALUES (
      v_org_id, v_buyer_contact_id, -v_points_redeemed, 'redeemed',
      v_sale_id, 'Онлайн захиалга: ' || v_sale_id::text
    );
    UPDATE public.contacts
    SET points_balance = GREATEST(COALESCE(points_balance, 0) - v_points_redeemed, 0)
    WHERE id = v_buyer_contact_id;
  END IF;

  IF v_points_earned > 0 AND v_buyer_contact_id IS NOT NULL THEN
    INSERT INTO public.loyalty_points (
      organization_id, customer_id, points, type, reference_id, notes
    ) VALUES (
      v_org_id, v_buyer_contact_id, v_points_earned, 'earned',
      v_sale_id, 'Онлайн захиалга: ' || v_sale_id::text
    );
    UPDATE public.contacts
    SET points_balance = COALESCE(points_balance, 0) + v_points_earned
    WHERE id = v_buyer_contact_id;
  END IF;

  -- 12. Usage tracking (same transaction).
  IF v_coupon_id IS NOT NULL THEN
    UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon_id;
    INSERT INTO public.coupon_usage (coupon_id, organization_id, contact_id, sale_id)
    VALUES (v_coupon_id, v_org_id, v_contact_id, v_sale_id);
  END IF;

  IF v_promotion_id IS NOT NULL THEN
    UPDATE public.promotions SET used_count = used_count + 1 WHERE id = v_promotion_id;
  END IF;

  IF v_gift_card_id IS NOT NULL AND v_gift_amt > 0 THEN
    UPDATE public.gift_cards
    SET current_balance = current_balance - v_gift_amt
    WHERE id = v_gift_card_id;
    INSERT INTO public.gift_card_transactions (
      gift_card_id, organization_id, transaction_type, amount,
      balance_before, balance_after, reference_type, reference_id, created_by
    ) VALUES (
      v_gift_card_id, v_org_id, 'redemption', v_gift_amt,
      v_gift_card.current_balance, v_gift_card.current_balance - v_gift_amt,
      'sale', v_sale_id, v_store_account_id
    );
  END IF;

  -- 13. Auto-create the deliveries row for delivery orders.
  IF v_delivery_type = 'delivery' THEN
    INSERT INTO public.deliveries (
      organization_id, sale_id, branch_id, address, address_note,
      contact_name, contact_phone, delivery_fee, status, requested_at
    ) VALUES (
      v_org_id, v_sale_id, v_branch_id, v_address, v_address_note,
      p_contact_name, p_contact_phone, v_fee, 'pending', now()
    );
  END IF;

  -- 14. Insert sale_items + stock_movements (same transaction).
  INSERT INTO public.sale_items (
    sale_id, product_id, quantity, unit_price, total_price, commission_amount, variant_id
  )
  SELECT
    v_sale_id,
    (item->>'product_id')::UUID,
    (item->>'quantity')::NUMERIC,
    (
      SELECT COALESCE(
        (SELECT pv.sale_price FROM public.product_variants pv WHERE pv.id = NULLIF((item->>'variant_id')::TEXT, '')::UUID),
        (SELECT p.sale_price FROM public.products p WHERE p.id = (item->>'product_id')::UUID)
      )
    ),
    (item->>'quantity')::NUMERIC * (
      SELECT COALESCE(
        (SELECT pv.sale_price FROM public.product_variants pv WHERE pv.id = NULLIF((item->>'variant_id')::TEXT, '')::UUID),
        (SELECT p.sale_price FROM public.products p WHERE p.id = (item->>'product_id')::UUID)
      )
    ),
    0,
    NULLIF((item->>'variant_id')::TEXT, '')::UUID
  FROM jsonb_array_elements(p_items) AS item;

  INSERT INTO public.stock_movements (
    organization_id, branch_id, product_id, type, quantity, unit_cost, reference, created_by, variant_id
  )
  SELECT
    v_org_id,
    v_branch_id,
    (item->>'product_id')::UUID,
    'out',
    (item->>'quantity')::NUMERIC,
    (
      SELECT COALESCE(
        (SELECT pv.cost_price FROM public.product_variants pv WHERE pv.id = NULLIF((item->>'variant_id')::TEXT, '')::UUID),
        (SELECT p.cost_price FROM public.products p WHERE p.id = (item->>'product_id')::UUID)
      )
    ),
    'sale:' || v_sale_id::TEXT,
    NULL,
    NULLIF((item->>'variant_id')::TEXT, '')::UUID
  FROM jsonb_array_elements(p_items) AS item;

  -- 15. Decrement stock (rows locked in step 4).
  FOR v_item IN
    SELECT * FROM jsonb_array_elements(p_items) AS item
    ORDER BY (item->>'product_id')::TEXT
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
    v_qty := (v_item->>'quantity')::NUMERIC;

    IF v_variant_id IS NULL THEN
      UPDATE public.products
      SET current_stock = current_stock - v_qty
      WHERE id = v_product_id;
    ELSE
      UPDATE public.product_variants
      SET current_stock = current_stock - v_qty
      WHERE id = v_variant_id;
    END IF;
  END LOOP;

  delivery_fee := v_fee;
  discount_amount := v_discount_total;
  gift_card_amount := v_gift_amt;
  payment_instructions := v_payment_instructions;
  points_discount := v_points_discount;
  points_redeemed := v_points_redeemed;
  points_earned := v_points_earned;

  RETURN QUERY
    SELECT v_sale_id, v_total_amount, 'pending'::TEXT,
           delivery_fee, discount_amount, gift_card_amount, payment_instructions,
           points_discount, points_redeemed, points_earned;
END;
$$;
