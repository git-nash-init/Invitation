-- =====================================================================
-- SutraLuxe core schema
-- =====================================================================

-- Helper: unguessable lowercase hex code of a given length
create or replace function public.random_code(len int)
returns text
language sql
volatile
set search_path = ''
as $$
  select substr(
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    1, len
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 80),
    left(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'), 500)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- templates (catalogue, read-only for clients)
-- ---------------------------------------------------------------------
create table public.templates (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  tagline text not null default '',
  category text not null default '',
  highlights text not null default '',
  cover_path text not null default '',
  sort int not null default 0,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------
-- invitations
-- ---------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_slug text not null references public.templates (slug),
  title text not null default 'Untitled invitation'
    check (char_length(title) between 1 and 120),
  slug text not null unique default public.random_code(10)
    check (slug ~ '^[a-z0-9][a-z0-9-]{3,59}$'),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  guest_mode text not null default 'common'
    check (guest_mode in ('common', 'personalised')),
  config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(config) = 'object' and pg_column_size(config) < 262144),
  published_at timestamptz,
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invitations_owner_id_idx on public.invitations (owner_id);
create index invitations_template_slug_idx on public.invitations (template_slug);

create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

create or replace function public.set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger invitations_set_published_at
  before insert or update of status on public.invitations
  for each row execute function public.set_published_at();

-- Cap how many invitations one account can create.
create or replace function public.enforce_invitation_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.invitations where owner_id = new.owner_id) >= 50 then
    raise exception 'Invitation limit reached (50 per account)' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger invitations_limit
  before insert on public.invitations
  for each row execute function public.enforce_invitation_limit();

-- ---------------------------------------------------------------------
-- guests (personalised links)
-- ---------------------------------------------------------------------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  code text not null unique default public.random_code(12),
  first_viewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index guests_invitation_id_idx on public.guests (invitation_id);

create or replace function public.enforce_guest_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.guests where invitation_id = new.invitation_id) >= 500 then
    raise exception 'Guest limit reached (500 per invitation)' using errcode = 'P0001';
  end if;
  new.name = btrim(new.name);
  return new;
end;
$$;

create trigger guests_limit
  before insert on public.guests
  for each row execute function public.enforce_guest_limit();

-- ---------------------------------------------------------------------
-- rsvps (written only through submit_rsvp)
-- ---------------------------------------------------------------------
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  guest_id uuid references public.guests (id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  attending boolean not null,
  headcount int not null default 1 check (headcount between 0 and 20),
  message text check (message is null or char_length(message) <= 500),
  created_at timestamptz not null default now()
);

create index rsvps_invitation_id_idx on public.rsvps (invitation_id);
create index rsvps_guest_id_idx on public.rsvps (guest_id);

-- ---------------------------------------------------------------------
-- Public RPCs (the only way anonymous visitors touch data)
-- ---------------------------------------------------------------------
create or replace function public.open_invitation(p_slug text, p_code text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  inv public.invitations%rowtype;
  g public.guests%rowtype;
begin
  select * into inv
  from public.invitations
  where slug = p_slug and status = 'published';

  if not found then
    return null;
  end if;

  if inv.guest_mode = 'personalised' and p_code is not null and char_length(p_code) <= 40 then
    select * into g
    from public.guests
    where code = p_code and invitation_id = inv.id;

    if found and g.first_viewed_at is null then
      update public.guests set first_viewed_at = now() where id = g.id;
    end if;
  end if;

  update public.invitations set view_count = view_count + 1 where id = inv.id;

  return jsonb_build_object(
    'id', inv.id,
    'slug', inv.slug,
    'title', inv.title,
    'template_slug', inv.template_slug,
    'guest_mode', inv.guest_mode,
    'config', inv.config,
    'guest_name', case when g.id is not null then g.name else null end
  );
end;
$$;

-- Trigger functions and internal helpers must not be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.set_published_at() from public, anon, authenticated;
revoke execute on function public.enforce_invitation_limit() from public, anon, authenticated;
revoke execute on function public.enforce_guest_limit() from public, anon, authenticated;
revoke execute on function public.random_code(int) from public, anon, authenticated;

revoke execute on function public.open_invitation(text, text) from public;
grant execute on function public.open_invitation(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.invitations enable row level security;
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;

-- Start from zero privileges, then grant exactly what the app needs.
revoke all on public.profiles, public.templates, public.invitations, public.guests, public.rsvps
  from anon, authenticated;

grant select on public.templates to anon, authenticated;
grant select, update (display_name, avatar_url) on public.profiles to authenticated;
grant select, delete on public.invitations to authenticated;
grant insert (template_slug, title, slug, guest_mode, config, status) on public.invitations to authenticated;
grant update (title, slug, status, guest_mode, config) on public.invitations to authenticated;
grant select, delete on public.guests to authenticated;
grant insert (invitation_id, name) on public.guests to authenticated;
grant update (name) on public.guests to authenticated;
grant select, delete on public.rsvps to authenticated;

create policy "templates are public" on public.templates
  for select to anon, authenticated using (is_active);

create policy "own profile read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "own profile update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "owner reads invitations" on public.invitations
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "owner creates invitations" on public.invitations
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owner updates invitations" on public.invitations
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owner deletes invitations" on public.invitations
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "owner reads guests" on public.guests
  for select to authenticated using (
    invitation_id in (select id from public.invitations where owner_id = (select auth.uid()))
  );
create policy "owner creates guests" on public.guests
  for insert to authenticated with check (
    invitation_id in (select id from public.invitations where owner_id = (select auth.uid()))
  );
create policy "owner updates guests" on public.guests
  for update to authenticated
  using (invitation_id in (select id from public.invitations where owner_id = (select auth.uid())))
  with check (invitation_id in (select id from public.invitations where owner_id = (select auth.uid())));
create policy "owner deletes guests" on public.guests
  for delete to authenticated using (
    invitation_id in (select id from public.invitations where owner_id = (select auth.uid()))
  );

create policy "owner reads rsvps" on public.rsvps
  for select to authenticated using (
    invitation_id in (select id from public.invitations where owner_id = (select auth.uid()))
  );
create policy "owner deletes rsvps" on public.rsvps
  for delete to authenticated using (
    invitation_id in (select id from public.invitations where owner_id = (select auth.uid()))
  );
