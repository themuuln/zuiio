-- ============================================================
-- 00007: Extend product_catalog for data-driven SSO onboarding
-- ============================================================

-- Integration type: how the product connects to Zuiio ID
do $$ begin
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_catalog'
    and column_name = 'integration_type')
  then
    alter table public.product_catalog
      add column integration_type text not null default 'supabase_federation'
      check (integration_type in ('supabase_federation', 'direct_oidc'));
  end if;
end $$;

-- Consent policy: how the consent screen behaves for this product
do $$ begin
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_catalog'
    and column_name = 'consent_policy')
  then
    alter table public.product_catalog
      add column consent_policy text not null default 'explicit'
      check (consent_policy in ('explicit', 'trusted_first_party'));
  end if;
end $$;

-- Allowed scopes: subset of scopes this product may request
do $$ begin
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_catalog'
    and column_name = 'allowed_scopes')
  then
    alter table public.product_catalog
      add column allowed_scopes text[] not null default '{openid,profile,email}';
  end if;
end $$;

-- SCIM token: static bearer token for SCIM v2 provisioning
-- (already added in 00001, but adding index if missing)
create index if not exists idx_product_catalog_client_id
  on public.product_catalog (client_id)
  where client_id is not null;
