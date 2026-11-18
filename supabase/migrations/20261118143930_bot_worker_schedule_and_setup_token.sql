-- =====================================================================
-- Every-minute worker and one-click bot setup, with no secret to copy by hand.
-- The worker secret lives only in Supabase Vault (encrypted); the bot function
-- checks it against the database. Project-specific: the URL below is this project's.
-- =====================================================================
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

select vault.create_secret(
  encode(extensions.gen_random_bytes(24), 'hex'),
  'bot_worker_secret',
  'Shared secret between the minute scheduler and the bot function'
)
where not exists (select 1 from vault.secrets where name = 'bot_worker_secret');

create or replace function bot.check_worker_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'bot_worker_secret' and decrypted_secret = p_secret
  );
$$;
revoke execute on function bot.check_worker_secret(text) from public, anon, authenticated;

-- A single-use token the admin page asks for, valid for ten minutes, so the
-- "Connect bot" button can prove an admin pressed it.
create or replace function public.admin_setup_token()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  insert into bot.settings (key, value)
  values ('setup_token', jsonb_build_object(
    'hash', encode(sha256(convert_to(t, 'UTF8')), 'hex'),
    'exp', extract(epoch from now())::bigint + 600))
  on conflict (key) do update set value = excluded.value;
  return t;
end;
$$;
revoke execute on function public.admin_setup_token() from public, anon;
grant execute on function public.admin_setup_token() to authenticated;

create or replace function bot.consume_setup_token(p_token text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v jsonb;
begin
  delete from bot.settings
  where key = 'setup_token'
    and value ->> 'hash' = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and (value ->> 'exp')::bigint > extract(epoch from now())::bigint
  returning value into v;
  return v is not null;
end;
$$;
revoke execute on function bot.consume_setup_token(text) from public, anon, authenticated;

-- The minute worker. cron.schedule with the same name updates the job.
select cron.schedule(
  'bot-tick',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://znpngvxlmgtpqgsmkzsv.supabase.co/functions/v1/telegram-bot/tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'bot_worker_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  );
  $job$
);
