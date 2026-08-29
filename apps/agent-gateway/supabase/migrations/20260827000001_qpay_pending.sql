-- 20260827000001_qpay_pending.sql
-- QPay pending orders for 10-15min auto-notify on paid.
-- Inserted by placeOrderWithQpay/checkoutCartWithQpay, consumed by /api/qpay/webhook (Zer callback) or cron poll.

CREATE TABLE IF NOT EXISTS public.qpay_pending (
  order_id        uuid PRIMARY KEY,
  trace_id        text,
  organization_id uuid NOT NULL,
  psid            text NOT NULL,
  channel         text NOT NULL CHECK (channel IN ('messenger','instagram','webchat','telegram','whatsapp')),
  channel_chat_id text,
  amount          integer,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','expired','failed')),
  expires_at      timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qpay_pending_expires ON public.qpay_pending(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_qpay_pending_org ON public.qpay_pending(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qpay_pending_psid ON public.qpay_pending(psid);

ALTER TABLE public.qpay_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qpay_pending FORCE ROW LEVEL SECURITY;
-- No policies: service_role only
