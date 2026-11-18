-- Private schema for the Telegram bot. Never exposed through the API: only the
-- Edge Function reaches it, over a direct Postgres connection.
create schema if not exists bot;
revoke all on schema bot from public, anon, authenticated;

-- All timestamps are unix seconds, exactly as the original bot used them.
create table bot.settings (
  key text primary key,
  value jsonb not null
);

create table bot.users (
  id bigint primary key,
  first_name text not null default '',
  username text not null default '',
  click text not null default '',
  started_at bigint not null,
  blocked integer not null default 0,
  bot_blocked integer not null default 0,
  fake_count integer not null default 0,
  offer_paise integer not null default 0,
  offer_until bigint not null default 0,
  disc_pct integer not null default 0,
  disc_until bigint not null default 0,
  buyer_stage integer not null default 0,
  next_buyer_at bigint not null default 0
);
create index users_next_buyer on bot.users (next_buyer_at);
create index users_started on bot.users (started_at);

create table bot.upi_accounts (
  id integer generated always as identity primary key,
  label text not null default '',
  vpa text not null,
  payee_name text not null,
  active integer not null default 1,
  daily_limit integer not null default 0,
  sort integer not null default 0
);

create table bot.orders (
  id text primary key,
  user_id bigint not null,
  template_slug text not null,              -- 'test' for the admin's Rs 1 test
  amount_paise integer not null,
  upi_id integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'review', 'paid', 'rejected', 'revoked')),
  is_test integer not null default 0,
  source text not null default 'bot',
  utr text not null default '',
  music_track_id text,
  entitlement_id uuid,
  created_at bigint not null,
  paid_at bigint not null default 0,
  reminder_stage integer not null default 0,
  next_reminder_at bigint not null default 0
);
create index orders_user on bot.orders (user_id, status);
create index orders_paid on bot.orders (status, paid_at);
create index orders_reminder on bot.orders (next_reminder_at);
create index orders_open on bot.orders (upi_id, status, created_at);
create index orders_created on bot.orders (created_at);

-- A payment reference can only ever pay for one order (blocks reused screenshots).
create table bot.utr_seen (
  utr text primary key,
  order_id text not null,
  created_at bigint not null
);

-- Exactly-once delivery: only the first insert for an order may deliver.
create table bot.paid_once (
  order_id text primary key,
  created_at bigint not null
);

-- Broadcasts, sent in small batches by the every-minute worker.
create table bot.jobs (
  id integer generated always as identity primary key,
  kind text not null,
  audience text not null default 'buyers',
  from_chat bigint not null default 0,
  message_id bigint not null default 0,
  admin_chat bigint not null default 0,
  cursor bigint not null default 0,
  sent integer not null default 0,
  failed integer not null default 0,
  status text not null default 'running',
  created_at bigint not null
);

-- Telegram file ids of preview media, so each file is uploaded to Telegram once.
create table bot.media_cache (
  path text primary key,
  file_id text not null,
  updated_at bigint not null
);

-- Defence in depth: RLS on with no policies, plus no API privileges at all.
alter table bot.settings enable row level security;
alter table bot.users enable row level security;
alter table bot.upi_accounts enable row level security;
alter table bot.orders enable row level security;
alter table bot.utr_seen enable row level security;
alter table bot.paid_once enable row level security;
alter table bot.jobs enable row level security;
alter table bot.media_cache enable row level security;

revoke all on all tables in schema bot from public, anon, authenticated;
revoke all on all sequences in schema bot from public, anon, authenticated;
alter default privileges in schema bot revoke all on tables from public, anon, authenticated;
