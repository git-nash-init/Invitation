// Runs every minute (pg_cron calls /tick). Only a small batch goes out each run
// so Telegram's rate limits are never hit.
import { now, esc } from './util.js';
import { tg, send } from './tg.js';
import { getGrowth, getTemplate, getSetting, setSetting } from './db.js';
import { PROOF_WINDOW_SEC } from './logic.js';

export const SEND_BUDGET = 25;
export const JOB_BATCH = 20;
const UNPAID_BATCH = 10;

const H = 3600;
const D = 86400;
// Seconds after the QR when a reminder goes out.
export const UNPAID_STEPS = [10 * 60, 1 * H, 3 * H, 12 * H, 1 * D, 2 * D, 4 * D, 7 * D];

const blockedBot = (r) => !!r && r.error_code === 403;
const markBlocked = (env, id) => env.sql`update bot.users set bot_blocked = 1 where id = ${id}`;

export async function tick(env) {
  let budget = SEND_BUDGET;
  budget -= await runJobs(env, Math.min(budget, JOB_BATCH));
  const growth = await getGrowth(env);
  if (growth.unpaid_on && budget > 0) budget -= await unpaidReminders(env, Math.min(budget, UNPAID_BATCH));
  // An order nobody paid within the proof window can never be paid any more.
  await env.sql`update bot.orders set status = 'rejected', next_reminder_at = 0
                where status = 'pending' and created_at < ${now() - PROOF_WINDOW_SEC}`;
  await env.sql`delete from public.claim_tokens where expires_at < now() - interval '30 days'`;
  await env.sql`delete from public.preview_tokens where expires_at < now() - interval '30 days'`;
  if (budget > 0) budget -= await ensureCommands(env);
  await setSetting(env, 'last_cron', now());
}

// The bot's Menu button. Set once per version, not every minute.
export const COMMANDS_VERSION = 1;
export async function ensureCommands(env) {
  if ((await getSetting(env, 'commands_v', 0)) === COMMANDS_VERSION) return 0;
  const r = await tg(env, 'setMyCommands', {
    commands: [
      { command: 'start', description: 'Browse invitation templates' },
      { command: 'templates', description: 'All categories' },
      { command: 'my', description: 'My purchases' },
      { command: 'help', description: 'How to pay and get started' },
    ],
  });
  if (r && r.ok) await setSetting(env, 'commands_v', COMMANDS_VERSION);
  return 1;
}

// ---------- unpaid QR reminders ----------
export async function unpaidReminders(env, limit) {
  const t = now();
  const orders = await env.sql`select * from bot.orders
    where status = 'pending' and is_test = 0 and next_reminder_at > 0 and next_reminder_at <= ${t}
    order by next_reminder_at limit ${limit}`;
  let sent = 0;
  for (const o of orders) {
    // Jump past steps that are already over, so turning reminders on after a quiet spell sends no backlog.
    let stage = o.reminder_stage;
    while (stage + 1 < UNPAID_STEPS.length && o.created_at + UNPAID_STEPS[stage + 1] <= t) stage++;
    const next = stage + 1 < UNPAID_STEPS.length ? o.created_at + UNPAID_STEPS[stage + 1] : 0;
    await env.sql`update bot.orders set reminder_stage = ${stage + 1}, next_reminder_at = ${next} where id = ${o.id}`;

    const [user] = await env.sql`select * from bot.users where id = ${o.user_id}`;
    const tpl = await getTemplate(env, o.template_slug);
    if (!user || user.bot_blocked || user.blocked || !tpl || !tpl.is_active) {
      await env.sql`update bot.orders set next_reminder_at = 0 where id = ${o.id}`;
      continue;
    }
    const r = await send(env, user.id, `⏰ <b>${esc(tpl.name)}</b> is still waiting for you.\nFinish your payment to unlock it.`, {
      reply_markup: { inline_keyboard: [[{ text: `🛒 Pay Now · ₹${tpl.price}`, callback_data: 'buy:' + tpl.slug }]] },
    });
    sent++;
    if (blockedBot(r)) {
      await markBlocked(env, user.id);
      await env.sql`update bot.orders set next_reminder_at = 0 where id = ${o.id}`;
    }
  }
  return sent;
}

// ---------- /launch broadcasts ----------
export async function runJobs(env, limit) {
  const [job] = await env.sql`select * from bot.jobs where status = 'running' order by id limit 1`;
  if (!job || limit <= 0) return 0;
  const rows =
    job.audience === 'all'
      ? await env.sql`select id from bot.users where id > ${job.cursor} and blocked = 0 and bot_blocked = 0 order by id limit ${limit}`
      : await env.sql`select u.id from bot.users u
                      where u.id > ${job.cursor} and u.blocked = 0 and u.bot_blocked = 0
                        and exists (select 1 from bot.orders o where o.user_id = u.id and o.status = 'paid' and o.is_test = 0)
                      order by u.id limit ${limit}`;
  // Saved before sending: if this run is cut off, a few people may miss the post, but nobody gets it twice.
  if (rows.length) await env.sql`update bot.jobs set cursor = ${rows[rows.length - 1].id} where id = ${job.id}`;

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const r = await tg(env, 'copyMessage', { chat_id: row.id, from_chat_id: job.from_chat, message_id: job.message_id });
    if (r && r.ok) sent++;
    else {
      failed++;
      if (blockedBot(r)) await markBlocked(env, row.id);
    }
  }
  const finished = rows.length < limit;
  await env.sql`update bot.jobs set sent = sent + ${sent}, failed = failed + ${failed}, status = ${finished ? 'done' : 'running'} where id = ${job.id}`;
  if (finished) {
    await send(env, job.admin_chat, `✅ <b>Launch finished</b>\nSent: ${job.sent + sent}\nFailed or blocked: ${job.failed + failed}`);
  }
  return rows.length;
}
