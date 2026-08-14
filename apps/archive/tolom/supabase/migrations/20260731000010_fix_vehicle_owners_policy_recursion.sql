-- ============================================================
-- Fix infinite recursion in vehicle_owners RLS policies
-- ============================================================
-- The customer-portal policies (vehicles → vehicle_owners → vehicles)
-- form a cycle: "Customers can view their own vehicles" queries
-- vehicle_owners, whose org policies re-query vehicles, which applies
-- the vehicles policies again → "infinite recursion detected in policy".
--
-- Fix: scope vehicle_owners org policies to its own organization_id
-- (the table has the column), removing the vehicles subquery and
-- breaking the cycle while preserving org scoping. Also drops the
-- legacy recursive vo_select/vo_insert/vo_delete policies that some
-- environments (prod) still carry from an earlier migration.
--
-- Guarded with to_regclass / to_regprocedure so this migration
-- safely no-ops if the table or helper function does not exist yet.
-- ============================================================

do $$
begin
  if to_regclass('public.vehicle_owners') is not null
     and to_regprocedure('get_user_organization_id()') is not null then
    execute 'drop policy if exists "Users can view vehicle_owners in their org" on public.vehicle_owners';
    execute 'create policy "Users can view vehicle_owners in their org"
      on public.vehicle_owners for select
      using (organization_id = get_user_organization_id())';

    execute 'drop policy if exists "Users can insert vehicle_owners in their org" on public.vehicle_owners';
    execute 'create policy "Users can insert vehicle_owners in their org"
      on public.vehicle_owners for insert
      with check (organization_id = get_user_organization_id())';

    execute 'drop policy if exists "Users can delete vehicle_owners in their org" on public.vehicle_owners';
    execute 'create policy "Users can delete vehicle_owners in their org"
      on public.vehicle_owners for delete
      using (organization_id = get_user_organization_id())';

    execute 'drop policy if exists "vo_select" on public.vehicle_owners';
    execute 'drop policy if exists "vo_insert" on public.vehicle_owners';
    execute 'drop policy if exists "vo_delete" on public.vehicle_owners';
  end if;
end $$;
