// SutraLuxe Telegram bot as a Supabase Edge Function.
//   POST /          Telegram webhook (checked with the webhook secret header)
//   POST /tick      every-minute worker, called by pg_cron (secret kept in Vault)
//   POST /setup     connects the webhook and bot menu (single-use admin token)
// verify_jwt is off because Telegram cannot send a Supabase token. Every route is
// protected by its own secret, checked against the database, and refuses if it is missing.
import { makeEnv, getSetting, setSetting } from './db.js';
import { handleUpdate } from './bot.js';
import { tick } from './cron.js';
import { tg } from './tg.js';
import { text, json, safeEqual, errMsg, randHex } from './util.js';

// Keep working after the reply has been sent (the AI check takes a few seconds).
const waitUntil = (p: Promise<unknown>) => {
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt && typeof rt.waitUntil === 'function') rt.waitUntil(p);
};

Deno.serve(async (request: Request) => {
  // deno-lint-ignore no-explicit-any
  let env: any;
  try {
    env = makeEnv();
    return await route(request, env);
  } catch (e) {
    console.error('function error:', errMsg(e, env));
    return text('error', 500);
  }
});

// deno-lint-ignore no-explicit-any
async function route(request: Request, env: any) {
  const path = new URL(request.url).pathname.replace(/\/+$/, '');

  if (request.method === 'POST' && path.endsWith('/tick')) {
    const given = request.headers.get('x-cron-secret') || '';
    const [r] = given ? await env.sql`select bot.check_worker_secret(${given}) as ok` : [{ ok: false }];
    if (!r || !r.ok) return text('forbidden', 403);
    waitUntil(tick(env).catch((e) => console.error('tick error:', errMsg(e, env))));
    return text('ok');
  }

  if (request.method === 'POST' && path.endsWith('/setup')) {
    const given = request.headers.get('x-setup-token') || '';
    const [r] = given ? await env.sql`select bot.consume_setup_token(${given}) as ok` : [{ ok: false }];
    if (!r || !r.ok) return text('forbidden', 403);
    if (!env.BOT_TOKEN) return json({ ok: false, error: 'The BOT_TOKEN secret is not set in Supabase yet.' }, 400);

    // The webhook secret is made here and kept in the database, never typed by a person.
    let secret = await getSetting(env, 'webhook_secret');
    if (!secret) {
      secret = randHex(32);
      await setSetting(env, 'webhook_secret', secret);
    }
    const hook = new URL(request.url);
    hook.pathname = hook.pathname.replace(/\/setup\/?$/, '');
    hook.search = '';
    const url = hook.toString().replace(/^http:/, 'https:');
    const set = await tg(env, 'setWebhook', {
      url,
      secret_token: secret,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    });
    const me = await tg(env, 'getMe', {});
    await setSetting(env, 'commands_v', 0); // the minute worker re-sets the bot menu
    return json({
      ok: !!(set && set.ok),
      bot: me && me.ok ? me.result.username : null,
      error: set && !set.ok ? set.description : undefined,
      checks: {
        BOT_TOKEN: true,
        GEMINI_KEY: !!env.GEMINI_KEY,
        ADMIN_IDS: !!env.ADMIN_IDS,
        SITE_URL: /^https:\/\//.test(String(env.SITE_URL || '')),
        BOT_USERNAME: !!env.BOT_USERNAME,
      },
    });
  }

  if (request.method === 'POST') {
    // Telegram sends this header on every call; it is set when the webhook is connected.
    const want = await getSetting(env, 'webhook_secret');
    const got = request.headers.get('x-telegram-bot-api-secret-token') || '';
    if (!want || !got || !safeEqual(got, want)) return text('forbidden', 403);
    let update;
    try {
      update = await request.json();
    } catch {
      return text('bad request', 400);
    }
    waitUntil(handleUpdate(env, update).catch((e) => console.error('update error:', errMsg(e, env))));
    return text('ok');
  }

  return text('ok');
}
