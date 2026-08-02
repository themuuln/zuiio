-- 20260802000003_async_jobs.sql
-- Durable async job queue for agent message processing.
--
-- Webhooks must return within ~8s. When a message outlives the request
-- budget it is enqueued here and picked up by the process-jobs cron
-- (every 5 minutes, see vercel.json). Unlike the pending_updates worker
-- queue, jobs carry a fully resolved GatewayContext, so the cron needs no
-- re-resolution and can deliver the reply on the originating channel.
--
-- RLS: enabled + FORCE with no policies — only the service role (which
-- bypasses RLS) can touch this table, matching channel_connections and the
-- other agent tables.

CREATE TABLE IF NOT EXISTS public.agent_async_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  channel         text NOT NULL,
  payload         jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  attempts        int  NOT NULL DEFAULT 0,
  last_error      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Efficient queue drain: oldest pending first.
CREATE INDEX IF NOT EXISTS idx_agent_async_jobs_status_created
  ON public.agent_async_jobs (status, created_at);

ALTER TABLE public.agent_async_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_async_jobs FORCE ROW LEVEL SECURITY;
