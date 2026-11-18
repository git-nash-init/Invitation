-- Public-read bucket for photos and music; writes only inside the owner's own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invite-media',
  'invite-media',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "owner lists own media" on storage.objects
  for select to authenticated
  using (bucket_id = 'invite-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "owner uploads own media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'invite-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "owner updates own media" on storage.objects
  for update to authenticated
  using (bucket_id = 'invite-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'invite-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "owner deletes own media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'invite-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Template catalogue
insert into public.templates (slug, name, tagline, category, highlights, cover_path, sort) values
  ('royale', 'The Royale Gate',
   'Maroon and gold double doors swing open on touch, revealing a dusk mandap, the sacred invocation and arched ceremony cards.',
   'Royal palace', '6 ceremonies, mandap video', '/templates/royale/media/mandap_dusk.webp', 1),
  ('papercut-magenta', 'The Magenta Lotus',
   'Layered papercut with a rolling date reveal and a string-pull polaroid gallery.',
   'Artisan papercut', 'Rolling dials, string pull', '/templates/papercut-magenta/media/big_lotus.webp', 2),
  ('rose-invitation', 'The Rose Pavilion',
   'Ornate floral doors, a draggable rose-petal date reveal and a hanging vine gallery.',
   'Floral', 'Draggable petals, vine deck', '/templates/rose-invitation/media/1-bg.webp', 3),
  ('noor', 'The Noor Solarium',
   'Blush pink and brushed gold arches over an evening palace video, with an RSVP form.',
   'Blush and gold', 'Gilded arches, RSVP form', '/templates/noor/media/mandap_dusk.webp', 4),
  ('papercut', 'The Sage Lotus',
   'Sage green and ivory paper cutouts with traditional motifs and a keepsake note.',
   'Botanical sage', 'Sage and ivory, keepsake note', '/templates/papercut/media/big_lotus.webp', 5)
on conflict (slug) do nothing;
