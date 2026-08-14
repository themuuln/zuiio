-- Online Booking Request: Foundation migration
-- Adds booking_token to organizations, notification_email to org settings,
-- requested status to appointments, and a system auth user for public bookings.

-- 1. booking_token on organizations (follows portal_token pattern)
alter table organizations
  add column if not exists booking_token uuid default gen_random_uuid();

create unique index if not exists idx_organizations_booking_token
  on organizations(booking_token)
  where booking_token is not null and deleted_at is null;

-- Populate tokens for existing orgs
update organizations
  set booking_token = gen_random_uuid()
  where booking_token is null and deleted_at is null;

-- 2. notification_email on organization_settings
alter table organization_settings
  add column if not exists notification_email text;

-- 3. Add 'requested' to appointments status check constraint
alter table appointments
  drop constraint if exists appointments_status_check;

alter table appointments
  add constraint appointments_status_check
  check (status in ('requested','scheduled','checked_in','in_progress','completed','cancelled','no_show'));

-- 4. Create system auth user for public booking requests
-- Used as created_by/updated_by on appointments created via public booking form
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, confirmation_sent_at, is_super_admin)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'booking@tolom.app',
  '',
  now(),
  '{"full_name":"TOLOM Booking System"}'::jsonb,
  now(),
  now(),
  '',
  now(),
  false
where not exists (
  select 1 from auth.users where id = '00000000-0000-0000-0000-000000000001'
);


