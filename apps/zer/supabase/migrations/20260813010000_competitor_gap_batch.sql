-- =============================================
-- Competitor gap batch (2026-08-13) — backend contracts
--
--   1. G-TIMELINE: get_public_order() now returns the persisted
--      sales.status_history (the buyer UI already renders it; the RPC
--      simply omitted the field).
--   2. G-EMAIL: single-path buyer confirmation email for EVERY online
--      order (web server action + mobile RPC + any future client). An
--      AFTER INSERT trigger on sales (is_online=true) fires pg_net →
--      POST {order_id} to {site_url}/api/notify/order-confirmation;
--      the route dedupes via order_notifications (unique order_id).
--      site_url lives in app_config (seeded here, refreshed by
--      /api/cron/setup at deploy).
--   3. G-LOYALTY-DRIFT: loyalty_settings / loyalty_rewards /
--      loyalty_points tables + RLS + grants. Schema mirrors the
--      remote-created tables exactly (verified 2026-08-13 via
--      information_schema) so local == remote.
--   4. G-ABANDONED: abandoned_carts + abandoned_cart_emails + a
--      pg_cron job (every 30 min) → /api/cron/abandoned-cart.
--   5. G-QPAY / G-BNPL prep: sale_payments (gateway payment records,
--      unique (gateway, gateway_ref) for webhook idempotency) +
--      confirm_online_payment() SECURITY DEFINER — flips a pending
--      online sale to completed, records the payment, appends status
--      history. Called ONLY by the gateway webhook route (service role).
-- =============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─────────────────────────────────────────────
-- 0. payment_method check drift fix (G-QPAY/G-BNPL prep)
--    The repo's sales table has NO payment_method check, but the REMOTE
--    project has one that excludes 'qpay' — so submit_shop_order with
--    p_payment_method='qpay' violates the constraint on remote and the
--    whole order fails. Normalize: replace with a check covering every
--    method the checkout sends (cash, card, bank_transfer, qpay) plus the
--    future bnpl stub. Idempotent on both local (no check → dropped, then
--    created) and remote (restrictive check → replaced).
-- ─────────────────────────────────────────────
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_payment_method_check'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_payment_method_check
      CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'invoice', 'qpay', 'bnpl'));
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 1. G-TIMELINE — expose persisted status history
-- ─────────────────────────────────────────────
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
  SELECT o.id INTO v_org_id
  FROM public.organizations o
  JOIN public.organization_public_profiles pp ON pp.organization_id = o.id
  WHERE o.slug = p_slug AND pp.catalog_enabled = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

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
    'status_history', COALESCE(s.status_history, '[]'::jsonb),
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
-- 2. G-EMAIL — site_url config + notification dedupe + trigger
-- ─────────────────────────────────────────────
-- app_config exists on remote but was created outside the repo migrations;
-- create it here (idempotent) so this migration is self-sufficient on any DB.
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.app_config IS
  'Global app configuration. site_url = the storefront deployment origin used by DB-side pg_net hooks (/api/notify/*, cron jobs); refreshed by GET /api/cron/setup at deploy.';

-- app_config: global key/value store (key = text PK, value = jsonb).
-- site_url stored as OBJECT {"site_url": "..."} — the trigger reads
-- value->>'site_url'. Insert is constraint-agnostic: some environments
-- created app_config without a PK/unique on key, so ON CONFLICT would fail.
INSERT INTO public.app_config (key, value)
SELECT 'site_url', '{"site_url": "https://zuiio.mn"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.app_config WHERE key = 'site_url');

-- Dedupe log for outbound buyer order notifications (email now, SMS later).
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  error text
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_notifications_order_channel
  ON public.order_notifications(order_id, channel);

COMMENT ON TABLE public.order_notifications IS
  'Outbound buyer order notifications, deduped per (order_id, channel) so a replayed trigger / webhook / cron call can never double-send.';

ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;
-- No policies: only service-role callers (Next.js routes) touch this.

GRANT ALL PRIVILEGES ON public.order_notifications TO service_role;

-- AFTER INSERT trigger: every online order asks the app to send the buyer
-- confirmation email. Never throws — a pg_net failure must not roll back
-- the sale.
CREATE OR REPLACE FUNCTION public.notify_online_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_site_url text;
BEGIN
  IF NOT NEW.is_online THEN
    RETURN NEW;
  END IF;

  SELECT value->>'site_url' INTO v_site_url
  FROM public.app_config WHERE key = 'site_url';

  IF v_site_url IS NULL OR v_site_url = '' THEN
    RAISE NOTICE 'site_url not configured; skipping order notification for %', NEW.id;
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_site_url || '/api/notify/order-confirmation',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('order_id', NEW.id::text)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'notify_online_order pg_net failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sale_notify_online_order ON public.sales;
CREATE TRIGGER trg_sale_notify_online_order
  AFTER INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.notify_online_order();

-- ─────────────────────────────────────────────
-- 3. G-LOYALTY-DRIFT — schema parity (mirrors remote, verified 2026-08-13)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  points_per_mnt numeric NOT NULL DEFAULT 1.0,
  min_purchase numeric NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  discount_type text,
  discount_value numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  points integer NOT NULL,
  type text NOT NULL,
  reference_id uuid,
  notes text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_organization_id ON public.loyalty_points(organization_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON public.loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_organization_id ON public.loyalty_rewards(organization_id);

-- RLS: org-scoped, exactly like the deliveries pattern. Staff admins manage
-- settings + rewards; points are read/written via org-scoped staff actions.
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS loyalty_settings_org_access ON public.loyalty_settings;
CREATE POLICY loyalty_settings_org_access ON public.loyalty_settings
  FOR ALL USING (organization_id = public.get_current_organization())
  WITH CHECK (organization_id = public.get_current_organization());

DROP POLICY IF EXISTS loyalty_rewards_org_access ON public.loyalty_rewards;
CREATE POLICY loyalty_rewards_org_access ON public.loyalty_rewards
  FOR ALL USING (organization_id = public.get_current_organization())
  WITH CHECK (organization_id = public.get_current_organization());

DROP POLICY IF EXISTS loyalty_points_org_access ON public.loyalty_points;
CREATE POLICY loyalty_points_org_access ON public.loyalty_points
  FOR ALL USING (organization_id = public.get_current_organization())
  WITH CHECK (organization_id = public.get_current_organization());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_points TO authenticated;
GRANT ALL PRIVILEGES ON public.loyalty_settings TO service_role;
GRANT ALL PRIVILEGES ON public.loyalty_rewards TO service_role;
GRANT ALL PRIVILEGES ON public.loyalty_points TO service_role;

-- ─────────────────────────────────────────────
-- 4. G-ABANDONED — cart capture + recovery emails
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  contact_email text,
  contact_name text,
  contact_phone text,
  subtotal numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MNT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_org_updated ON public.abandoned_carts(organization_id, updated_at);

CREATE TABLE IF NOT EXISTS public.abandoned_cart_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.abandoned_carts(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id)
);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_cart_emails ENABLE ROW LEVEL SECURITY;
-- No policies: written by the public capture route + read by the cron
-- route, both service-role.

GRANT ALL PRIVILEGES ON public.abandoned_carts TO service_role;
GRANT ALL PRIVILEGES ON public.abandoned_cart_emails TO service_role;

-- Cron: every 30 minutes, ask the app to scan for stale carts and send
-- recovery emails. Idempotent unschedule first (pattern from
-- 20260810180000_fix_cron_schedule_idempotency.sql).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'abandoned-cart-recovery') THEN
    PERFORM cron.unschedule('abandoned-cart-recovery');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.schedule_abandoned_cart_cron(p_app_url text)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.app_config
  SET value = jsonb_build_object('site_url', p_app_url), updated_at = now()
  WHERE key = 'site_url';

  PERFORM cron.unschedule('abandoned-cart-recovery');

  PERFORM cron.schedule(
    'abandoned-cart-recovery',
    '*/30 * * * *',
    format(
      'SELECT net.http_post(
        url:=%L,
        headers:=''{"Content-Type": "application/json"}''::jsonb,
        body:=''{}''::jsonb
      )',
      p_app_url || '/api/cron/abandoned-cart'
    )
  );

  RETURN 'abandoned-cart-recovery scheduled';
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_abandoned_cart_cron(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_abandoned_cart_cron(text) TO service_role;

-- ─────────────────────────────────────────────
-- 5. G-QPAY / G-BNPL prep — gateway payment records + confirm RPC
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sale_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  gateway text NOT NULL CHECK (gateway IN ('qpay', 'bank_transfer', 'bnpl')),
  gateway_ref text,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
  confirmed_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gateway, gateway_ref)
);

CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id ON public.sale_payments(sale_id);

COMMENT ON TABLE public.sale_payments IS
  'Gateway payment records. UNIQUE (gateway, gateway_ref) makes webhook
  confirmation idempotent: a replayed QPay/BNPL callback can never double
  confirm an order.';

ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
-- No policies: written/read only by service-role webhook routes.

GRANT ALL PRIVILEGES ON public.sale_payments TO service_role;

-- Flip a pending online sale to completed once a gateway confirms payment.
-- Idempotent: the (gateway, gateway_ref) unique index + ON CONFLICT make a
-- replayed webhook a no-op. SECURITY DEFINER + service-role-only grant.
CREATE OR REPLACE FUNCTION public.confirm_online_payment(
  p_sale_id uuid,
  p_gateway text,
  p_gateway_ref text,
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sale RECORD;
  v_paid boolean;
BEGIN
  SELECT s.id, s.status, s.paid_amount, s.total_amount, s.organization_id, s.is_online
  INTO v_sale
  FROM public.sales s
  WHERE s.id = p_sale_id AND s.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Захиалга олдсонгүй';
  END IF;

  IF NOT v_sale.is_online THEN
    RAISE EXCEPTION 'Энэ захиалга онлайн захиалга биш';
  END IF;

  IF v_sale.status = 'cancelled' THEN
    RAISE EXCEPTION 'Цуцлагдсан захиалгын төлбөр баталгаажуулах боломжгүй';
  END IF;

  -- Record the payment first (idempotency anchor).
  INSERT INTO public.sale_payments (sale_id, gateway, gateway_ref, amount, status, confirmed_at)
  VALUES (p_sale_id, p_gateway, p_gateway_ref, p_amount, 'confirmed', now())
  ON CONFLICT (gateway, gateway_ref) DO NOTHING;

  v_paid := (v_sale.paid_amount + p_amount) >= v_sale.total_amount;

  IF v_sale.status = 'pending' THEN
    UPDATE public.sales
    SET status = CASE WHEN v_paid THEN 'completed' ELSE 'pending' END,
        paid_amount = v_sale.paid_amount + p_amount,
        status_history = COALESCE(status_history, '[]'::jsonb) || jsonb_build_object(
          'status', CASE WHEN v_paid THEN 'completed' ELSE 'pending' END,
          'at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
          'by', 'system'
        )
    WHERE id = p_sale_id;
  ELSE
    UPDATE public.sales
    SET paid_amount = v_sale.paid_amount + p_amount
    WHERE id = p_sale_id;
  END IF;

  RETURN jsonb_build_object(
    'order_id', p_sale_id,
    'status', CASE WHEN v_paid THEN 'completed' ELSE 'pending' END,
    'paid', v_paid
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_online_payment(uuid, text, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_online_payment(uuid, text, text, numeric) TO service_role;
