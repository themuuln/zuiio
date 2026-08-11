-- =============================================
-- Storefront gaps (wave 2 backend contract)
--
--   1. store_account_addresses — buyer address book (own-row RLS).
--   2. sales.status_history + append_sale_status_history() + a BEFORE
--      INSERT trigger that seeds the initial entry, so submit_shop_order
--      (pending/buyer) and process_shop_sale (completed/staff) record
--      history WITHOUT rewriting those large functions.
--   3. cancel_my_order() — buyer cancels a pending online order: restocks
--      (mirrors submit_shop_order's decrement exactly), records
--      cancelled/buyer history, rejects non-owned / non-pending orders.
--   4. get_public_products() — + price range / sort / product_ids params,
--      + review_count / review_average / promo fields.
--   5. get_public_product() — + review_count / review_average / promo /
--      related (up to 4 same-category public products, excluding self).
--   6. get_public_promotions() — public list of active promos.
--   7. organization_public_profiles.estimated_delivery_hours — checkout
--      shows "~N цагт хүргэгдэнэ".
--   8. product_images admin grants (verified present from 190000; the
--      re-grant below is idempotent).
--
-- Postgres version of the promo matcher mirrors the checkout rules in
-- submit_shop_order (priority DESC, created_at ASC; first reward row).
-- =============================================

-- ─────────────────────────────────────────────
-- 1. store_account_addresses
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_account_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_account_id uuid NOT NULL REFERENCES public.store_accounts(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  address text NOT NULL,
  address_note text,
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.store_account_addresses IS 'Buyer address book; each buyer manages exactly their own rows (store_account_id = auth.uid())';

CREATE INDEX IF NOT EXISTS idx_store_account_addresses_account
  ON public.store_account_addresses(store_account_id);

ALTER TABLE public.store_account_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_account_addresses_select_own ON public.store_account_addresses;
CREATE POLICY store_account_addresses_select_own ON public.store_account_addresses
  FOR SELECT USING (store_account_id = auth.uid());

DROP POLICY IF EXISTS store_account_addresses_insert_own ON public.store_account_addresses;
CREATE POLICY store_account_addresses_insert_own ON public.store_account_addresses
  FOR INSERT WITH CHECK (store_account_id = auth.uid());

DROP POLICY IF EXISTS store_account_addresses_update_own ON public.store_account_addresses;
CREATE POLICY store_account_addresses_update_own ON public.store_account_addresses
  FOR UPDATE USING (store_account_id = auth.uid())
  WITH CHECK (store_account_id = auth.uid());

DROP POLICY IF EXISTS store_account_addresses_delete_own ON public.store_account_addresses;
CREATE POLICY store_account_addresses_delete_own ON public.store_account_addresses
  FOR DELETE USING (store_account_id = auth.uid());

-- Grants to authenticated only (buyers manage their own address book).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_account_addresses TO authenticated;
GRANT ALL PRIVILEGES ON public.store_account_addresses TO service_role;

-- ─────────────────────────────────────────────
-- 2. sales.status_history + append helper + insert trigger
-- ─────────────────────────────────────────────
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS status_history jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.sales.status_history IS
  'Order status trail: [{status, at (ISO-8601), by (buyer|staff|system)}], oldest first';

-- Invoker rights on purpose: staff TS server actions call this via PostgREST
-- under their own JWT, so sales RLS (org-scoped has_permission('sales.update')
-- + user_has_branch_access) gates the UPDATE. Buyers can only SELECT their own
-- sales rows, so they cannot append history to foreign orders through this
-- helper. Inside the SECURITY DEFINER RPCs (cancel_my_order) the caller's
-- context is the definer, so RLS does not apply there either.
CREATE OR REPLACE FUNCTION public.append_sale_status_history(
  p_sale_id uuid,
  p_status text,
  p_by text
)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.sales
  SET status_history = COALESCE(status_history, '[]'::jsonb) || jsonb_build_object(
    'status', p_status,
    'at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'by', p_by
  )
  WHERE id = p_sale_id;
END;
$$;

REVOKE ALL ON FUNCTION public.append_sale_status_history(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_sale_status_history(uuid, text, text) TO authenticated;

-- Initial history entry for every new sale without touching the two large
-- insert functions: submit_shop_order writes status='pending' with
-- is_online=true → buyer; process_shop_sale and dashboard staff inserts
-- write is_online=false → staff. Fully additive (only sets NEW.status_history).
CREATE OR REPLACE FUNCTION public.seed_sale_status_history()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.status_history := COALESCE(NEW.status_history, '[]'::jsonb) || jsonb_build_object(
    'status', NEW.status,
    'at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'by', CASE WHEN NEW.is_online THEN 'buyer' ELSE 'staff' END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sales_status_history ON public.sales;
CREATE TRIGGER trg_sales_status_history
  BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.seed_sale_status_history();

-- ─────────────────────────────────────────────
-- 3. cancel_my_order
-- ─────────────────────────────────────────────
-- Buyer cancels their OWN pending online order. Restocks every sale_item
-- (base product or variant — mirroring submit_shop_order's decrement, in
-- reverse) and records a stock_movement type 'in' reference 'cancel:<sale_id>'.
-- Guest orders (store_account_id IS NULL) can never match
-- `store_account_id = auth.uid()`, so they cannot be cancelled via this RPC.
CREATE OR REPLACE FUNCTION public.cancel_my_order(p_slug text, p_order_id uuid)
RETURNS TABLE(order_id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_sale RECORD;
  v_item RECORD;
  v_cost NUMERIC;
BEGIN
  -- Resolve the storefront org by public slug; catalog must be enabled.
  SELECT o.id INTO v_org_id
  FROM public.organizations o
  JOIN public.organization_public_profiles pp ON pp.organization_id = o.id
  WHERE o.slug = p_slug AND pp.catalog_enabled = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Дэлгүүр олдсонгүй';
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Нэвтрэх шаардлагатай';
  END IF;

  -- Lock the row: must belong to this org, be owned by the caller, and be
  -- pending. FOR UPDATE serializes concurrent cancels / staff completions.
  SELECT s.id, s.status, s.branch_id INTO v_sale
  FROM public.sales s
  WHERE s.id = p_order_id
    AND s.organization_id = v_org_id
    AND s.store_account_id = auth.uid()
    AND s.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Захиалга олдсонгүй';
  END IF;

  IF v_sale.status <> 'pending' THEN
    RAISE EXCEPTION 'Зөвхөн хүлээгдэж буй захиалгыг цуцлах боломжтой';
  END IF;

  -- Restock — mirror submit_shop_order step 15 exactly (inverse), and insert
  -- the compensating 'in' movement with the same unit_cost semantics
  -- (variant cost_price first, else product cost_price).
  FOR v_item IN
    SELECT si.product_id, si.variant_id, si.quantity
    FROM public.sale_items si
    WHERE si.sale_id = v_sale.id AND si.deleted_at IS NULL
    ORDER BY si.product_id::text, si.variant_id::text NULLS LAST
  LOOP
    SELECT COALESCE(
      (SELECT pv.cost_price FROM public.product_variants pv WHERE pv.id = v_item.variant_id),
      (SELECT p.cost_price FROM public.products p WHERE p.id = v_item.product_id)
    ) INTO v_cost;

    IF v_item.variant_id IS NULL THEN
      UPDATE public.products
      SET current_stock = current_stock + v_item.quantity
      WHERE id = v_item.product_id;
    ELSE
      UPDATE public.product_variants
      SET current_stock = current_stock + v_item.quantity
      WHERE id = v_item.variant_id;
    END IF;

    INSERT INTO public.stock_movements (
      organization_id, branch_id, product_id, type, quantity, unit_cost,
      reference, created_by, variant_id
    ) VALUES (
      -- created_by stays NULL like submit_shop_order's movement insert: a
      -- buyer's auth uid is not a profiles row (store_accounts ≠ profiles),
      -- and stock_movements.created_by references profiles(id).
      v_org_id, v_sale.branch_id, v_item.product_id, 'in', v_item.quantity,
      v_cost, 'cancel:' || v_sale.id::text, NULL, v_item.variant_id
    );
  END LOOP;

  UPDATE public.sales
  SET status = 'cancelled',
      status_history = COALESCE(status_history, '[]'::jsonb) || jsonb_build_object(
        'status', 'cancelled',
        'at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'by', 'buyer'
      )
  WHERE id = v_sale.id;

  RETURN QUERY SELECT v_sale.id, 'cancelled'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_my_order(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_my_order(text, uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────
-- 4. Promo matcher helpers (shared by the catalog RPCs)
-- ─────────────────────────────────────────────
-- Short MN label for a promotion's reward. free_product → "<buy qty>+1"
-- (buy quantity from the min_quantity condition, default 2 → "2+1");
-- free_shipping → "Үнэгүй хүргэлт"; any discount reward → "Хямдрал".
-- Uses the FIRST reward row per promotion, like submit_shop_order.
CREATE OR REPLACE FUNCTION public.get_promo_reward_label(p_promo_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = ''
AS $function$
  SELECT CASE rw.reward_type
    WHEN 'free_product' THEN COALESCE(NULLIF(q.cond_value, ''), '2') || '+1'
    WHEN 'free_shipping' THEN 'Үнэгүй хүргэлт'
    ELSE 'Хямдрал'
  END
  FROM public.promotion_rewards rw
  LEFT JOIN LATERAL (
    SELECT pc.condition_value AS cond_value
    FROM public.promotion_conditions pc
    WHERE pc.promotion_id = p_promo_id AND pc.condition_type = 'min_quantity'
    ORDER BY pc.created_at, pc.id
    LIMIT 1
  ) q ON true
  WHERE rw.promotion_id = p_promo_id
  ORDER BY rw.created_at, rw.id
  LIMIT 1;
$function$;

-- Best ACTIVE promotion matching a product, or NULL. Deterministic:
--   * Promotions considered: org-scoped, is_active, valid_from <= now(),
--     valid_until (if any) > now(), usage cap not exhausted.
--   * A promotion matches when EVERY condition is satisfiable by this
--     product (min_quantity / min_amount are order-level → neutral; a
--     specific_products condition must name the product; a
--     specific_categories condition must name the product's category).
--   * Reward relevance: discount rewards (Хямдрал) and free_shipping
--     (Үнэгүй хүргэлт) match any such product; free_product matches only
--     when the product IS the reward product OR is named by a
--     specific_products condition (the "buy" product of a buy_x_get_y).
--   * Winner: highest priority, then earliest created_at (ties: first
--     reward row), matching submit_shop_order's evaluation order.
CREATE OR REPLACE FUNCTION public.get_product_promo(p_org_id uuid, p_product_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $function$
  SELECT jsonb_build_object(
    'id', pr.id,
    'title', pr.name,
    'reward_label', public.get_promo_reward_label(pr.id)
  )
  FROM public.promotions pr
  JOIN LATERAL (
    SELECT rw.reward_type, rw.reward_product_id
    FROM public.promotion_rewards rw
    WHERE rw.promotion_id = pr.id
    ORDER BY rw.created_at, rw.id
    LIMIT 1
  ) rw ON true
  WHERE pr.organization_id = p_org_id
    AND pr.is_active = true
    AND pr.valid_from <= now()
    AND (pr.valid_until IS NULL OR pr.valid_until > now())
    AND (pr.usage_limit IS NULL OR pr.used_count < pr.usage_limit)
    -- Every condition must be satisfiable by this product.
    AND NOT EXISTS (
      SELECT 1 FROM public.promotion_conditions pc
      WHERE pc.promotion_id = pr.id
        AND (
          (pc.condition_type = 'specific_products'
            AND pc.condition_value <> p_product_id::text)
          OR
          (pc.condition_type = 'specific_categories'
            AND pc.condition_value IS DISTINCT FROM (
              SELECT p.category_id::text FROM public.products p WHERE p.id = p_product_id
            ))
        )
    )
    -- Reward must be relevant to this product.
    AND (
      rw.reward_type IN ('percentage_discount', 'fixed_discount', 'free_shipping')
      OR (rw.reward_type = 'free_product' AND (
        rw.reward_product_id = p_product_id
        OR EXISTS (
          SELECT 1 FROM public.promotion_conditions pc
          WHERE pc.promotion_id = pr.id
            AND pc.condition_type = 'specific_products'
            AND pc.condition_value = p_product_id::text
        )
      ))
    )
  ORDER BY pr.priority DESC, pr.created_at ASC
  LIMIT 1;
$function$;

-- ─────────────────────────────────────────────
-- 5. get_public_products — filters, sort, reviews, promo
-- ─────────────────────────────────────────────
-- NOTE: the old 5-arg overload is dropped; the new signature keeps every
-- existing parameter (all new ones have DEFAULTs, so existing callers keep
-- working) and adds:
--   p_min_price / p_max_price — filter on the BASE sale_price only
--     (variant prices are deliberately ignored for filtering).
--   p_sort — 'price_asc' | 'price_desc' | 'newest' | 'name'; any other
--     value falls back to the default name order.
--   p_product_ids — wishlist fetch: restrict to these ids, combined
--     normally with category/search filters.
DROP FUNCTION IF EXISTS public.get_public_products(text, uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_public_products(
  p_slug text,
  p_category_id uuid DEFAULT NULL::uuid,
  p_search text DEFAULT NULL::text,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 24,
  p_min_price numeric DEFAULT NULL::numeric,
  p_max_price numeric DEFAULT NULL::numeric,
  p_sort text DEFAULT NULL::text,
  p_product_ids uuid[] DEFAULT NULL::uuid[]
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

  -- Count matching products (same filter set as the data query)
  SELECT count(*) INTO v_total
  FROM public.products p
  WHERE p.organization_id = v_org_id
    AND p.is_public = true
    AND p.deleted_at IS NULL
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
    AND (p_min_price IS NULL OR p.sale_price >= p_min_price)
    AND (p_max_price IS NULL OR p.sale_price <= p_max_price)
    AND (p_product_ids IS NULL OR p.id = ANY(p_product_ids));

  v_offset := (p_page - 1) * p_page_size;

  -- Fetch products (safe fields only — cost/min_stock/SKU never exposed).
  -- review_count / review_average come from APPROVED reviews only;
  -- promo is the best active promotion matching this product (or null).
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
      'current_stock', CASE WHEN v_show_stock THEN p.current_stock ELSE NULL END,
      'review_count', (
        SELECT count(*) FROM public.reviews r
        WHERE r.product_id = p.id AND r.status = 'approved'
      ),
      'review_average', (
        SELECT round(avg(r.rating)::numeric, 2) FROM public.reviews r
        WHERE r.product_id = p.id AND r.status = 'approved'
      ),
      'promo', public.get_product_promo(p.organization_id, p.id)
    ) AS item
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE p.organization_id = v_org_id
      AND p.is_public = true
      AND p.deleted_at IS NULL
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
      AND (p_min_price IS NULL OR p.sale_price >= p_min_price)
      AND (p_max_price IS NULL OR p.sale_price <= p_max_price)
      AND (p_product_ids IS NULL OR p.id = ANY(p_product_ids))
    ORDER BY
      CASE p_sort
        WHEN 'price_asc' THEN 1
        WHEN 'price_desc' THEN 2
        WHEN 'newest' THEN 3
        ELSE 4  -- 'name' or any invalid value → default name order
      END,
      CASE p_sort WHEN 'price_asc' THEN p.sale_price END ASC NULLS LAST,
      CASE p_sort WHEN 'price_desc' THEN p.sale_price END DESC NULLS LAST,
      CASE p_sort WHEN 'newest' THEN p.created_at END DESC NULLS LAST,
      p.name
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

REVOKE EXECUTE ON FUNCTION public.get_public_products(text, uuid, text, integer, integer, numeric, numeric, text, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_products(text, uuid, text, integer, integer, numeric, numeric, text, uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_products(text, uuid, text, integer, integer, numeric, numeric, text, uuid[]) TO authenticated;

-- ─────────────────────────────────────────────
-- 6. get_public_product — reviews, promo, related
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
    ),
    'review_count', (
      SELECT count(*) FROM public.reviews r
      WHERE r.product_id = p.id AND r.status = 'approved'
    ),
    'review_average', (
      SELECT round(avg(r.rating)::numeric, 2) FROM public.reviews r
      WHERE r.product_id = p.id AND r.status = 'approved'
    ),
    'promo', public.get_product_promo(p.organization_id, p.id),
    'related', (
      SELECT COALESCE(json_agg(t), '[]'::json)
      FROM (
        SELECT json_build_object(
          'id', p2.id,
          'name', p2.name,
          'sale_price', p2.sale_price,
          'image_url', p2.image_url,
          'category_name', c2.name
        ) AS t
        FROM public.products p2
        LEFT JOIN public.categories c2 ON c2.id = p2.category_id
        WHERE p2.organization_id = v_org_id
          AND p2.category_id = p.category_id
          AND p2.id <> p.id
          AND p2.is_public = true
          AND p2.deleted_at IS NULL
        ORDER BY p2.name
        LIMIT 4
      ) r
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
-- 7. get_public_promotions — active promos for a catalog-enabled org
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_public_promotions(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_result jsonb;
BEGIN
  SELECT o.id INTO v_org_id
  FROM public.organizations o
  JOIN public.organization_public_profiles pp ON pp.organization_id = o.id
  WHERE o.slug = p_slug AND pp.catalog_enabled = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'title', p.name,
        'description', p.description,
        'reward_label', public.get_promo_reward_label(p.id),
        'valid_from', p.valid_from,
        'valid_until', p.valid_until,
        'type', p.type
      )
      ORDER BY p.priority DESC, p.created_at ASC
    ),
    '[]'::jsonb
  ) INTO v_result
  FROM public.promotions p
  WHERE p.organization_id = v_org_id
    AND p.is_active = true
    AND p.valid_from <= now()
    AND (p.valid_until IS NULL OR p.valid_until > now())
    AND (p.usage_limit IS NULL OR p.used_count < p.usage_limit)
    -- Promos without any reward are inert (checkout skips them too) and
    -- must not be advertised with a NULL reward_label.
    AND EXISTS (
      SELECT 1 FROM public.promotion_rewards rw
      WHERE rw.promotion_id = p.id
    );

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_promotions(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_promotions(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_promotions(text) TO authenticated;

-- ─────────────────────────────────────────────
-- 8. organization_public_profiles.estimated_delivery_hours
-- ─────────────────────────────────────────────
ALTER TABLE public.organization_public_profiles
  ADD COLUMN IF NOT EXISTS estimated_delivery_hours integer;

COMMENT ON COLUMN public.organization_public_profiles.estimated_delivery_hours IS
  'Estimated delivery time in hours shown at checkout ("~N цагт хүргэгдэнэ"); NULL = no estimate shown';

-- ─────────────────────────────────────────────
-- 9. product_images admin grants (idempotent)
--    Policies + grants already landed in 20260810190000; re-grant in case a
--    remote environment drifted. Policies mirror products: org-scoped via
--    get_current_organization() + has_permission('products.*').
-- ─────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
