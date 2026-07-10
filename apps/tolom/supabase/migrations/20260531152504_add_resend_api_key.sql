-- Add resend_api_key to organization_settings for per-org email provider keys
-- This enables orgs to use their own Resend account instead of the global key

alter table public.organization_settings
  add column resend_api_key text;

comment on column public.organization_settings.resend_api_key is
  'Org-specific Resend API key. When set, email is sent from this account instead of the global RESEND_API_KEY env var. Stored as-is (encrypted at rest by Supabase).';

-- RLS: org members can read their OWN key (for masked display in UI),
-- but only the full key is needed server-side via service_role.
-- The existing policies already grant read/write to org members.
-- We rely on the API route to handle masking on response.

-- Enable pgcrypto for application-level encryption (optional — used by the API layer)
create extension if not exists "pgcrypto" with schema extensions;
