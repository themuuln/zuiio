-- 00011: Add missing RLS policies for work_orders table
-- RLS was enabled in 00002 but no policies were defined — all operations blocked for anon/authenticated users.

drop policy if exists "Users can view work orders in their org" on work_orders;
create policy "Users can view work orders in their org"
  on work_orders for select
  using (
    organization_id in (
      select organization_id from organization_users
      where user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert work orders in their org" on work_orders;
create policy "Users can insert work orders in their org"
  on work_orders for insert
  with check (
    organization_id in (
      select organization_id from organization_users
      where user_id = auth.uid()
    )
  );

drop policy if exists "Users can update work orders in their org" on work_orders;
create policy "Users can update work orders in their org"
  on work_orders for update
  using (
    organization_id in (
      select organization_id from organization_users
      where user_id = auth.uid()
    )
  );

drop policy if exists "Users can soft-delete work orders in their org" on work_orders;
create policy "Users can soft-delete work orders in their org"
  on work_orders for delete
  using (
    organization_id in (
      select organization_id from organization_users
      where user_id = auth.uid()
    )
  );
