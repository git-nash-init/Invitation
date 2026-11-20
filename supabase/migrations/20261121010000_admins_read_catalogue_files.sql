-- The storage API reads a row back after inserting it, and an upsert reads the existing one, so an admin who
-- may upload catalogue files also needs to be able to see them. Admins only; the buckets stay public for
-- download through their public URLs.
create policy "admins read catalogue files" on storage.objects
  for select to authenticated
  using (bucket_id in ('previews', 'music') and (select public.is_admin()));
