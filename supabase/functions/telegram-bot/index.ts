// SutraLuxe Telegram bot as a Supabase Edge Function.
//   POST /          Telegram webhook (checked with the webhook secret header)
//   POST /tick      every-minute worker, called by pg_cron (checked with CRON_SECRET)
//   POST /setup     one-time: connects the webhook and the bot menu (CRON_SECRET)
// verify_jwt is off because Telegram cannot send a Supabase token; every route
// is protected by its own secret instead, and fails closed when the secret is unset.
import { makeEnv } from './db.js';
import { handleUpdate } from './bot.js';
import { tick } from './cron.js';
import { tg } from './tg.js';
import { text, json, safeEqual, errMsg } from './util.js';

// Keep working after the reply has been sent (the AI check takes a few seconds).
// deno-lint-ignore no-explicit-any
const waitUntil = (p: Promise<unknown>) => {
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt && typeof rt.waitUntil === 'function') rt.waitUntil(p);
};

const secretOk = (given: string | null, want: string | undefined) => !!want && !!given && safeEqual(given, want);

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
    if (!secretOk(request.headers.get('x-cron-secret'), env.CRON_SECRET)) return text('forbidden', 403);
    waitUntil(tick(env).catch((e) => console.error('tick error:', errMsg(e, env))));
    return text('ok');
  }

  if (request.method === 'POST' && path.endsWith('/setup')) {
    if (!secretOk(request.headers.get('x-cron-secret'), env.CRON_SECRET)) return text('forbidden', 403);
    if (!env.BOT_TOKEN || !env.WEBHOOK_SECRET) return json({ ok: false, error: 'BOT_TOKEN and WEBHOOK_SECRET must be set first' }, 400);
    const hook = new URL(request.url);
    hook.pathname = hook.pathname.replace(/\/setup\/?$/, '');
    hook.search = '';
    const r = await tg(env, 'setWebhook', {
      url: hook.toString().replace(/^http:/, 'https:'),
      secret_token: env.WEBHOOK_SECRET,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    });
    const me = await tg(env, 'getMe', {});
    return json({ ok: !!(r && r.ok), webhook: r && r.ok ? hook.toString() : null, bot: me && me.ok ? me.result.username : null, error: r && !r.ok ? r.description : undefined });
  }

  if (request.method === 'POST') {
    // Telegram sends this header on every call; it is set when the webhook is connected.
    if (!secretOk(request.headers.get('x-telegram-bot-api-secret-token'), env.WEBHOOK_SECRET)) return text('forbidden', 403);
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
