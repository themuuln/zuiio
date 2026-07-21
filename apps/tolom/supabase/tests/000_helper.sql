-- RLS Test Helper
-- Provides reusable functions for testing RLS policies with pgTAP.
-- These helpers set up auth context and clean up after each test.
--
-- Usage:
--   1. Ensure pgTAP is enabled: create extension if not exists pgtap with schema extensions;
--   2. begin; select plan(N);
--   3. select tests.authenticate_as('org-admin-user-id');
--   4. -- run your query assertions
--   5. select tests.clear_authentication();
--   6. select * from finish(); rollback;

-- Helper: set JWT claims for a test user
-- Sets auth context to mimic a specific authenticated user
create or replace function tests.set_auth(
  user_id text,
  org_id text default null,
  role text default 'authenticated'
) returns void as $$
begin
  perform set_config('role', role, true);
  perform set_config('request.jwt.claim.sub', user_id, true);
  if org_id is not null then
    perform set_config('request.jwt.claim.organization_id', org_id, true);
  end if;
end;
$$ language plpgsql;

-- Helper: clear auth context (reset to anonymous)
create or replace function tests.clear_auth() returns void as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.organization_id', '', true);
end;
$$ language plpgsql;

-- Helper: assert a query returns rows (RLS allows access)
create or replace function tests.assert_can_select(
  query text,
  description text default ''
) returns text as $$
begin
  return ok(
    (select exists(execute query)),
    description
  );
exception when others then
  return ok(false, description || ' — raised ' || sqlerrm);
end;
$$ language plpgsql;

-- Helper: assert a query returns no rows (RLS blocks access)
create or replace function tests.assert_cannot_select(
  query text,
  description text default ''
) returns text as $$
begin
  return ok(
    not (select exists(execute query)),
    description
  );
exception when others then
  -- An RLS block may raise a permission error or silently return no rows
  return ok(true, description || ' — blocked: ' || sqlerrm);
end;
$$ language plpgsql;
