-- Fix user_consents upsert: add matching unique constraint for onConflict target
-- Previous migration only created a plain index, causing 42P10 on every captureConsent upsert.

-- Deduplicate any existing duplicates (keep latest by created_at)
DELETE FROM public.user_consents
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY organization_id, channel, channel_user_id, COALESCE(page_id,''), consent_type
      ORDER BY created_at DESC
    ) AS rn
    FROM public.user_consents
  ) t WHERE rn > 1
);

-- Create unique index matching the upsert conflict target
CREATE UNIQUE INDEX IF NOT EXISTS user_consents_unique_org_channel_user_page_type
  ON public.user_consents(organization_id, channel, channel_user_id, page_id, consent_type);
