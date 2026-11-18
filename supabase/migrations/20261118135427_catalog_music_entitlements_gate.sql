-- =====================================================================
-- Catalogue: categories, per-template price and bullets, preview media, music
-- =====================================================================
create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  emoji text not null default '',
  blurb text not null default '',
  sort int not null default 0,
  is_active boolean not null default true
);

alter table public.templates
  add column category_slug text references public.categories (slug),
  add column price integer not null default 699 check (price between 1 and 100000),
  add column bullets jsonb not null default '[]'::jsonb
    check (jsonb_typeof(bullets) = 'array' and jsonb_array_length(bullets) <= 5);
create index templates_category_slug_idx on public.templates (category_slug);

create table public.template_media (
  id uuid primary key default gen_random_uuid(),
  template_slug text not null references public.templates (slug) on delete cascade,
  kind text not null check (kind in ('video', 'still', 'poster')),
  storage_path text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index template_media_template_idx on public.template_media (template_slug, sort);

-- Every active track must say where it came from, so you can always prove it.
create table public.music_tracks (
  id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  title text not null,
  vibe text not null default '',
  category_slugs text[] not null default '{}',
  storage_path text not null,
  duration_s int check (duration_s is null or duration_s between 1 and 600),
  source text not null check (source in ('original', 'pixabay', 'flow-music', 'owned', 'other')),
  license_url text not null default '',
  license_note text not null default '',
  is_active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  constraint music_license_documented
    check (not is_active or license_url <> '' or license_note <> '')
);

-- =====================================================================
-- Purchases: one entitlement = one paid invitation
-- =====================================================================
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  template_slug text not null references public.templates (slug),
  order_id text not null unique,
  tg_user_id bigint not null,
  music_track_id text references public.music_tracks (id),
  owner_id uuid references auth.users (id) on delete set null,
  claimed_at timestamptz,
  consumed_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create index entitlements_owner_idx on public.entitlements (owner_id);
create index entitlements_tg_user_idx on public.entitlements (tg_user_id);
create index entitlements_template_idx on public.entitlements (template_slug);
create index entitlements_music_idx on public.entitlements (music_track_id);

alter table public.invitations
  add column entitlement_id uuid unique references public.entitlements (id) on delete set null;

-- Only the hash of a claim link is stored; the link itself is sent once by the bot.
create table public.claim_tokens (
  token_hash text primary key,
  entitlement_id uuid not null references public.entitlements (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);
create index claim_tokens_entitlement_idx on public.claim_tokens (entitlement_id);

-- Short-lived, per-person tokens for the locked live demo.
create table public.preview_tokens (
  token_hash text primary key,
  template_slug text not null references public.templates (slug) on delete cascade,
  tg_user_id bigint not null,
  tg_name text not null default '' check (char_length(tg_name) <= 60),
  expires_at timestamptz not null,
  max_views int not null default 5,
  views int not null default 0,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);
create index preview_tokens_template_idx on public.preview_tokens (template_slug);
create index preview_tokens_user_idx on public.preview_tokens (tg_user_id, created_at);

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Functions
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Creating an invitation spends one paid credit for that template. Deleting the
-- invitation later does not give the credit back.
create or replace function public.require_entitlement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  e uuid;
begin
  if public.is_admin() then
    return new;
  end if;

  select en.id into e
  from public.entitlements en
  where en.owner_id = new.owner_id
    and en.template_slug = new.template_slug
    and not en.revoked
    and en.consumed_at is null
  order by en.created_at
  limit 1
  for update of en skip locked;

  if e is null then
    raise exception 'Buy this template first, then claim it from the Telegram bot'
      using errcode = 'P0001';
  end if;

  update public.entitlements set consumed_at = now() where id = e;
  new.entitlement_id := e;
  return new;
end;
$$;
revoke execute on function public.require_entitlement() from public, anon, authenticated;

create trigger invitations_gate
  before insert on public.invitations
  for each row execute function public.require_entitlement();

-- Attach a purchase to the signed-in account. The same link works again for the
-- same account, never for a different one.
create or replace function public.claim_entitlement(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  h text;
  ct public.claim_tokens%rowtype;
  en public.entitlements%rowtype;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if p_token is null or char_length(p_token) not between 20 and 128 then
    raise exception 'Invalid link' using errcode = '22023';
  end if;

  h := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  select * into ct from public.claim_tokens where token_hash = h for update;
  if not found or ct.expires_at < now() then
    raise exception 'This link has expired. Ask the bot for a new one' using errcode = 'P0002';
  end if;

  select * into en from public.entitlements where id = ct.entitlement_id for update;
  if en.revoked then
    raise exception 'This purchase is no longer active' using errcode = 'P0001';
  end if;
  if en.owner_id is not null and en.owner_id <> uid then
    raise exception 'This link was already used by another account' using errcode = 'P0001';
  end if;

  update public.entitlements
    set owner_id = uid, claimed_at = coalesce(claimed_at, now())
    where id = en.id;
  update public.claim_tokens set used_at = coalesce(used_at, now()) where token_hash = h;

  return jsonb_build_object(
    'entitlement_id', en.id,
    'template_slug', en.template_slug,
    'music_track_id', en.music_track_id
  );
end;
$$;
revoke execute on function public.claim_entitlement(text) from public, anon;
grant execute on function public.claim_entitlement(text) to authenticated;

-- Opens a locked demo: counts the view and returns only what the page needs.
create or replace function public.consume_preview_token(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  h text;
  r record;
begin
  if p_token is null or char_length(p_token) not between 20 and 128 then
    return null;
  end if;
  h := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');

  update public.preview_tokens
    set views = views + 1, last_seen_at = now()
    where token_hash = h and expires_at > now() and views < max_views
    returning template_slug, tg_name, expires_at into r;

  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'template_slug', r.template_slug,
    'tg_name', r.tg_name,
    'expires_at', r.expires_at
  );
end;
$$;
revoke execute on function public.consume_preview_token(text) from public;
grant execute on function public.consume_preview_token(text) to anon, authenticated;

-- =====================================================================
-- Row level security and privileges
-- =====================================================================
alter table public.categories enable row level security;
alter table public.template_media enable row level security;
alter table public.music_tracks enable row level security;
alter table public.entitlements enable row level security;
alter table public.claim_tokens enable row level security;
alter table public.preview_tokens enable row level security;
alter table public.admins enable row level security;

revoke all on public.categories, public.template_media, public.music_tracks,
  public.entitlements, public.claim_tokens, public.preview_tokens, public.admins
  from anon, authenticated;

grant select on public.categories, public.template_media, public.music_tracks to anon, authenticated;
grant select on public.entitlements to authenticated;

create policy "categories are public" on public.categories
  for select to anon, authenticated using (is_active);
create policy "preview media is public" on public.template_media
  for select to anon, authenticated using (true);
create policy "active music is public" on public.music_tracks
  for select to anon, authenticated using (is_active);
create policy "owner reads own entitlements" on public.entitlements
  for select to authenticated using (owner_id = (select auth.uid()));

-- =====================================================================
-- Storage: public-read buckets, writable only by admins
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('previews', 'previews', true, 52428800, array['video/mp4', 'image/webp', 'image/jpeg', 'image/png']),
  ('music', 'music', true, 15728640, array['audio/mpeg', 'audio/mp4'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "admins upload catalogue files" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('previews', 'music') and (select public.is_admin()));
create policy "admins update catalogue files" on storage.objects
  for update to authenticated
  using (bucket_id in ('previews', 'music') and (select public.is_admin()))
  with check (bucket_id in ('previews', 'music') and (select public.is_admin()));
create policy "admins delete catalogue files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('previews', 'music') and (select public.is_admin()));

-- =====================================================================
-- Seed: three launch categories and per-template details (price is editable in admin)
-- =====================================================================
insert into public.categories (slug, name, emoji, blurb, sort) values
  ('royal-palace', 'Royal and Palace', '👑', 'Grand gates, mandaps and palace evenings', 1),
  ('floral-pastel', 'Floral and Pastel', '🌸', 'Soft florals, blush and gold', 2),
  ('papercut-art', 'Papercut Art', '✂️', 'Layered paper lotus designs', 3);

update public.templates set category_slug = 'royal-palace', price = 699,
  bullets = '["Double doors open on touch", "Dusk mandap video background", "Up to 6 ceremonies with map links"]'::jsonb
  where slug = 'royale';
update public.templates set category_slug = 'floral-pastel', price = 699,
  bullets = '["Blush pink and brushed gold arches", "Evening palace video background", "RSVP form built in"]'::jsonb
  where slug = 'noor';
update public.templates set category_slug = 'floral-pastel', price = 699,
  bullets = '["Ornate floral doors", "Draggable rose-petal date reveal", "Hanging vine photo gallery"]'::jsonb
  where slug = 'rose-invitation';
update public.templates set category_slug = 'papercut-art', price = 699,
  bullets = '["Layered papercut lotus", "Rolling date dials", "String-pull photo gallery"]'::jsonb
  where slug = 'papercut-magenta';
update public.templates set category_slug = 'papercut-art', price = 699,
  bullets = '["Sage green and ivory paper cutouts", "Traditional Indian motifs", "Keepsake note from the couple"]'::jsonb
  where slug = 'papercut';
