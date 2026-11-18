-- =====================================================================
-- Admin panel: admins manage the catalogue directly (row level security),
-- and read the private bot data only through guarded functions.
-- =====================================================================

grant insert, update, delete on public.categories, public.template_media, public.music_tracks,
  public.message_templates to authenticated;
grant insert, update, delete on public.templates to authenticated;

create policy "admin manages categories" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin manages templates" on public.templates
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin manages template media" on public.template_media
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin manages music" on public.music_tracks
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin manages messages" on public.message_templates
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Admins can also read every entitlement (support, tracking).
create policy "admin reads entitlements" on public.entitlements
  for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Guarded reads of the private bot schema
-- ---------------------------------------------------------------------
create or replace function public.admin_overview(p_period text default 'today')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  now_s bigint := extract(epoch from now())::bigint;
  day_s bigint := (floor((now_s + 19800) / 86400.0) * 86400 - 19800)::bigint;
  since bigint;
  until bigint := now_s + 60;
  last_cron jsonb;
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  since := case p_period
    when 'today' then day_s
    when 'yesterday' then day_s - 86400
    when '7d' then now_s - 7 * 86400
    when '30d' then now_s - 30 * 86400
    else 0
  end;
  if p_period = 'yesterday' then until := day_s; end if;

  select value into last_cron from bot.settings where key = 'last_cron';

  return jsonb_build_object(
    'period', p_period,
    'total', (select jsonb_build_object('count', count(*), 'paise', coalesce(sum(amount_paise), 0))
              from bot.orders where status = 'paid' and is_test = 0 and paid_at >= since and paid_at < until),
    'by_template', (select coalesce(jsonb_agg(x order by x.paise desc), '[]'::jsonb) from (
        select o.template_slug as slug, coalesce(t.name, o.template_slug) as name,
               count(*) as count, sum(o.amount_paise) as paise
        from bot.orders o left join public.templates t on t.slug = o.template_slug
        where o.status = 'paid' and o.is_test = 0 and o.paid_at >= since and o.paid_at < until
        group by o.template_slug, t.name) x),
    'by_source', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select source, count(*) as count, sum(amount_paise) as paise
        from bot.orders where status = 'paid' and is_test = 0 and paid_at >= since and paid_at < until
        group by source) x),
    'new_users', (select count(*) from bot.users where started_at >= since and started_at < until),
    'qrs', (select count(*) from bot.orders where is_test = 0 and created_at >= since and created_at < until),
    'in_review', (select count(*) from bot.orders where status = 'review'),
    'all_time', (select jsonb_build_object('count', count(*), 'paise', coalesce(sum(amount_paise), 0))
                 from bot.orders where status = 'paid' and is_test = 0),
    'invitations', (select jsonb_build_object(
        'total', count(*), 'published', count(*) filter (where status = 'published'),
        'views', coalesce(sum(view_count), 0)) from public.invitations),
    'replies', (select count(*) from public.rsvps),
    'last_cron', coalesce(last_cron, '0'::jsonb)
  );
end;
$$;

create or replace function public.admin_orders(p_status text default null, p_limit int default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select o.id, o.user_id, u.first_name, u.username, o.template_slug,
           coalesce(t.name, o.template_slug) as template_name, o.amount_paise, o.status,
           o.is_test, o.source, o.utr, o.created_at, o.paid_at
    from bot.orders o
    left join bot.users u on u.id = o.user_id
    left join public.templates t on t.slug = o.template_slug
    where p_status is null or o.status = p_status
    order by o.created_at desc
    limit least(greatest(p_limit, 1), 500)) x);
end;
$$;

create or replace function public.admin_users(p_limit int default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select u.id, u.first_name, u.username, u.started_at, u.blocked, u.bot_blocked, u.fake_count, u.click,
           (select count(*) from bot.orders o where o.user_id = u.id and o.status = 'paid' and o.is_test = 0) as purchases,
           (select coalesce(sum(o.amount_paise), 0) from bot.orders o where o.user_id = u.id and o.status = 'paid' and o.is_test = 0) as paise
    from bot.users u
    order by u.started_at desc
    limit least(greatest(p_limit, 1), 500)) x);
end;
$$;

create or replace function public.admin_upi_list()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  day_s bigint := (floor((extract(epoch from now())::bigint + 19800) / 86400.0) * 86400 - 19800)::bigint;
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return (select coalesce(jsonb_agg(x order by x.sort, x.id), '[]'::jsonb) from (
    select a.id, a.label, a.vpa, a.payee_name, a.active, a.daily_limit, a.sort,
           (select count(*) from bot.orders o where o.upi_id = a.id and o.status = 'paid' and o.is_test = 0 and o.paid_at >= day_s) as today_count
    from bot.upi_accounts a) x);
end;
$$;

create or replace function public.admin_upi_delete(p_id int)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if exists (select 1 from bot.orders where upi_id = p_id and status in ('pending', 'review')) then
    return jsonb_build_object('ok', false, 'error', 'This UPI ID has open orders. Turn it off instead.');
  end if;
  delete from bot.upi_accounts where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_preview_log(p_limit int default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select p.template_slug, p.tg_user_id, p.tg_name, p.views, p.max_views, p.created_at, p.last_seen_at, p.expires_at
    from public.preview_tokens p
    order by p.created_at desc
    limit least(greatest(p_limit, 1), 500)) x);
end;
$$;

create or replace function public.admin_setup_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  last_cron jsonb;
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  select value into last_cron from bot.settings where key = 'last_cron';
  return jsonb_build_object(
    'last_cron', coalesce(last_cron, '0'::jsonb),
    'server_now', extract(epoch from now())::bigint,
    'upi_active', (select count(*) from bot.upi_accounts where active = 1),
    'templates_live', (select count(*) from public.templates where is_active),
    'tracks_active', (select count(*) from public.music_tracks where is_active),
    'preview_media', (select count(*) from public.template_media),
    'in_review', (select count(*) from bot.orders where status = 'review')
  );
end;
$$;

revoke execute on function public.admin_overview(text) from public, anon;
revoke execute on function public.admin_orders(text, int) from public, anon;
revoke execute on function public.admin_users(int) from public, anon;
revoke execute on function public.admin_upi_list() from public, anon;
revoke execute on function public.admin_upi_delete(int) from public, anon;
revoke execute on function public.admin_preview_log(int) from public, anon;
revoke execute on function public.admin_setup_status() from public, anon;
grant execute on function public.admin_overview(text) to authenticated;
grant execute on function public.admin_orders(text, int) to authenticated;
grant execute on function public.admin_users(int) to authenticated;
grant execute on function public.admin_upi_list() to authenticated;
grant execute on function public.admin_upi_delete(int) to authenticated;
grant execute on function public.admin_preview_log(int) to authenticated;
grant execute on function public.admin_setup_status() to authenticated;
