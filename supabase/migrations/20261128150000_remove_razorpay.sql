-- Razorpay is no longer used. Payments go through Cashfree only.
-- The orders columns razorpay_order_id and razorpay_payment_id keep their names (they now hold
-- Cashfree's order id and payment id); renaming them would break the functions that confirm payments.

drop function if exists public.attach_razorpay_order(uuid, text);

alter table public.orders alter column provider set default 'cashfree';

comment on column public.orders.razorpay_order_id is 'The payment gateway''s order id. For Cashfree this is our own order id.';
comment on column public.orders.razorpay_payment_id is 'The payment gateway''s payment id (Cashfree cf_payment_id).';
