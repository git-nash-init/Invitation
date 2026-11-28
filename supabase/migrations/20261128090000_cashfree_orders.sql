-- Cashfree as a second payment provider.
-- The gateway's order id and payment id keep living in razorpay_order_id / razorpay_payment_id
-- (renaming them would break the admin reports); `provider` says whose ids they are.

alter table public.orders
  add column if not exists provider text not null default 'razorpay'
  check (provider in ('razorpay', 'cashfree'));

comment on column public.orders.razorpay_order_id is 'Order id at the payment provider named in "provider".';
comment on column public.orders.razorpay_payment_id is 'Payment id at the payment provider named in "provider".';

-- Remember that our order was opened at Cashfree (set once). We give Cashfree our own order id,
-- so the two always match.
create or replace function public.attach_cashfree_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.orders
  set razorpay_order_id = p_order_id::text, provider = 'cashfree'
  where id = p_order_id and owner_id = auth.uid() and status = 'created' and razorpay_order_id is null;
  if not found then
    raise exception 'Order cannot be updated' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.attach_cashfree_order(uuid) from public, anon;
grant execute on function public.attach_cashfree_order(uuid) to authenticated;
