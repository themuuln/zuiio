-- =============================================
-- Public checkout full flow
--
-- Completes the storefront buyer flow with server-side pricing for
-- delivery/pickup, coupons, gift cards and promotions:
--
--   1. sales columns for delivery + discount tracking (delivery_type,
--      delivery_address, delivery_note, delivery_fee, discount_amount,
--      coupon_id, gift_card_id, gift_card_amount, promotion_id,
--      promotion_discount, contact_email).
--   2. organization_public_profiles columns for checkout configuration
--      (delivery fee + free-delivery threshold, delivery/pickup toggles,
--      show_stock privacy opt-in, bank-transfer / QPay payment
--      instructions shown to the buyer at checkout).
--   3. product_images — org-scoped product gallery, public via RPC only.
--   4. submit_shop_order rewrite: delivery fee evaluation, coupon +
--      gift card + promotion validation/application, automatic
--      `deliveries` row creation, payment instructions in the return row.
--      All pricing is computed server-side; the previous security posture
--      is preserved (SECURITY DEFINER, empty search_path, explicit
--      public. prefixes, idempotency pre-check, flood limits, FOR UPDATE
--      stock locks in product_id order, aggregated quantities, 50-item cap).
--   5. get_public_products / get_public_product: images array + current_stock
--      (only when the org opts in via show_stock — privacy default kept).
--   6. get_my_orders: delivery + discount + tracking fields.
--   7. get_public_order(p_slug, p_order_id): the signed-in buyer's OWN
--      order detail (auth.uid() = store_account_id).
--   8. get_public_branches(p_slug): branches for the pickup picker.
--
-- Postgres version of the coupon/gift-card math mirrors the pure TS
-- helpers in src/lib/public-checkout.ts (single source of truth for the
-- rules; the SQL is authoritative at checkout time).
-- =============================================

-- ─────────────────────────────────────────────
-- 1. sales columns
-- ─────────────────────────────────────────────
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS delivery_type TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_note TEXT,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_id UUID,
  ADD COLUMN IF NOT EXISTS gift_card_id UUID,
  ADD COLUMN IF NOT EXISTS gift_card_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promotion_id UUID,
  ADD COLUMN IF NOT EXISTS promotion_discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

COMMENT ON COLUMN public.sales.delivery_type IS 'delivery | pickup | NULL (legacy rows)';
COMMENT ON COLUMN public.sales.delivery_fee IS 'Server-computed delivery fee (0 for pickup / free shipping)';
COMMENT ON COLUMN public.sales.discount_amount IS 'Coupon + promotion discount applied at checkout';
COMMENT ON COLUMN public.sales.gift_card_amount IS 'Portion of the order paid by gift card';
COMMENT ON COLUMN public.sales.promotion_discount IS 'Discount from the applied promotion';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_delivery_type_check'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_delivery_type_check
      CHECK (delivery_type IS NULL OR delivery_type IN ('delivery', 'pickup'));
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 2. organization_public_profiles columns
-- ─────────────────────────────────────────────
ALTER TABLE public.organization_public_profiles
  ADD COLUMN IF NOT EXISTS delivery_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_delivery_threshold NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_stock BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_bank_name TEXT,
  ADD COLUMN IF NOT EXISTS payment_bank_account TEXT,
  ADD COLUMN IF NOT EXISTS payment_account_name TEXT,
  ADD COLUMN IF NOT EXISTS qpay_qr_url TEXT;

COMMENT ON COLUMN public.organization_public_profiles.delivery_fee_amount IS 'Flat delivery fee charged when below the free-delivery threshold';
COMMENT ON COLUMN public.organization_public_profiles.free_delivery_threshold IS 'Fee applies when payable < threshold; 0 = fee charging disabled (delivery always free)';
COMMENT ON COLUMN public.organization_public_profiles.show_stock IS 'Opt-in: expose current_stock through public catalog RPCs (default keeps stock private)';
COMMENT ON COLUMN public.organization_public_profiles.qpay_qr_url IS 'QPay QR / bank-transfer instructions shown to the buyer at checkout';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_public_profiles_delivery_fee_nonneg'
  ) THEN
    ALTER TABLE public.organization_public_profiles
      ADD CONSTRAINT organization_public_profiles_delivery_fee_nonneg
      CHECK (delivery_fee_amount >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_public_profiles_free_delivery_nonneg'
  ) THEN
    ALTER TABLE public.organization_public_profiles
      ADD CONSTRAINT organization_public_profiles_free_delivery_nonneg
      CHECK (free_delivery_threshold >= 0);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 3. product_images (gallery, org-scoped, public via RPC only)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.product_images IS 'Product gallery images; public access only via the catalog RPCs (table stays org-scoped like products)';

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_org ON public.product_images(organization_id);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images_select_own_org" ON public.product_images
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.read')
  );
CREATE POLICY "product_images_insert_own_org" ON public.product_images
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.create')
  );
CREATE POLICY "product_images_update_own_org" ON public.product_images
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  );
CREATE POLICY "product_images_delete_own_org" ON public.product_images
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.delete')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;

-- ─────────────────────────────────────────────
-- 4. submit_shop_order — full-flow rewrite
-- ─────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.submit_shop_order(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.submit_shop_order(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

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
  p_pickup_branch_slug TEXT DEFAULT NULL
)
RETURNS TABLE(
  order_id UUID,
  total_amount NUMERIC,
  status TEXT,
  delivery_fee NUMERIC,
  discount_amount NUMERIC,
  gift_card_amount NUMERIC,
  payment_instructions JSONB
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
               COALESCE(v_existing_gift, 0), v_payment_instructions;
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
    -- Schema surprise: coupons.applies_to supports selected_products /
    -- selected_categories, but no scope tables exist to store the selection;
    -- checkout applies 'all'-scope coupons to the whole order only.
    IF v_coupon.applies_to IS DISTINCT FROM 'all' THEN
      RAISE EXCEPTION 'Купон энэ захиалгад хэрэглэх боломжгүй';
    END IF;
    IF v_total < v_coupon.min_purchase_amount THEN
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
      v_coupon_discount := v_total * v_coupon.discount_value / 100;
    ELSE
      v_coupon_discount := v_coupon.discount_value;
    END IF;
    IF v_coupon.max_discount_amount IS NOT NULL THEN
      v_coupon_discount := LEAST(v_coupon_discount, v_coupon.max_discount_amount);
    END IF;
    v_coupon_discount := LEAST(v_coupon_discount, v_total);
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
  -- discount_amount = coupon + promotion, capped at subtotal
  -- total_amount   = max(0, subtotal − discount) + delivery_fee
  v_discount_total := LEAST(v_coupon_discount + v_promotion_discount, v_total);
  v_payable := GREATEST(v_total - v_discount_total, 0);

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

  -- 11. Insert the sale (pending — staff confirms and collects payment).
  INSERT INTO public.sales (
    organization_id, branch_id, contact_id, sale_date,
    total_amount, original_amount, paid_amount,
    payment_method, payment_splits, status,
    created_by, salesperson_id, store_account_id, currency_code,
    dedupe_key, is_online,
    delivery_type, delivery_address, delivery_note, delivery_fee,
    discount_amount, coupon_id, gift_card_id, gift_card_amount,
    promotion_id, promotion_discount, contact_email
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
    v_promotion_id, v_promotion_discount, p_contact_email
  ) RETURNING id INTO v_sale_id;

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

  RETURN QUERY
    SELECT v_sale_id, v_total_amount, 'pending'::TEXT,
           delivery_fee, discount_amount, gift_card_amount, payment_instructions;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_shop_order(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_shop_order(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ─────────────────────────────────────────────
-- 5. get_public_products — images + opt-in stock
-- ─────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_public_products(p_slug text);

CREATE OR REPLACE FUNCTION public.get_public_products(
  p_slug text,
  p_category_id uuid DEFAULT NULL::uuid,
  p_search text DEFAULT NULL::text,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 24
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_org_id UUID;
  v_show_stock BOOLEAN;
  v_org JSON;
  v_products JSON;
  v_total INT;
  v_offset INT;
BEGIN
  -- Find organization by slug
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = p_slug;

  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check if catalog is enabled
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_public_profiles
    WHERE organization_id = v_org_id AND catalog_enabled = true
  ) THEN
    RETURN json_build_object('organization', NULL, 'products', '[]'::json, 'total', 0);
  END IF;

  -- Stock privacy opt-in (show_stock=false → current_stock stays null)
  SELECT COALESCE(show_stock, false) INTO v_show_stock
  FROM public.organization_public_profiles
  WHERE organization_id = v_org_id;

  -- Build org info
  SELECT json_build_object(
    'name', o.name,
    'slug', o.slug,
    'currency', o.currency,
    'company_type', o.company_type
  ) INTO v_org
  FROM public.organizations o WHERE o.id = v_org_id;

  -- Count matching products
  SELECT count(*) INTO v_total
  FROM public.products p
  WHERE p.organization_id = v_org_id
    AND p.is_public = true
    AND p.deleted_at IS NULL
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%');

  v_offset := (p_page - 1) * p_page_size;

  -- Fetch products (safe fields only — cost/min_stock/SKU never exposed).
  -- images: primary = products.image_url first, then product_images by
  -- sort_order (primary uses sort_order -1 so it always sorts first).
  -- current_stock: only when the org opted in (show_stock).
  SELECT json_agg(item)
  INTO v_products
  FROM (
    SELECT json_build_object(
      'id', p.id,
      'name', p.name,
      'unit', p.unit,
      'sale_price', p.sale_price,
      'category_name', c.name,
      'category_id', p.category_id,
      'image_url', p.image_url,
      'description', p.description,
      'attribute_count', (
        SELECT count(*) FROM public.product_attribute_values v
        WHERE v.product_id = p.id
      ),
      'images', (
        SELECT COALESCE(json_agg(t ORDER BY t.sort_order)::jsonb, '[]'::jsonb)
        FROM (
          SELECT p.image_url AS url, -1 AS sort_order
          UNION ALL
          SELECT pi.url, pi.sort_order
          FROM public.product_images pi
          WHERE pi.product_id = p.id
            AND pi.url IS DISTINCT FROM p.image_url
        ) t
        WHERE t.url IS NOT NULL
      ),
      'current_stock', CASE WHEN v_show_stock THEN p.current_stock ELSE NULL END
    ) AS item
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE p.organization_id = v_org_id
      AND p.is_public = true
      AND p.deleted_at IS NULL
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
    ORDER BY p.name
    LIMIT p_page_size OFFSET v_offset
  ) items;

  RETURN json_build_object(
    'organization', v_org,
    'products', COALESCE(v_products, '[]'::json),
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_public_products(text, uuid, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_products(text, uuid, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_products(text, uuid, text, integer, integer) TO authenticated;

-- ─────────────────────────────────────────────
-- get_public_product — images + opt-in stock (variants too)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_public_product(p_slug text, p_product_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_org_id UUID;
  v_show_stock BOOLEAN;
  v_org JSON;
  v_product JSON;
BEGIN
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = p_slug;

  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(show_stock, false) INTO v_show_stock
  FROM public.organization_public_profiles
  WHERE organization_id = v_org_id;

  -- Build org info
  SELECT json_build_object(
    'name', o.name,
    'slug', o.slug,
    'currency', o.currency,
    'company_type', o.company_type
  ) INTO v_org
  FROM public.organizations o WHERE o.id = v_org_id;

  -- Fetch product (must be published and belong to this org)
  SELECT json_build_object(
    'id', p.id,
    'name', p.name,
    'sku', p.sku,
    'barcode', p.barcode,
    'unit', p.unit,
    'sale_price', p.sale_price,
    'category_name', cat.name,
    'category_id', p.category_id,
    'image_url', p.image_url,
    'description', p.description,
    'created_at', p.created_at,
    'images', (
      SELECT COALESCE(json_agg(t ORDER BY t.sort_order)::jsonb, '[]'::jsonb)
      FROM (
        SELECT p.image_url AS url, -1 AS sort_order
        UNION ALL
        SELECT pi.url, pi.sort_order
        FROM public.product_images pi
        WHERE pi.product_id = p.id
          AND pi.url IS DISTINCT FROM p.image_url
      ) t
      WHERE t.url IS NOT NULL
    ),
    'current_stock', CASE WHEN v_show_stock THEN p.current_stock ELSE NULL END,
    'variants', (
      SELECT json_agg(json_build_object(
        'id', pv.id,
        'sku', pv.sku,
        'sale_price', pv.sale_price,
        'current_stock', CASE WHEN v_show_stock THEN pv.current_stock ELSE NULL END,
        'option_labels', (
          SELECT string_agg(vo.value, ' / '
            ORDER BY g.sort_order, vo.sort_order, vo.value)
          FROM public.product_variant_assignments pva
          JOIN public.product_variant_options vo ON vo.id = pva.option_id
          JOIN public.product_variant_groups g ON g.id = vo.group_id
          WHERE pva.variant_id = pv.id
        )
      ) ORDER BY pv.created_at)
      FROM public.product_variants pv
      WHERE pv.product_id = p.id
        AND pv.is_active = true
    ),
    'attributes', (
      SELECT json_agg(json_build_object(
        'name', ad.name,
        'value', COALESCE(
          pav.value_text,
          pav.value_number::text,
          CASE WHEN pav.value_boolean IS NOT NULL
            THEN pav.value_boolean::text END
        )
      ))
      FROM public.product_attribute_values pav
      JOIN public.product_attribute_definitions ad
        ON ad.id = pav.attribute_definition_id
      WHERE pav.product_id = p.id
    )
  ) INTO v_product
  FROM public.products p
  LEFT JOIN public.categories cat ON cat.id = p.category_id
  WHERE p.id = p_product_id
    AND p.organization_id = v_org_id
    AND p.is_public = true
    AND p.deleted_at IS NULL;

  IF v_product IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object('organization', v_org, 'product', v_product);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_public_product(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_product(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_product(text, uuid) TO authenticated;

-- ─────────────────────────────────────────────
-- 6. get_my_orders — delivery + discount + tracking fields
-- ─────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_my_orders();

CREATE OR REPLACE FUNCTION public.get_my_orders()
RETURNS TABLE(
  id uuid,
  invoice_number text,
  total_amount numeric,
  status text,
  created_at timestamptz,
  items jsonb,
  delivery_type text,
  delivery_address text,
  delivery_fee numeric,
  discount_amount numeric,
  gift_card_amount numeric,
  delivery_status text,
  external_tracking_id text,
  contact_email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    i.invoice_number,
    s.total_amount,
    s.status,
    s.created_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'product_id', si.product_id,
            'name', p.name,
            'quantity', si.quantity,
            'unit_price', si.unit_price,
            'total_price', si.total_price
          )
        )
        FROM public.sale_items si
        LEFT JOIN public.products p ON p.id = si.product_id
        WHERE si.sale_id = s.id
          AND si.deleted_at IS NULL
      ),
      '[]'::jsonb
    ) AS items,
    s.delivery_type,
    s.delivery_address,
    COALESCE(s.delivery_fee, 0),
    COALESCE(s.discount_amount, 0),
    COALESCE(s.gift_card_amount, 0),
    (
      SELECT d.status
      FROM public.deliveries d
      WHERE d.sale_id = s.id
      ORDER BY d.created_at DESC
      LIMIT 1
    ),
    (
      SELECT d.external_tracking_id
      FROM public.deliveries d
      WHERE d.sale_id = s.id
      ORDER BY d.created_at DESC
      LIMIT 1
    ),
    s.contact_email
  FROM public.sales s
  LEFT JOIN public.invoices i ON i.sale_id = s.id
  WHERE s.store_account_id = auth.uid()
    AND s.deleted_at IS NULL
  ORDER BY s.created_at DESC
  LIMIT 100;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;

-- ─────────────────────────────────────────────
-- 7. get_public_order — the signed-in buyer's OWN order detail
--    Pinned shape (account-UI session): returns { order: OrderDetail } or
--    null when not found / not owned. OrderDetail fields below.
-- ─────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_public_order(text, uuid);

CREATE OR REPLACE FUNCTION public.get_public_order(p_slug text, p_order_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_order JSONB;
BEGIN
  -- Resolve the org by public slug; unknown slug → null.
  SELECT o.id INTO v_org_id
  FROM public.organizations o
  JOIN public.organization_public_profiles pp ON pp.organization_id = o.id
  WHERE o.slug = p_slug AND pp.catalog_enabled = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Buyer's OWN order only — auth.uid() must equal store_account_id.
  -- SECURITY DEFINER + explicit filter, so no cross-buyer leakage even if
  -- RLS on sales changes.
  SELECT jsonb_build_object('order', jsonb_build_object(
    'id', s.id,
    'invoice_number', i.invoice_number,
    'status', s.status,
    'created_at', s.created_at,
    'total_amount', s.total_amount,
    'original_amount', COALESCE(s.original_amount, s.total_amount),
    'discount_amount', COALESCE(s.discount_amount, 0),
    'delivery_fee', COALESCE(s.delivery_fee, 0),
    'gift_card_amount', COALESCE(s.gift_card_amount, 0),
    'payment_method', s.payment_method,
    'currency_code', s.currency_code,
    'delivery_type', s.delivery_type,
    'delivery_address', s.delivery_address,
    'delivery_note', s.delivery_note,
    'contact_name', c.name,
    'contact_phone', c.phone,
    'contact_email', s.contact_email,
    'delivery', (
      SELECT jsonb_build_object(
        'status', d.status,
        'external_tracking_id', d.external_tracking_id,
        'assigned_to_name', pr.full_name
      )
      FROM public.deliveries d
      LEFT JOIN public.profiles pr ON pr.id = d.assigned_to
      WHERE d.sale_id = s.id
      ORDER BY d.created_at DESC
      LIMIT 1
    ),
    'items', COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'product_id', si.product_id,
          'name', p.name,
          'quantity', si.quantity,
          'unit_price', si.unit_price,
          'total_price', si.total_price,
          'variant_labels', (
            SELECT array_agg(vo.value
              ORDER BY g.sort_order, vo.sort_order, vo.value)
            FROM public.product_variant_assignments pva
            JOIN public.product_variant_options vo ON vo.id = pva.option_id
            JOIN public.product_variant_groups g ON g.id = vo.group_id
            WHERE pva.variant_id = si.variant_id
          )
        ))
        FROM public.sale_items si
        LEFT JOIN public.products p ON p.id = si.product_id
        WHERE si.sale_id = s.id
          AND si.deleted_at IS NULL
      ),
      '[]'::jsonb
    )
  )) INTO v_order
  FROM public.sales s
  LEFT JOIN public.invoices i ON i.sale_id = s.id
  LEFT JOIN public.contacts c ON c.id = s.contact_id
  WHERE s.id = p_order_id
    AND s.organization_id = v_org_id
    AND s.store_account_id = auth.uid()
    AND s.deleted_at IS NULL;

  RETURN v_order;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_order(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order(text, uuid) TO authenticated;

-- ─────────────────────────────────────────────
-- 8. get_public_branches — branches for the pickup picker
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_public_branches(p_slug text)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_branches JSONB;
BEGIN
  SELECT o.id INTO v_org_id
  FROM public.organizations o
  JOIN public.organization_public_profiles pp ON pp.organization_id = o.id
  WHERE o.slug = p_slug AND pp.catalog_enabled = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'slug', b.slug,
      'name', b.name,
      'address', b.address,
      'phone', b.phone
    ) ORDER BY b.created_at, b.name
  ) INTO v_branches
  FROM public.branches b
  WHERE b.organization_id = v_org_id;

  RETURN COALESCE(v_branches, '[]'::JSONB);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_branches(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_branches(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_branches(text) TO authenticated;
