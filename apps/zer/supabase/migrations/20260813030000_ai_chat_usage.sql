-- =============================================
-- Public storefront AI chat protection
--
-- The public AI chat endpoint (/api/ai/chat) is an anon entry point that
-- spends real LLM tokens per request. The old guard was an in-memory
-- per-IP window — per-lambda-instance on Vercel serverless, so a bot farm
-- (or a rotating-proxy attacker) could spread requests across many cold
-- instances and IPs and bypass it. This migration adds a durable, shared
-- guard:
--
--   1. Per-IP sliding window (20 req / 60s) — survives cold starts and
--      holds across ALL serverless instances (single source of truth).
--   2. Per-org daily token budget (500K estimated tokens / 24h) — stops a
--      distributed bot farm from burning one storefront's LLM budget.
--
-- The route hashes the client IP (sha-256) before sending it here, so raw
-- IPs are never stored. The RPC is SECURITY DEFINER and does everything in
-- one atomic call: window check, budget check, usage insert. Table access
-- is locked — anon can only call the RPC, never read/write rows directly.
-- =============================================

-- ── 1. Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_chat_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  estimated_tokens INTEGER NOT NULL DEFAULT 0 CHECK (estimated_tokens >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_usage_ip_time
  ON public.ai_chat_usage (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_chat_usage_org_time
  ON public.ai_chat_usage (organization_id, created_at);

ALTER TABLE public.ai_chat_usage ENABLE ROW LEVEL SECURITY;

-- No policies and no direct grants: anon inserts only happen through
-- record_ai_chat_request (SECURITY DEFINER, runs as owner). The table is
-- intentionally read-only to everyone else; orgs see spend via dashboards
-- built on the same RPC pattern later if needed.
REVOKE ALL ON TABLE public.ai_chat_usage FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON public.ai_chat_usage TO service_role;

-- ── 2. RPC ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_ai_chat_request(
  p_org_slug TEXT,
  p_ip_hash TEXT,
  p_estimated_tokens INTEGER DEFAULT 0
)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, daily_tokens BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_ip_window INT;
  v_daily BIGINT;
  v_tokens INT;
  v_budget BIGINT := 500000;  -- estimated tokens / org / 24h
  v_ip_limit INT := 20;       -- requests / ip / 60s
BEGIN
  v_tokens := GREATEST(0, COALESCE(p_estimated_tokens, 0));

  SELECT o.id INTO v_org_id
  FROM public.organizations o
  WHERE o.slug = p_org_slug;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'unknown-org'::TEXT, 0::BIGINT;
    RETURN;
  END IF;

  -- Per-IP sliding window.
  SELECT count(*) INTO v_ip_window
  FROM public.ai_chat_usage
  WHERE ip_hash = p_ip_hash
    AND created_at > now() - interval '60 seconds';
  IF v_ip_window >= v_ip_limit THEN
    RETURN QUERY SELECT false, 'ip-window'::TEXT, 0::BIGINT;
    RETURN;
  END IF;

  -- Per-org daily budget (rolling 24h).
  SELECT COALESCE(sum(estimated_tokens), 0) INTO v_daily
  FROM public.ai_chat_usage
  WHERE organization_id = v_org_id
    AND created_at > now() - interval '24 hours';
  IF v_daily + v_tokens > v_budget THEN
    RETURN QUERY SELECT false, 'org-daily-budget'::TEXT, v_daily::BIGINT;
    RETURN;
  END IF;

  INSERT INTO public.ai_chat_usage (organization_id, ip_hash, estimated_tokens)
  VALUES (v_org_id, p_ip_hash, v_tokens);

  RETURN QUERY SELECT true, 'ok'::TEXT, (v_daily + v_tokens)::BIGINT;
END;
$$;

REVOKE ALL ON FUNCTION public.record_ai_chat_request(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_ai_chat_request(TEXT, TEXT, INTEGER) TO anon;

COMMENT ON TABLE public.ai_chat_usage IS
  'Durable usage ledger for the public storefront AI chat: per-IP window + per-org daily token budget. IPs stored as sha-256 hashes only.';
COMMENT ON FUNCTION public.record_ai_chat_request IS
  'Atomic guard for POST /api/ai/chat: checks per-IP 60s window and per-org 24h token budget, records the request, returns whether it is allowed.';
