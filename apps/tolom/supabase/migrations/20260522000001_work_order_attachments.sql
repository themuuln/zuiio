-- Work order photo/document attachments
create table work_order_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  storage_path text not null,
  public_url text,
  file_type text not null default 'photo' check (file_type in ('photo', 'document', 'other')),
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Index for fast work order lookups
create index idx_wo_attachments_wo on work_order_attachments(work_order_id, deleted_at);

-- RLS
alter table work_order_attachments enable row level security;

create policy "Users can view attachments in their org"
  on work_order_attachments for select
  using (
    organization_id in (
      select organization_id from organization_users
      where user_id = auth.uid()
    )
  );

create policy "Users can insert attachments in their org"
  on work_order_attachments for insert
  with check (
    organization_id in (
      select organization_id from organization_users
      where user_id = auth.uid()
    )
  );

create policy "Users can soft-delete attachments in their org"
  on work_order_attachments for update
  using (
    organization_id in (
      select organization_id from organization_users
      where user_id = auth.uid()
    )
  );
