-- Add image_url column to parts_catalog
alter table parts_catalog
  add column if not exists image_url text;

-- Storage bucket for part photos
-- Path pattern: part-photos/{org_id}/{part_id}/{filename}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'part-photos',
  'part-photos',
  true,
  5 * 1024 * 1024, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Public read: anyone can view part photos
create policy "Public read access for part photos"
  on storage.objects for select
  using (bucket_id = 'part-photos');

-- Org members can upload part photos for their org
create policy "Org members can upload part photos"
  on storage.objects for insert
  with check (
    bucket_id = 'part-photos'
    and (storage.foldername(name))[1] = (
      select organization_id::text
      from public.organization_users
      where user_id = auth.uid()
      limit 1
    )
  );

-- Org members can update their org's part photos
create policy "Org members can update part photos"
  on storage.objects for update
  using (
    bucket_id = 'part-photos'
    and (storage.foldername(name))[1] = (
      select organization_id::text
      from public.organization_users
      where user_id = auth.uid()
      limit 1
    )
  );

-- Org members can delete their org's part photos
create policy "Org members can delete part photos"
  on storage.objects for delete
  using (
    bucket_id = 'part-photos'
    and (storage.foldername(name))[1] = (
      select organization_id::text
      from public.organization_users
      where user_id = auth.uid()
      limit 1
    )
  );
