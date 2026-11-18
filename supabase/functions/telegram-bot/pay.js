// Orders, UPI QR, screenshot verdict, exactly-once delivery of a purchase.
import { now, dayStart, rupees, esc, randHex, randInt, randToken, sha256Hex, isAdminUser, adminIds } from './util.js';
import { tg, send, sendPhotoBytes, sendProtectedAudio, downloadFile, alertAdmins } from './tg.js';
import { getTemplate, getUpi, listUpis, getUser, getSetting, setSetting, tracksFor } from './db.js';
import { upiUri, qrPng } from './qr.js';
import { readScreenshot } from './ai.js';
import { mediaRef, remember } from './media.js';
import { DEFAULT_MODEL, FAKE_LIMIT, REUSE_ORDER_SEC, PROOF_WINDOW_SEC, CLAIM_DAYS, priceFor, pickAmount, judge, claimUrl } from './logic.js';

export const BTN_BROWSE = '🔥 Browse templates';
export const BTN_MINE = '📦 My purchases';
export const MENU_KB = { keyboard: [[{ text: BTN_BROWSE }, { text: BTN_MINE }]], resize_keyboard: true, is_persistent: true };

const FIRST_REMINDER_SEC = 600;

export function supportLine(env) {
  const name = String(env.SUPPORT_USERNAME || '').replace(/^@/, '');
  return name ? `\n\nNeed help? Message @${esc(name)}` : '';
}

export function userLine(u) {
  if (!u) return 'unknown user';
  return `${esc(u.first_name || 'User')}${u.username ? ' @' + esc(u.username) : ''} (<code>${u.id}</code>)`;
}

// A website button only works with an https address; fall back to plain text.
export const hasHttps = (env) => /^https:\/\//.test(String(env.SITE_URL || ''));

const oneHourOnce = async (env, key) => {
  const last = (await getSetting(env, 'alert:' + key, 0)) || 0;
  if (now() - last < 3600) return false;
  await setSetting(env, 'alert:' + key, now());
  return true;
};

// ---------- which UPI ID takes the next payment ----------
export async function pickUpi(env) {
  const today = dayStart();
  for (const u of await listUpis(env)) {
    if (!u.active) continue;
    if (u.daily_limit > 0) {
      const [r] = await env.sql`select count(*)::int as n from bot.orders
        where upi_id = ${u.id} and status = 'paid' and is_test = 0 and paid_at >= ${today}`;
      if (r.n >= u.daily_limit) continue;
    }
    return u;
  }
  return null;
}

// Open orders of this UPI ID all hold a distinct amount (a unique index also enforces it).
export async function uniqueAmount(env, upiId, base, { up = false } = {}) {
  const rows = await env.sql`select amount_paise from bot.orders where upi_id = ${upiId} and status in ('pending', 'review')`;
  return pickAmount(new Set(rows.map((r) => r.amount_paise)), base, { up, start: randInt(1, 99) });
}

// ---------- start an order and send the QR ----------
export async function startOrder(env, chat, user, template, { isTest = false, upi = null } = {}) {
  const slug = isTest ? 'test' : template.slug;
  if (!isTest) {
    // A screenshot already waits for the admin: a second QR would let one payment be approved twice.
    const [waiting] = await env.sql`select id from bot.orders
      where user_id = ${user.id} and template_slug = ${slug} and status = 'review' and created_at > ${now() - PROOF_WINDOW_SEC}
      limit 1`;
    if (waiting) {
      await send(env, chat, `⏳ Your payment for this template is already being checked. You will get your link here as soon as it is confirmed. No need to pay again.${supportLine(env)}`);
      return null;
    }
  }

  upi = upi || (await pickUpi(env));
  if (!upi) {
    await send(env, chat, '⏳ Payments are paused right now. Please try again a little later.');
    if (await oneHourOnce(env, 'paused')) {
      await alertAdmins(env, '🚨 <b>Payments are paused</b>: no UPI ID is active or under its daily limit. Check Admin → Payments.');
    }
    return null;
  }

  const base = isTest ? 100 : priceFor(template, user);
  const [open] = await env.sql`select * from bot.orders
    where user_id = ${user.id} and template_slug = ${slug} and status = 'pending'
    order by created_at desc limit 1`;
  const inBand = (a) => (isTest ? a > base && a < base + 100 : a < base && a >= base - 500);
  let order = open && now() - open.created_at < REUSE_ORDER_SEC && open.upi_id === upi.id && inBand(open.amount_paise) ? open : null;

  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    const amount = await uniqueAmount(env, upi.id, base, { up: isTest });
    if (!amount) {
      await send(env, chat, '⏳ Too many payments in progress. Please try again in a few minutes.');
      return null;
    }
    const id = 'OD' + randHex(5).toUpperCase();
    const t = now();
    try {
      await env.sql.begin(async (tx) => {
        // The old QR's reminders stop: only the newest order nudges the buyer.
        await tx`update bot.orders set next_reminder_at = 0
                 where user_id = ${user.id} and template_slug = ${slug} and status = 'pending'`;
        await tx`insert into bot.orders (id, user_id, template_slug, amount_paise, upi_id, is_test, source, created_at, next_reminder_at)
                 values (${id}, ${user.id}, ${slug}, ${amount}, ${upi.id}, ${isTest ? 1 : 0}, ${user.click ? 'ad' : 'bot'}, ${t}, ${isTest ? 0 : t + FIRST_REMINDER_SEC})`;
      });
      order = { id, amount_paise: amount, upi_id: upi.id, user_id: user.id, template_slug: slug, is_test: isTest ? 1 : 0, created_at: t };
    } catch (e) {
      if (e && e.code === '23505') continue; // another buyer took this amount a moment ago: pick again
      throw e;
    }
  }
  if (!order) {
    await send(env, chat, '⏳ Too many payments in progress. Please try again in a few minutes.');
    return null;
  }

  const title = isTest ? 'Test payment' : esc(template.name);
  const caption =
    `💳 <b>Pay exactly ₹${rupees(order.amount_paise)}</b>\n${title}\n\n` +
    `To: <code>${esc(upi.vpa)}</code>\nName: ${esc(upi.payee_name)}\nOrder: <code>${order.id}</code>\n\n` +
    `1️⃣ Scan this QR in any UPI app\n2️⃣ Pay the exact amount, including the paise\n3️⃣ Tap <b>✅ Check Payment</b> and send the screenshot`;
  const reply_markup = { inline_keyboard: [[{ text: '✅ Check Payment', callback_data: 'chk:' + order.id }]] };
  try {
    const png = await qrPng(upiUri({ vpa: upi.vpa, name: upi.payee_name, paise: order.amount_paise, note: order.id }));
    await sendPhotoBytes(env, chat, png, caption, { reply_markup });
  } catch (e) {
    // No QR image: the buyer can still pay by typing the UPI ID.
    console.error('qr error:', e && e.message);
    await send(env, chat, caption.replace('Scan this QR in', 'Send to this UPI ID from'), { reply_markup });
  }
  return order;
}

// ---------- screenshot received ----------
export async function handleProof(env, chat, user, msg) {
  const [order] = await env.sql`select * from bot.orders
    where user_id = ${user.id} and status in ('pending', 'review') and created_at > ${now() - PROOF_WINDOW_SEC}
    order by created_at desc limit 1`;
  if (!order) return send(env, chat, 'You have no open order. Open a template and tap <b>🛒 Buy</b> to get a payment QR.');
  if (order.status === 'review') return send(env, chat, '⏳ Your payment is being checked. You will get your link here as soon as it is confirmed.');

  const upi = await getUpi(env, order.upi_id);
  const fileId = msg.photo ? msg.photo[msg.photo.length - 1].file_id : msg.document.file_id;
  await send(env, chat, '🔍 Checking your payment…');

  const bytes = await downloadFile(env, fileId);
  const read = bytes ? await readScreenshot(env, bytes, env.LLM_MODEL || DEFAULT_MODEL) : { error: 'could not download the image' };
  const v = judge(order, upi, read);

  if (v.verdict === 'pass') {
    const res = await finalize(env, order, v.utr);
    if (res === 'dup_utr') return strike(env, chat, user, order, 'this payment was already used for another order');
    return;
  }
  if (v.verdict === 'not_payment') return send(env, chat, "That doesn't look like a payment screenshot. Please send the screenshot of the completed payment.");
  if (v.verdict === 'failed') return send(env, chat, 'This payment shows as <b>failed</b>. If money was deducted, it usually returns on its own. Please pay again using the QR above.');
  if (v.verdict === 'fake') return strike(env, chat, user, order, v.reason);
  return sendToReview(env, chat, user, order, msg, fileId, v);
}

async function strike(env, chat, user, order, reason) {
  if (isAdminUser(env, user.id)) return send(env, chat, `❌ Test failed: ${esc(reason)}`);
  await env.sql`update bot.users set fake_count = fake_count + 1 where id = ${user.id}`;
  const count = user.fake_count + 1;
  if (count >= FAKE_LIMIT) {
    await env.sql`update bot.users set blocked = 1 where id = ${user.id}`;
    await send(env, chat, '🚫 Too many invalid payment proofs. You can no longer use this bot.');
    await alertAdmins(env, `🚫 Blocked after ${FAKE_LIMIT} invalid proofs: ${userLine(user)}\nLast reason: ${esc(reason)}\nUndo: <code>/unblock ${user.id}</code>`);
    return;
  }
  return send(env, chat, `❌ We couldn't accept this screenshot: ${esc(reason)}.\nPlease pay the exact amount on the QR and send the real screenshot. (Warning ${count} of ${FAKE_LIMIT})`);
}

async function sendToReview(env, chat, user, order, msg, fileId, v) {
  await env.sql`update bot.orders set status = 'review', utr = ${v.utr || ''}, next_reminder_at = 0 where id = ${order.id}`;
  await send(env, chat, `⏳ Thanks! Your payment needs a quick manual check. You will get your link here as soon as it is confirmed.${supportLine(env)}`);
  const upi = await getUpi(env, order.upi_id);
  const caption =
    `🧐 <b>Please check this payment</b>\n${userLine(user)}\nOrder <code>${order.id}</code> · <b>₹${rupees(order.amount_paise)}</b>\n` +
    `Why: ${esc(v.reason)}${v.utr ? `\nUTR: <code>${esc(v.utr)}</code>` : ''}` +
    `\n\n👉 Approve only if <b>₹${rupees(order.amount_paise)}</b> shows in your UPI app${upi ? ` (${esc(upi.vpa)})` : ''}. A screenshot alone is not proof.`;
  const reply_markup = {
    inline_keyboard: [[{ text: '✅ Approve', callback_data: 'ap:' + order.id }, { text: '❌ Reject', callback_data: 'rj:' + order.id }]],
  };
  await Promise.all(
    adminIds(env).map((id) =>
      msg.photo
        ? tg(env, 'sendPhoto', { chat_id: id, photo: fileId, caption, parse_mode: 'HTML', reply_markup })
        : tg(env, 'sendDocument', { chat_id: id, document: fileId, caption, parse_mode: 'HTML', reply_markup }),
    ),
  );
}

// Approve is two taps: the first only asks whether the money is really in the UPI app.
export async function confirmApprove(env, adminChat, orderId) {
  const [order] = await env.sql`select * from bot.orders where id = ${orderId}`;
  if (!order || order.status !== 'review') return send(env, adminChat, `Order ${esc(orderId)} was already handled.`);
  const user = await getUser(env, order.user_id);
  const upi = await getUpi(env, order.upi_id);
  return send(
    env,
    adminChat,
    `❓ <b>Did ₹${rupees(order.amount_paise)} really arrive?</b>\n${userLine(user)} · order <code>${order.id}</code>\n` +
      `Open your UPI app${upi ? ` (${esc(upi.vpa)})` : ''} and find this exact amount first. Approving unlocks the template for them.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: `✅ Yes, ₹${rupees(order.amount_paise)} arrived`, callback_data: 'apy:' + order.id }],
          [{ text: '❌ No, reject', callback_data: 'rj:' + order.id }],
        ],
      },
    },
  );
}

export async function reviewDecision(env, adminChat, orderId, approve) {
  const [order] = await env.sql`select * from bot.orders where id = ${orderId}`;
  if (!order || order.status !== 'review') return send(env, adminChat, `Order ${esc(orderId)} was already handled.`);
  const user = await getUser(env, order.user_id);
  if (approve) {
    const res = await finalize(env, order, order.utr);
    if (res === 'dup_utr') {
      // Same payment reference already paid another order: never deliver twice for one payment.
      await env.sql`update bot.orders set status = 'rejected' where id = ${order.id}`;
      await send(env, order.user_id, '❌ This payment was already used for another order.');
      return send(env, adminChat, `❌ Order ${order.id} not approved: UTR ${esc(order.utr)} already paid another order.`);
    }
    return send(env, adminChat, `✅ Approved ${order.id}.`);
  }
  await env.sql`update bot.orders set status = 'rejected' where id = ${order.id}`;
  await strike(env, order.user_id, user, order, 'the payment could not be confirmed');
  return send(env, adminChat, `❌ Rejected ${order.id}.`);
}

// ---------- exactly-once ----------
// Everything that makes a purchase real happens in one transaction: the payment
// reference is recorded, the order is marked paid, the entitlement and the claim
// link are created. Messages go out afterwards, so a failed message never loses a purchase
// ("My purchases" can always re-issue the link).
export async function finalize(env, order, utr) {
  const t = now();
  let claim = null;
  const outcome = await env.sql.begin(async (tx) => {
    if (utr) {
      const ins = await tx`insert into bot.utr_seen (utr, order_id, created_at) values (${utr}, ${order.id}, ${t})
                           on conflict (utr) do nothing returning utr`;
      if (!ins.length) {
        const [seen] = await tx`select order_id from bot.utr_seen where utr = ${utr}`;
        if (seen && seen.order_id !== order.id) return 'dup_utr';
      }
    }
    const once = await tx`insert into bot.paid_once (order_id, created_at) values (${order.id}, ${t})
                          on conflict (order_id) do nothing returning order_id`;
    if (!once.length) return 'already';

    await tx`update bot.orders set status = 'paid', paid_at = ${t}, utr = ${utr || ''}, next_reminder_at = 0 where id = ${order.id}`;
    if (order.is_test) return 'test';

    const [e] = await tx`insert into public.entitlements (template_slug, order_id, tg_user_id)
                         values (${order.template_slug}, ${order.id}, ${order.user_id})
                         on conflict (order_id) do update set order_id = excluded.order_id
                         returning id`;
    await tx`update bot.orders set entitlement_id = ${e.id} where id = ${order.id}`;
    await tx`update bot.orders set next_reminder_at = 0
             where user_id = ${order.user_id} and template_slug = ${order.template_slug} and status = 'pending'`;
    await tx`update bot.users set fake_count = 0 where id = ${order.user_id}`;
    claim = await createClaimToken(tx, e.id);
    return 'delivered';
  });

  if (outcome === 'dup_utr' || outcome === 'already') return outcome;
  if (outcome === 'test') {
    await send(env, order.user_id, `✅ <b>Test passed</b>: ₹${rupees(order.amount_paise)} verified. A test never counts as a sale.`);
    return 'test';
  }

  const tpl = await getTemplate(env, order.template_slug);
  const user = await getUser(env, order.user_id);
  await deliverPurchase(env, order, tpl, claim.token);

  const today = await salesSince(env, dayStart(t));
  await alertAdmins(
    env,
    `💰 <b>${order.source === 'ad' ? '📢 AD SALE' : 'SALE'} ₹${rupees(order.amount_paise)}</b>\n${esc((tpl && tpl.name) || order.template_slug)}\n${userLine(user)}\n` +
      `UTR: <code>${esc(utr || '-')}</code>\n\nToday: ${today.count} sales · ₹${rupees(today.paise)}`,
  );
  return 'delivered';
}

// Only the hash of the claim token is stored; the token itself goes to the buyer.
export async function createClaimToken(db, entitlementId) {
  const token = randToken(24);
  const hash = await sha256Hex(token);
  await db`insert into public.claim_tokens (token_hash, entitlement_id, expires_at)
           values (${hash}, ${entitlementId}, now() + make_interval(days => ${CLAIM_DAYS}::int))`;
  return { token };
}

export async function deliverPurchase(env, order, tpl, token) {
  const name = esc((tpl && tpl.name) || order.template_slug);
  const link = claimUrl(env.SITE_URL, token);
  const steps = `1️⃣ Tap <b>Open my studio</b>\n2️⃣ Sign in on our site\n3️⃣ Customize, publish and share 🔗`;
  const body = `🎉 <b>Payment confirmed</b> · ₹${rupees(order.amount_paise)}\n\n<b>${name}</b> is yours.\n\n${steps}`;
  if (hasHttps(env)) {
    await send(env, order.user_id, body, {
      reply_markup: { inline_keyboard: [[{ text: '✏️ Open my studio', url: link }], [{ text: BTN_MINE, callback_data: 'mine' }]] },
    });
  } else {
    await send(env, order.user_id, `${body}\n\n${esc(link)}`);
  }
  await send(env, order.user_id, 'Your purchases are always under the menu below 👇', { reply_markup: MENU_KB });
  if (tpl) await sendMusicChoices(env, order.user_id, order, tpl);
}

// 2 to 3 tracks that suit the template's category. Choosing one is optional and
// can be changed until the invitation is created.
export async function sendMusicChoices(env, chat, order, tpl) {
  const tracks = tpl.category_slug ? await tracksFor(env, tpl.category_slug) : [];
  if (!tracks.length) return;
  await send(env, chat, '🎵 <b>Pick your music</b>\nPlay a track, then tap <b>Use this</b> to choose it for your invitation.');
  for (const [i, tr] of tracks.entries()) {
    const ref = await mediaRef(env, 'music', tr.storage_path);
    const r = await sendProtectedAudio(env, chat, ref, tr.title, {
      caption: `🎵 <b>${esc(tr.title)}</b>${tr.vibe ? '\n' + esc(tr.vibe) : ''}`,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: '✅ Use this', callback_data: `mus:${order.id}:${i + 1}` }]] },
    });
    await remember(env, 'music', tr.storage_path, r, 'audio');
  }
}

// ---------- a buyer's purchases and fresh claim links ----------
export async function purchasesOf(env, userId) {
  return env.sql`select e.id, e.template_slug, e.order_id, e.consumed_at, e.claimed_at, e.revoked, t.name
                 from public.entitlements e left join public.templates t on t.slug = e.template_slug
                 where e.tg_user_id = ${userId} and not e.revoked
                 order by e.created_at`;
}

// A new link for a purchase that was not used yet. Old links keep working until they expire.
export async function reissueClaim(env, userId, orderId) {
  const [e] = await env.sql`select id, consumed_at from public.entitlements
                            where order_id = ${orderId} and tg_user_id = ${userId} and not revoked`;
  if (!e) return null;
  return { consumed: !!e.consumed_at, ...(await createClaimToken(env.sql, e.id)) };
}

export async function chooseMusic(env, userId, orderId, n) {
  const [e] = await env.sql`select e.id, t.category_slug from public.entitlements e
                            join public.templates t on t.slug = e.template_slug
                            where e.order_id = ${orderId} and e.tg_user_id = ${userId} and not e.revoked and e.consumed_at is null`;
  if (!e) return null;
  const tracks = await tracksFor(env, e.category_slug);
  const tr = tracks[n - 1];
  if (!tr) return null;
  await env.sql`update public.entitlements set music_track_id = ${tr.id} where id = ${e.id}`;
  return tr;
}

// ---------- remove a sale whose money never arrived ----------
// Returns a plain-text report for the admin.
export async function revokeOrder(env, orderId) {
  const id = String(orderId || '').trim().toUpperCase();
  const [order] = await env.sql`select * from bot.orders where id = ${id}`;
  if (!order || order.is_test) return { ok: false, message: `No sale with order ID ${orderId}.` };
  if (order.status !== 'paid' && order.status !== 'revoked') return { ok: false, message: `Order ${order.id} is ${order.status}, not a sale.` };

  await env.sql.begin(async (tx) => {
    await tx`update bot.orders set status = 'revoked' where id = ${order.id}`;
    await tx`update public.entitlements set revoked = true where order_id = ${order.id}`;
    // An invitation that was already made from this purchase goes back to draft.
    await tx`update public.invitations set status = 'draft'
             where entitlement_id in (select id from public.entitlements where order_id = ${order.id}) and status = 'published'`;
  });

  const user = await getUser(env, order.user_id);
  const who = user ? `${user.first_name || 'User'}${user.username ? ' @' + user.username : ''} (${user.id})` : String(order.user_id);
  const tpl = await getTemplate(env, order.template_slug);
  await send(env, order.user_id, `❌ Your purchase of <b>${esc((tpl && tpl.name) || order.template_slug)}</b> was removed: payment ₹${rupees(order.amount_paise)} for order <code>${order.id}</code> was not received.${supportLine(env)}`);
  return { ok: true, message: `Order ${order.id} removed from sales. ${who} no longer has access, and any published invitation made from it is back to draft.` };
}

// ---------- stats ----------
export async function salesSince(env, since) {
  const [r] = await env.sql`select count(*)::int as count, coalesce(sum(amount_paise), 0)::bigint as paise
                            from bot.orders where status = 'paid' and is_test = 0 and paid_at >= ${since}`;
  return { count: r.count, paise: r.paise };
}
