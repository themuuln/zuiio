-- Fix: organization_users INSERT policy for first-time org creation
-- The original policy required organization_id = get_user_organization_id(),
-- but new users have no organization_id yet, creating a chicken-and-egg problem
-- during org creation. This policy allows users to insert themselves into any org.

drop policy if exists "Users can insert org memberships for their org" on public.organization_users;

create policy "Users can insert org memberships for their org"
  on public.organization_users for insert
  with check (
    -- User can add themself to any org (needed during org creation)
    (user_id = auth.uid())
    -- Or they are an existing member adding others to their own org
    or (organization_id = get_user_organization_id())
  );
