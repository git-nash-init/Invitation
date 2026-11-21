-- Music categories: the wedding styles a track can be filed under. Tracks keep
-- their list in music_tracks.category_slugs; "All" is not stored, the site shows
-- every active track when no category is chosen.

create table if not exists public.music_categories (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 1 and 60),
  sort integer not null default 0,
  is_active boolean not null default true
);

alter table public.music_categories enable row level security;
create policy "anyone reads live music categories" on public.music_categories
  for select using (is_active);
create policy "admin manages music categories" on public.music_categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.music_categories (slug, name, sort) values
  ('hindu-wedding', 'Hindu Wedding', 1),
  ('sikh-wedding', 'Sikh Wedding', 2),
  ('muslim-nikah', 'Muslim / Nikah', 3),
  ('christian-wedding', 'Christian Wedding', 4),
  ('jain-wedding', 'Jain Wedding', 5),
  ('parsi-wedding', 'Parsi Wedding', 6),
  ('buddhist-wedding', 'Buddhist Wedding', 7),
  ('bollywood-romantic', 'Bollywood Romantic', 8),
  ('punjabi-wedding', 'Punjabi Wedding', 9),
  ('traditional-instrumental', 'Traditional / Instrumental', 10)
on conflict (slug) do nothing;
