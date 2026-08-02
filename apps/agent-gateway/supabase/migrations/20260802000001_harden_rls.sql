-- 20260802000000_harden_rls.sql
-- Production RLS hardening.
--
-- The gateway runs on the service-role client (RLS-bypassing) and resolves
-- tenancy in app code. Defense-in-depth: every table must either have
-- service-role-scoped policies or NO policies at all (RLS denies everyone
-- by default when no policy matches). Tables with OPEN USING(true) policies
-- let anon/authenticated roles read and write business data — a real hole.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. channel_connections — had NO RLS at all. Enable + FORCE, no policies:
--    only the service role (bypasses RLS) can access.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_connections FORCE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. sms tables — drop the open USING(true) policies that granted public access.
--    RLS stays enabled; only the service role can touch these tables.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_all_sms_messages" ON public.sms_messages;
DROP POLICY IF EXISTS "service_all_sms_payments" ON public.sms_payments;
DROP POLICY IF EXISTS "service_all_sms_templates" ON public.sms_parsing_templates;

ALTER TABLE public.sms_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sms_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sms_parsing_templates FORCE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Flow executor tables — RLS enabled, no policies (already deny-all);
--    add FORCE so even privileged non-service roles are subject to RLS.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.flow_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.flow_wait_states FORCE ROW LEVEL SECURITY;
ALTER TABLE public.flow_outbox FORCE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Remaining agent tables that were enabled without policies — FORCE them too
--    so RLS applies to table owners and any future privileged roles.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.telegram_links FORCE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE public.agent_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.agent_daily_spend FORCE ROW LEVEL SECURITY;
ALTER TABLE public.agent_audit_log FORCE ROW LEVEL SECURITY;
ALTER TABLE public.custom_bots FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pending_updates FORCE ROW LEVEL SECURITY;
