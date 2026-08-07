-- Shop V1: Products, orders, public catalogue view, storage, and commands.
-- Creates the public merchandise shop tables with RLS, curated public view via
-- security_barrier, product-image storage bucket, and security-definer commands
-- for all mutations. No browser receives QPay or service-role credentials.
-- All mutations go through cmd_* functions with server-side price authority.

-- ============================================================================
-- 1. Enum: order_status
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. Table: products
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  slug text NOT NULL UNIQUE,
  description text,
  price_mnt bigint NOT NULL CHECK (price_mnt > 0),
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- ============================================================================
-- 3. Table: orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  items jsonb NOT NULL,
  total_mnt bigint NOT NULL CHECK (total_mnt > 0),
  status order_status NOT NULL DEFAULT 'pending',
  qpay_invoice_id text UNIQUE,
  qpay_qr_image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at);

-- ============================================================================
-- 4. Row-level security
-- ============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Products: authenticated (admin) full access; anon read only
-- Use DO block for idempotent policy creation
DO $$ BEGIN
  DROP POLICY IF EXISTS "products_admin_all" ON public.products;
  CREATE POLICY "products_admin_all" ON public.products
    TO authenticated
    USING (true)
    WITH CHECK (true);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "products_public_read" ON public.products;
  CREATE POLICY "products_public_read" ON public.products
    FOR SELECT TO anon
    USING (true);
END $$;

-- Orders: authenticated (admin) only — customer data, payment info, and QR are
-- never exposed to anonymous users.
DO $$ BEGIN
  DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
  CREATE POLICY "orders_admin_all" ON public.orders
    TO authenticated
    USING (true)
    WITH CHECK (true);
END $$;

-- ============================================================================
-- 5. Public view: v_public_shop_products (security_barrier)
-- ============================================================================

-- DROP first to handle column order changes that CREATE OR REPLACE cannot
DROP VIEW IF EXISTS public.v_public_shop_products CASCADE;

CREATE VIEW public.v_public_shop_products
WITH (security_barrier = true) AS
SELECT
  id,
  name,
  name_en,
  slug,
  description,
  price_mnt,
  images,
  category,
  variants,
  is_available,
  created_at,
  updated_at
FROM public.products
WHERE is_available = true;

-- ============================================================================
-- 6. Storage bucket: product-images (public)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 2097152, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
  CREATE POLICY "product_images_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "product_images_auth_upload" ON storage.objects;
  CREATE POLICY "product_images_auth_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images');
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "product_images_auth_update" ON storage.objects;
  CREATE POLICY "product_images_auth_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "product_images_auth_delete" ON storage.objects;
  CREATE POLICY "product_images_auth_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'product-images');
END $$;

-- ============================================================================
-- 7. Command: cmd_create_shop_order
--    Validates product availability and stock, calculates price server-side,
--    reserves the selected variant atomically, creates a pending order with an
--    immutable item snapshot. Public — anyone can call.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cmd_create_shop_order(
  p_customer_name text,
  p_phone text,
  p_product_id uuid,
  p_variant_index integer
) RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_product public.products;
  v_variants jsonb;
  v_variant jsonb;
  v_stock integer;
  v_item jsonb;
  v_order public.orders;
BEGIN
  -- 1. Load product with row lock for stock reservation
  SELECT * INTO v_product FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ONOO_SHOP_PRODUCT_NOT_FOUND';
  END IF;
  IF NOT v_product.is_available THEN
    RAISE EXCEPTION 'ONOO_SHOP_PRODUCT_UNAVAILABLE';
  END IF;

  -- 2. Validate variant index and stock
  v_variants := v_product.variants;
  IF jsonb_typeof(v_variants) <> 'array' OR jsonb_array_length(v_variants) = 0 THEN
    RAISE EXCEPTION 'ONOO_SHOP_NO_VARIANTS';
  END IF;
  IF p_variant_index < 0 OR p_variant_index >= jsonb_array_length(v_variants) THEN
    RAISE EXCEPTION 'ONOO_SHOP_INVALID_VARIANT';
  END IF;

  v_variant := v_variants->p_variant_index;
  v_stock := (v_variant->>'stock')::integer;
  IF v_stock <= 0 THEN
    RAISE EXCEPTION 'ONOO_SHOP_OUT_OF_STOCK';
  END IF;

  -- 3. Reserve stock atomically
  v_variants := jsonb_set(
    v_variants,
    ARRAY[p_variant_index::text, 'stock'],
    to_jsonb(v_stock - 1)
  );
  UPDATE public.products SET variants = v_variants, updated_at = now()
  WHERE id = p_product_id;

  -- 4. Build immutable item snapshot
  v_item := jsonb_build_object(
    'product_id', v_product.id,
    'name', v_product.name,
    'name_en', v_product.name_en,
    'slug', v_product.slug,
    'price_mnt', v_product.price_mnt,
    'variant', v_variant,
    'quantity', 1
  );

  -- 5. Create pending order
  INSERT INTO public.orders (customer_name, phone, items, total_mnt, status)
  VALUES (
    trim(p_customer_name),
    trim(p_phone),
    jsonb_build_array(v_item),
    v_product.price_mnt,
    'pending'
  ) RETURNING * INTO v_order;

  -- 6. Audit
  PERFORM private.write_audit('create_shop_order', 'order', v_order.id,
    jsonb_build_object('product_id', p_product_id, 'variant_index', p_variant_index, 'total_mnt', v_product.price_mnt));

  RETURN v_order;
END;
$$;

-- ============================================================================
-- 8. Command: cmd_attach_shop_invoice
--    Attaches a server-created QPay invoice ID and QR image to a pending order.
--    Server-side only (called after QPay invoice creation succeeds).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cmd_attach_shop_invoice(
  p_order_id uuid,
  p_qpay_invoice_id text,
  p_qpay_qr_image text
) RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_order public.orders;
BEGIN
  -- 1. Load order with row lock, verify it is pending
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ONOO_SHOP_ORDER_NOT_FOUND';
  END IF;
  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'ONOO_SHOP_ORDER_NOT_PENDING';
  END IF;

  -- 2. Attach invoice details
  UPDATE public.orders
  SET qpay_invoice_id = p_qpay_invoice_id,
      qpay_qr_image = p_qpay_qr_image,
      updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  -- 3. Audit
  PERFORM private.write_audit('attach_shop_invoice', 'order', p_order_id,
    jsonb_build_object('qpay_invoice_id', p_qpay_invoice_id));

  RETURN v_order;
END;
$$;

-- ============================================================================
-- 9. Command: cmd_confirm_shop_payment
--    Idempotently transitions a pending order to 'paid' after server-side QPay
--    payment verification. Idempotent: calling with an already-paid invoice
--    returns the existing order without error.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cmd_confirm_shop_payment(
  p_qpay_invoice_id text
) RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_order public.orders;
BEGIN
  -- 1. Load order by invoice with row lock
  SELECT * INTO v_order FROM public.orders WHERE qpay_invoice_id = p_qpay_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ONOO_SHOP_ORDER_NOT_FOUND';
  END IF;

  -- 2. Idempotent: already paid — return existing order
  IF v_order.status = 'paid' THEN
    RETURN v_order;
  END IF;

  -- 3. Must be pending
  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'ONOO_SHOP_ORDER_NOT_PENDING';
  END IF;

  -- 4. Transition to paid
  UPDATE public.orders
  SET status = 'paid', updated_at = now()
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  -- 5. Audit
  PERFORM private.write_audit('confirm_shop_payment', 'order', v_order.id,
    jsonb_build_object('qpay_invoice_id', p_qpay_invoice_id));

  RETURN v_order;
END;
$$;

-- ============================================================================
-- 10. Command: cmd_update_shop_product
--     Updates editable product catalogue fields. Admin only.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cmd_update_shop_product(
  p_product_id uuid,
  p_name text DEFAULT NULL,
  p_name_en text DEFAULT NULL,
  p_slug text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_price_mnt bigint DEFAULT NULL,
  p_images jsonb DEFAULT NULL,
  p_category text DEFAULT NULL
) RETURNS public.products LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_product public.products;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED';
  END IF;

  SELECT * INTO v_product FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ONOO_SHOP_PRODUCT_NOT_FOUND';
  END IF;

  UPDATE public.products
  SET
    name = COALESCE(p_name, name),
    name_en = CASE WHEN p_name_en IS NOT NULL THEN p_name_en ELSE name_en END,
    slug = COALESCE(p_slug, slug),
    description = CASE WHEN p_description IS NOT NULL THEN p_description ELSE description END,
    price_mnt = COALESCE(p_price_mnt, price_mnt),
    images = COALESCE(p_images, images),
    category = CASE WHEN p_category IS NOT NULL THEN p_category ELSE category END,
    updated_at = now()
  WHERE id = p_product_id
  RETURNING * INTO v_product;

  PERFORM private.write_audit('update_shop_product', 'product', p_product_id,
    jsonb_build_object('name', COALESCE(p_name, v_product.name)));

  RETURN v_product;
END;
$$;

-- ============================================================================
-- 11. Command: cmd_set_shop_product_availability
--     Toggles a product's is_available flag. Admin only.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cmd_set_shop_product_availability(
  p_product_id uuid,
  p_is_available boolean
) RETURNS public.products LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_product public.products;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED';
  END IF;

  SELECT * INTO v_product FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ONOO_SHOP_PRODUCT_NOT_FOUND';
  END IF;

  UPDATE public.products
  SET is_available = p_is_available, updated_at = now()
  WHERE id = p_product_id
  RETURNING * INTO v_product;

  PERFORM private.write_audit('set_shop_product_availability', 'product', p_product_id,
    jsonb_build_object('is_available', p_is_available));

  RETURN v_product;
END;
$$;

-- ============================================================================
-- 12. Command: cmd_mark_shop_order_shipped
--     Transitions a paid order to shipped. Admin only.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cmd_mark_shop_order_shipped(
  p_order_id uuid
) RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_order public.orders;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ONOO_SHOP_ORDER_NOT_FOUND';
  END IF;
  IF v_order.status <> 'paid' THEN
    RAISE EXCEPTION 'ONOO_SHOP_ORDER_MUST_BE_PAID';
  END IF;

  UPDATE public.orders
  SET status = 'shipped', updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  PERFORM private.write_audit('mark_shop_order_shipped', 'order', p_order_id,
    jsonb_build_object('previous_status', 'paid'));

  RETURN v_order;
END;
$$;

-- ============================================================================
-- 13. Command: cmd_cancel_shop_order
--     Cancels a pending order and releases reserved stock. Admin only.
--     Returns the cancelled order. Skips stock restoration if the product was
--     deleted after the order was created.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cmd_cancel_shop_order(
  p_order_id uuid
) RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_order public.orders;
  v_item jsonb;
  v_product public.products;
  v_variants jsonb;
  v_variant_idx integer;
  v_array_len integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED';
  END IF;

  -- 1. Load order with row lock
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ONOO_SHOP_ORDER_NOT_FOUND';
  END IF;
  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'ONOO_SHOP_ORDER_MUST_BE_PENDING';
  END IF;

  -- 2. Release reserved stock from the first item's snapshot
  v_item := v_order.items->0;
  IF v_item IS NOT NULL AND jsonb_typeof(v_item) = 'object' AND (v_item->>'product_id') IS NOT NULL THEN
    BEGIN
      SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::uuid FOR UPDATE;
      IF FOUND THEN
        v_variants := v_product.variants;
        v_array_len := jsonb_array_length(v_variants);
        FOR v_variant_idx IN 0..v_array_len-1 LOOP
          IF v_variants->v_variant_idx->>'size' = v_item->'variant'->>'size' THEN
            v_variants := jsonb_set(
              v_variants,
              ARRAY[v_variant_idx::text, 'stock'],
              to_jsonb(((v_variants->v_variant_idx->>'stock')::integer) + 1)
            );
            UPDATE public.products SET variants = v_variants, updated_at = now()
            WHERE id = (v_item->>'product_id')::uuid;
            EXIT;
          END IF;
        END LOOP;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Product may have been deleted; release what we can
      NULL;
    END;
  END IF;

  -- 3. Transition to cancelled
  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  PERFORM private.write_audit('cancel_shop_order', 'order', p_order_id, '{}'::jsonb);

  RETURN v_order;
END;
$$;

-- ============================================================================
-- 14. Command: cmd_update_shop_product_variants
--     Replaces the full variants array on a product (size + stock entries).
--     Admin only. Validates that the input is a JSON array.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cmd_update_shop_product_variants(
  p_product_id uuid,
  p_variants jsonb
) RETURNS public.products LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_product public.products;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED';
  END IF;

  IF jsonb_typeof(p_variants) <> 'array' THEN
    RAISE EXCEPTION 'ONOO_SHOP_INVALID_VARIANTS: variants must be a JSON array';
  END IF;

  SELECT * INTO v_product FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ONOO_SHOP_PRODUCT_NOT_FOUND';
  END IF;

  UPDATE public.products
  SET variants = p_variants, updated_at = now()
  WHERE id = p_product_id
  RETURNING * INTO v_product;

  PERFORM private.write_audit('update_shop_product_variants', 'product', p_product_id,
    jsonb_build_object('variant_count', jsonb_array_length(p_variants)));

  RETURN v_product;
END;
$$;

-- ============================================================================
-- 15. Grants and permissions
-- ============================================================================

-- Public catalogue view
GRANT SELECT ON public.v_public_shop_products TO anon, authenticated;

-- Order creation: public (anon can create orders without login)
REVOKE EXECUTE ON FUNCTION public.cmd_create_shop_order(text, text, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_create_shop_order(text, text, uuid, integer) TO anon, authenticated;

-- Server-side invoice/payment commands (called from API routes with service_role
-- or authenticated client; the API layer gates authorization)
REVOKE EXECUTE ON FUNCTION public.cmd_attach_shop_invoice(uuid, text, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cmd_attach_shop_invoice(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cmd_confirm_shop_payment(text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cmd_confirm_shop_payment(text) TO authenticated;

-- Admin catalogue and order management
REVOKE EXECUTE ON FUNCTION public.cmd_update_shop_product(uuid, text, text, text, text, bigint, jsonb, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cmd_update_shop_product(uuid, text, text, text, text, bigint, jsonb, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cmd_set_shop_product_availability(uuid, boolean) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cmd_set_shop_product_availability(uuid, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cmd_mark_shop_order_shipped(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cmd_mark_shop_order_shipped(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cmd_cancel_shop_order(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cmd_cancel_shop_order(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cmd_update_shop_product_variants(uuid, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cmd_update_shop_product_variants(uuid, jsonb) TO authenticated;
