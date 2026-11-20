-- Premium members: publish any design, current or future, without paying per invitation.
-- Admins are always premium. A row here makes anyone else premium, optionally until a date.

create table if not exists public.premium_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'premium',
  note text,
  granted_at timestamptz not null default now(),
  expires_at timestamptz check (expires_at is null or expires_at > granted_at)
);

alter table public.premium_members enable row level security;
create policy "member reads own premium" on public.premium_members for select to authenticated
  using (user_id = (select auth.uid()));
create policy "admin reads premium" on public.premium_members for select to authenticated
  using ((select public.is_admin()));
-- No insert, update or delete policies: grants are made by the owner of the project (SQL / dashboard).

create or replace function public.is_premium() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1 from public.premium_members m
    where m.user_id = (select auth.uid()) and (m.expires_at is null or m.expires_at > now())
  );
$$;
revoke execute on function public.is_premium() from public, anon;
grant execute on function public.is_premium() to authenticated;

-- Publishing: premium members skip the paid-order check, for every template.
create or replace function public.require_paid_to_publish() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if public.is_premium() then
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

-- Checkout: a premium member is never asked to pay; the website then just publishes.
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

  if public.is_premium() then
    return jsonb_build_object('already_paid', true, 'premium', true);
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

-- Grant: try.avinasht@gmail.com, no end date.
insert into public.premium_members (user_id, plan, note)
select id, 'premium', 'Owner account: every design, current and future'
from auth.users where email = 'try.avinasht@gmail.com'
on conflict (user_id) do update set plan = excluded.plan, expires_at = null;
