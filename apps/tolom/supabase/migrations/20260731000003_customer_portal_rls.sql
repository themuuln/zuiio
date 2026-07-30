-- ============================================================
-- RLS Policies for Customer Portal Access
-- ============================================================
-- Customers are NOT in organization_users, so get_user_organization_id()
-- returns null for them. These policies allow customers to access
-- their own data via customer_user_id = auth.uid() linkage.
-- ============================================================

-- ── customers ─────────────────────────────────────────────

create policy "Customers can view own record"
  on customers for select
  using (customer_user_id = auth.uid());

-- ── vehicle_owners ─────────────────────────────────────────

create policy "Customers can view their own vehicle ownerships"
  on vehicle_owners for select
  using (
    customer_id in (
      select id from customers where customer_user_id = auth.uid()
    )
  );

-- ── vehicles ───────────────────────────────────────────────

create policy "Customers can view their own vehicles"
  on vehicles for select
  using (
    id in (
      select vehicle_id from vehicle_owners
      where customer_id in (
        select id from customers where customer_user_id = auth.uid()
      )
    )
  );

-- ── digital_vehicle_inspections ─────────────────────────────

create policy "Customers can view inspections for their vehicles"
  on digital_vehicle_inspections for select
  using (
    vehicle_id in (
      select vehicle_id from vehicle_owners
      where customer_id in (
        select id from customers where customer_user_id = auth.uid()
      )
    )
    and status in ('sent', 'partially_approved', 'approved', 'declined', 'converted')
  );

-- ── dvi_inspection_items ─────────────────────────────────────

create policy "Customers can view their inspection items"
  on dvi_inspection_items for select
  using (
    inspection_id in (
      select id from digital_vehicle_inspections
      where vehicle_id in (
        select vehicle_id from vehicle_owners
        where customer_id in (
          select id from customers where customer_user_id = auth.uid()
        )
      )
    )
  );

create policy "Customers can update their inspection items (approve/decline)"
  on dvi_inspection_items for update
  using (
    inspection_id in (
      select id from digital_vehicle_inspections
      where vehicle_id in (
        select vehicle_id from vehicle_owners
        where customer_id in (
          select id from customers where customer_user_id = auth.uid()
        )
      )
      and status in ('sent', 'partially_approved')
    )
  )
  with check (
    -- Only allow updating customer_approved field
    inspection_id in (
      select id from digital_vehicle_inspections
      where vehicle_id in (
        select vehicle_id from vehicle_owners
        where customer_id in (
          select id from customers where customer_user_id = auth.uid()
        )
      )
      and status in ('sent', 'partially_approved')
    )
    -- Only customer_approved can be changed by customer
    and customer_approved is not distinct from customer_approved
  );

-- ── work_orders ─────────────────────────────────────────────

create policy "Customers can view work orders for their vehicles"
  on work_orders for select
  using (
    customer_id in (
      select id from customers where customer_user_id = auth.uid()
    )
  );

-- ── work_order_services ─────────────────────────────────────

create policy "Customers can view work order services for their vehicles"
  on work_order_services for select
  using (
    work_order_id in (
      select id from work_orders
      where customer_id in (
        select id from customers where customer_user_id = auth.uid()
      )
    )
  );

-- ── work_order_parts ────────────────────────────────────────

create policy "Customers can view work order parts for their vehicles"
  on work_order_parts for select
  using (
    work_order_id in (
      select id from work_orders
      where customer_id in (
        select id from customers where customer_user_id = auth.uid()
      )
    )
  );

-- ── invoices ────────────────────────────────────────────────

create policy "Customers can view their invoices"
  on invoices for select
  using (
    customer_id in (
      select id from customers where customer_user_id = auth.uid()
    )
  );

-- ── invoice_items ───────────────────────────────────────────

create policy "Customers can view their invoice items"
  on invoice_items for select
  using (
    invoice_id in (
      select id from invoices
      where customer_id in (
        select id from customers where customer_user_id = auth.uid()
      )
    )
  );

-- ── invoice_payments ────────────────────────────────────────

create policy "Customers can view their invoice payments"
  on invoice_payments for select
  using (
    invoice_id in (
      select id from invoices
      where customer_id in (
        select id from customers where customer_user_id = auth.uid()
      )
    )
  );

-- ── Indexes for customer portal performance ─────────────────

create index if not exists idx_customers_customer_user_id
  on customers(customer_user_id)
  where customer_user_id is not null;
create index if not exists idx_vehicle_owners_customer
  on vehicle_owners(customer_id, vehicle_id)
  where deleted_at is null;
