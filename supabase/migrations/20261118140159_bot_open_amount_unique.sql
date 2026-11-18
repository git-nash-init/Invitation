-- No two open orders of the same UPI ID may carry the same exact-paise amount.
-- A screenshot's amount must match exactly one order; this enforces it even when
-- two buyers press Buy in the same instant. The bot retries with a new amount.
create unique index orders_open_amount
  on bot.orders (upi_id, amount_paise)
  where status in ('pending', 'review');
