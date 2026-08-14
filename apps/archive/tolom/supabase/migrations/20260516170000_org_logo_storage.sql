-- Storage bucket for organization logos
-- Each org's logo is stored at: org-logos/{org_id}/logo

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-logos',
  'org-logos',
  true,
  5 * 1024 * 1024, -- 5MB limit
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Allow authenticated users to read any org logo (public bucket)
create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'org-logos');

-- Allow org members to upload their own org's logo
create policy "Org members can upload logos"
  on storage.objects for insert
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = (
      select organization_id::text
      from public.organization_users
      where user_id = auth.uid()
      limit 1
    )
  );

-- Allow org members to update their own org's logo
create policy "Org members can update logos"
  on storage.objects for update
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = (
      select organization_id::text
      from public.organization_users
      where user_id = auth.uid()
      limit 1
    )
  );

-- Allow org members to delete their own org's logo
create policy "Org members can delete logos"
  on storage.objects for delete
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = (
      select organization_id::text
      from public.organization_users
      where user_id = auth.uid()
      limit 1
    )
  );
