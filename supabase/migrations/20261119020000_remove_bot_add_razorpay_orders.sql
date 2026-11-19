-- Remove the Telegram bot completely and add Razorpay "pay to publish".
-- Drafts are free. Publishing needs one paid order for that invitation.

-- ---------------------------------------------------------------------------
-- 1. Bot removal (all of these tables held no real data)
-- ---------------------------------------------------------------------------
select cron.unschedule(jobid) from cron.job where jobname = 'bot-tick';
delete from vault.secrets where name = 'bot_worker_secret';

drop trigger if exists invitations_gate on public.invitations;
drop function if exists public.require_entitlement();
drop function if exists public.claim_entitlement(text);
drop function if exists public.consume_preview_token(text);
drop function if exists public.admin_preview_log(integer);
drop function if exists public.admin_setup_status();
drop function if exists public.admin_setup_token();
drop function if exists public.admin_upi_delete(integer);
drop function if exists public.admin_upi_list();
drop function if exists public.admin_upi_save(integer, text, text, text, boolean, integer);
drop function if exists public.admin_orders(text, integer);
drop function if exists public.admin_overview(text);
drop function if exists public.admin_users(integer);

alter table public.invitations drop column if exists entitlement_id;
drop table if exists public.claim_tokens;
drop table if exists public.preview_tokens;
drop table if exists public.entitlements;
drop schema if exists bot cascade;

-- ---------------------------------------------------------------------------
-- 2. Prices: an optional list price is shown struck through at checkout
-- ---------------------------------------------------------------------------
alter table public.templates add column if not exists list_price integer check (list_price is null or list_price > 0);

-- ---------------------------------------------------------------------------
-- 3. Orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  invitation_id uuid references public.invitations (id) on delete set null,
  template_slug text not null,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'refunded')),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  method text,
  failure_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);
create index orders_owner_idx on public.orders (owner_id, created_at desc);
create index orders_invitation_idx on public.orders (invitation_id);
create index orders_status_idx on public.orders (status, created_at desc);

alter table public.orders enable row level security;
create policy "owner reads own orders" on public.orders for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "admin reads orders" on public.orders for select to authenticated
  using ((select public.is_admin()));
-- No insert, update or delete policies: every write goes through the functions below.

create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Publishing needs a paid order
-- ---------------------------------------------------------------------------
create or replace function public.require_paid_to_publish() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if public.is_admin() then
      return new;
    end if;
    if not exists (
      select 1 from public.orders o
      where o.invitation_id = new.id and o.status = 'paid'
    ) then
      raise exception 'Payment is required to publish this invitation' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger invitations_publish_gate before insert or update of status on public.invitations
  for each row execute function public.require_paid_to_publish();

-- ---------------------------------------------------------------------------
-- 5. Checkout functions (the signed-in owner)
-- ---------------------------------------------------------------------------
-- Step 1: the price is read from the templates table here, never taken from the browser.
create or replace function public.create_order(p_invitation_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  inv record;
  rupees integer;
  o public.orders;
begin
  if auth.uid() is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;

  select i.id, i.template_slug into inv
  from public.invitations i
  where i.id = p_invitation_id and i.owner_id = auth.uid();
  if not found then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.orders where invitation_id = inv.id and status = 'paid') then
    return jsonb_build_object('already_paid', true);
  end if;

  select t.price into rupees from public.templates t where t.slug = inv.template_slug and t.is_active;
  if rupees is null or rupees <= 0 then
    raise exception 'This design is not available' using errcode = 'P0002';
  end if;

  update public.orders set status = 'failed', failure_reason = 'replaced by a newer checkout'
  where invitation_id = inv.id and status = 'created';

  insert into public.orders (owner_id, invitation_id, template_slug, amount_paise)
  values (auth.uid(), inv.id, inv.template_slug, rupees * 100)
  returning * into o;

  return jsonb_build_object('order_id', o.id, 'amount_paise', o.amount_paise, 'currency', o.currency);
end;
$$;

-- Step 2: remember which Razorpay order belongs to ours (set once).
create or replace function public.attach_razorpay_order(p_order_id uuid, p_razorpay_order_id text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_razorpay_order_id !~ '^order_[A-Za-z0-9]{8,40}$' then
    raise exception 'Bad order id' using errcode = '22023';
  end if;
  update public.orders
  set razorpay_order_id = p_razorpay_order_id
  where id = p_order_id and owner_id = auth.uid() and status = 'created' and razorpay_order_id is null;
  if not found then
    raise exception 'Order cannot be updated' using errcode = 'P0001';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Payment confirmation. Called only by the website's server, after it has checked
--    the Razorpay signature and the payment with Razorpay itself. The shared secret
--    lives in Vault and in the server's environment, nowhere else.
-- ---------------------------------------------------------------------------
create or replace function public.payment_bridge_ok(p_secret text) returns boolean
language plpgsql security definer set search_path = '' stable as $$
declare s text;
begin
  select decrypted_secret into s from vault.decrypted_secrets where name = 'payment_bridge_secret';
  return s is not null and length(s) >= 32 and p_secret is not distinct from s;
end;
$$;

create or replace function public.service_confirm_payment(
  p_secret text, p_order_id uuid, p_razorpay_order_id text, p_payment_id text,
  p_amount_paise integer, p_method text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  if not public.payment_bridge_ok(p_secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  if o.razorpay_order_id is distinct from p_razorpay_order_id then
    raise exception 'order mismatch' using errcode = 'P0001';
  end if;
  if o.amount_paise <> p_amount_paise then
    raise exception 'amount mismatch' using errcode = 'P0001';
  end if;
  if o.status = 'paid' then
    return jsonb_build_object('status', 'paid', 'already', true);
  end if;
  if o.status = 'refunded' then
    return jsonb_build_object('status', 'refunded');
  end if;
  update public.orders
  set status = 'paid', razorpay_payment_id = p_payment_id, method = p_method,
      paid_at = now(), failure_reason = null
  where id = o.id;
  return jsonb_build_object('status', 'paid');
end;
$$;

create or replace function public.service_mark_failed(p_secret text, p_order_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.payment_bridge_ok(p_secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.orders set status = 'failed', failure_reason = left(coalesce(p_reason, 'payment failed'), 300)
  where id = p_order_id and status = 'created';
end;
$$;

create or replace function public.service_mark_refunded(p_secret text, p_payment_id text) returns void
language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  if not public.payment_bridge_ok(p_secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into o from public.orders where razorpay_payment_id = p_payment_id for update;
  if not found or o.status = 'refunded' then
    return;
  end if;
  update public.orders set status = 'refunded' where id = o.id;
  -- A refunded invitation goes back to a draft; the owner keeps their work.
  update public.invitations set status = 'draft' where id = o.invitation_id and status = 'published';
end;
$$;

revoke all on function public.payment_bridge_ok(text) from public, anon, authenticated;
grant execute on function public.service_confirm_payment(text, uuid, text, text, integer, text) to anon, authenticated;
grant execute on function public.service_mark_failed(text, uuid, text) to anon, authenticated;
grant execute on function public.service_mark_refunded(text, text) to anon, authenticated;
revoke execute on function public.create_order(uuid) from public, anon;
revoke execute on function public.attach_razorpay_order(uuid, text) from public, anon;
grant execute on function public.create_order(uuid) to authenticated;
grant execute on function public.attach_razorpay_order(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Admin reports (the website's /admin pages call these; each checks is_admin())
-- ---------------------------------------------------------------------------
create or replace function public.admin_overview(p_period text default '30d') returns jsonb
language plpgsql security definer set search_path = '' stable as $$
declare
  since timestamptz;
  r jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  since := case p_period
    when 'today' then date_trunc('day', now())
    when '7d' then now() - interval '7 days'
    when 'all' then 'epoch'::timestamptz
    else now() - interval '30 days' end;

  select jsonb_build_object(
    'revenue_paise', coalesce(sum(amount_paise) filter (where status = 'paid' and paid_at >= since), 0),
    'paid', count(*) filter (where status = 'paid' and paid_at >= since),
    'pending', count(*) filter (where status = 'created' and created_at >= since),
    'failed', count(*) filter (where status = 'failed' and created_at >= since),
    'refunded', count(*) filter (where status = 'refunded' and created_at >= since)
  ) into r from public.orders;

  return r || jsonb_build_object(
    'users', (select count(*) from auth.users),
    'invitations', (select count(*) from public.invitations),
    'published', (select count(*) from public.invitations where status = 'published'),
    'by_template', coalesce((
      select jsonb_agg(x) from (
        select template_slug, count(*) as n, sum(amount_paise) as revenue_paise
        from public.orders where status = 'paid' and paid_at >= since
        group by 1 order by 3 desc) x), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(d order by d.day) from (
        select to_char(date_trunc('day', paid_at), 'YYYY-MM-DD') as day, count(*) as n, sum(amount_paise) as revenue_paise
        from public.orders where status = 'paid' and paid_at >= since
        group by 1) d), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_orders(p_status text default null, p_limit integer default 200) returns jsonb
language plpgsql security definer set search_path = '' stable as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(row_to_json(x)) from (
      select o.id, u.email, o.template_slug, o.amount_paise, o.status, o.method,
             o.razorpay_order_id, o.razorpay_payment_id, o.failure_reason,
             o.created_at, o.paid_at, o.invitation_id
      from public.orders o
      left join auth.users u on u.id = o.owner_id
      where p_status is null or p_status = '' or o.status = p_status
      order by o.created_at desc
      limit greatest(1, least(coalesce(p_limit, 200), 500))
    ) x), '[]'::jsonb);
end;
$$;

create or replace function public.admin_users(p_limit integer default 200) returns jsonb
language plpgsql security definer set search_path = '' stable as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(row_to_json(x)) from (
      select u.id, u.email, u.created_at, u.last_sign_in_at,
             (select count(*) from public.invitations i where i.owner_id = u.id) as invitations,
             (select count(*) from public.invitations i where i.owner_id = u.id and i.status = 'published') as published,
             coalesce((select sum(o.amount_paise) from public.orders o where o.owner_id = u.id and o.status = 'paid'), 0) as paid_paise
      from auth.users u
      order by u.created_at desc
      limit greatest(1, least(coalesce(p_limit, 200), 500))
    ) x), '[]'::jsonb);
end;
$$;

revoke execute on function public.admin_overview(text), public.admin_orders(text, integer), public.admin_users(integer) from public, anon;
grant execute on function public.admin_overview(text), public.admin_orders(text, integer), public.admin_users(integer) to authenticated;
