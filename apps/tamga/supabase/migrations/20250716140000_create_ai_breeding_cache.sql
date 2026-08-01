-- AI Breeding Advisor cache table.
-- Stores Gemini-generated breeding advice for 24 hours to avoid
-- redundant API calls for the same sire+dam combination.

CREATE TABLE ai_breeding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sire_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  dam_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  advice JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  UNIQUE(sire_id, dam_id)
);

-- Fast lookup for cache hits: same sire+dam.
-- (A WHERE expires_at > now() predicate is illegal — now() is VOLATILE — so
-- the expiry filter stays in the query; the index narrows on sire+dam.)
CREATE INDEX IF NOT EXISTS idx_breeding_cache_lookup
  ON ai_breeding_cache(sire_id, dam_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE ai_breeding_cache ENABLE ROW LEVEL SECURITY;

-- Service role (Edge Function) reads/writes freely.
CREATE POLICY "Service role full access on ai_breeding_cache"
  ON ai_breeding_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read cached advice (read-only).
CREATE POLICY "Authenticated users read ai_breeding_cache"
  ON ai_breeding_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- ── Auto-expiry cleanup ─────────────────────────────────────────────────
-- Remove expired cache entries daily via pg_cron (if available).
-- Fallback: the Edge Function checks expires_at before returning cached data.
