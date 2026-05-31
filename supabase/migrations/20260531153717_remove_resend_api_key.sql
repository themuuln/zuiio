-- Remove per-org resend_api_key — replaced by global round-robin via RESEND_API_KEYS env var

alter table public.organization_settings drop column if exists resend_api_key;
