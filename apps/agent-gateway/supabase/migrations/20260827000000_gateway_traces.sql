-- 20260827000000_gateway_traces.sql
-- Persistent trace log for every gateway request.
-- DX: makes agent-gateway traceable without Vercel dashboard.
-- Service-role only (RLS forced, no policies) — dashboard API reads via service client.

CREATE TABLE IF NOT EXISTS public.gateway_traces (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id          text NOT NULL UNIQUE,
  organization_id   uuid,
  channel           text NOT NULL CHECK (channel IN ('telegram','messenger','instagram','whatsapp','webchat')),
  channel_chat_id   text,
  channel_user_id   text,
  request_text      text,
  response_text     text,
  tool_calls        jsonb NOT NULL DEFAULT '[]'::jsonb,
  timings           jsonb,
  status            text NOT NULL CHECK (status IN ('ok','error','filtered')),
  error             text,
  request_id        text,
  deployment_id     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  -- Cheap retention: Vercel logs are 1h, keep traces 30d. Cleanup cron can delete where created_at < now() - interval '30 days'.
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

CREATE INDEX IF NOT EXISTS idx_gateway_traces_org_created ON public.gateway_traces(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gateway_traces_trace_id ON public.gateway_traces(trace_id);
CREATE INDEX IF NOT EXISTS idx_gateway_traces_channel_created ON public.gateway_traces(channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gateway_traces_expires ON public.gateway_traces(expires_at);

ALTER TABLE public.gateway_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_traces FORCE ROW LEVEL SECURITY;
-- No policies: anon/authenticated get nothing. Service role bypasses RLS.
