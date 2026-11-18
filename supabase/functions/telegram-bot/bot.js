// Telegram updates: buyer flow and admin commands.
import { now, dayStart, esc, rupees, randToken, sha256Hex, isAdminUser } from './util.js';
import { tg, send, sendProtectedVideo, sendProtectedPhoto, sendProtectedAlbum } from './tg.js';
import { touchUser, getTemplate, listCategories, listTemplates, templateMedia, getSetting, setSetting, delSetting } from './db.js';
import {
  startOrder, handleProof, reviewDecision, confirmApprove, revokeOrder, salesSince, purchasesOf, reissueClaim, chooseMusic,
  supportLine, hasHttps, BTN_BROWSE, BTN_MINE, MENU_KB,
} from './pay.js';
import { priceFor, claimUrl, demoUrl, DEMO_MINUTES, DEMO_MAX_VIEWS, DEMOS_PER_HOUR } from './logic.js';
import { mediaRef, remember } from './media.js';

const MINE_RE = /^(\/my|\/purchases|.*my\s*purchases?)$/i;
const CLICK_RE = /^c[A-Za-z0-9_-]{4,63}$/;
const SLUG_RE = /^[a-z0-9-]{2,40}$/;

const isImageDoc = (d) => !!d && /^image\//.test(d.mime_type || '') && (d.file_size || 0) <= 8 * 1024 * 1024;
const stateKey = (uid) => 'astate:' + uid;
const inr = (paise) => Math.round(paise / 100);

export async function handleUpdate(env, u) {
  const msg = u.message;
  const cb = u.callback_query;
  const from = (msg && msg.from) || (cb && cb.from);
  if (!from || from.is_bot) return;

  const admin = isAdminUser(env, from.id);
  const user = await touchUser(env, from);
  if (user.blocked && !admin) return; // blocked = ignored completely

  if (cb) return onCallback(env, cb, user, admin);
  if (!msg.chat || msg.chat.type !== 'private') return;
  const chat = msg.chat.id;
  const t = (msg.text || '').trim();

  if (t === '/id') return send(env, chat, `Your Telegram ID: <code>${from.id}</code>`);
  if (admin) {
    const done = await onAdmin(env, msg, chat, t, user);
    if (done) return;
  }
  if (/^\/start(\s|$)/.test(t)) return onStart(env, chat, user, t.split(/\s+/)[1] || '');
  if (t === BTN_BROWSE || t === '/templates') return showCategories(env, chat);
  if (t === BTN_MINE || MINE_RE.test(t)) return showMine(env, chat, user);
  if (t === '/help') {
    return send(env, chat, `ℹ️ <b>How it works</b>\n\n1️⃣ Pick a template\n2️⃣ Pay the exact amount on the QR\n3️⃣ Send the payment screenshot\n4️⃣ Open your studio on our site and customize${supportLine(env)}`, { reply_markup: MENU_KB });
  }
  if (msg.photo || isImageDoc(msg.document)) return handleProof(env, chat, user, msg);
  return send(env, chat, 'Use the menu below 👇', { reply_markup: MENU_KB });
}

// ---------- buyer ----------
async function onStart(env, chat, user, arg) {
  if (CLICK_RE.test(arg)) await env.sql`update bot.users set click = ${arg.slice(1)} where id = ${user.id}`;

  if (arg.startsWith('t-') && SLUG_RE.test(arg.slice(2))) await showTemplate(env, chat, user, arg.slice(2));
  else if (arg.startsWith('cat-') && SLUG_RE.test(arg.slice(4))) await showCategory(env, chat, arg.slice(4));
  else await showCategories(env, chat, true);

  await send(env, chat, '👇 Browse and your purchases are always in the menu below.', { reply_markup: MENU_KB });
}

async function showCategories(env, chat, welcome = false) {
  const cats = await listCategories(env);
  const head = welcome
    ? '💌 <b>SutraLuxe</b>\nInteractive invitations you make yourself.\n\n🎨 Pick a style\n🎬 Watch a preview\n✏️ Customize on our site\n🔗 Share by link, one for each friend\n\n👇 <b>Choose a category</b>'
    : '👇 <b>Choose a category</b>';
  if (!cats.length) return send(env, chat, '⏳ We are getting things ready. Please check back a little later.');
  return send(env, chat, head, {
    reply_markup: { inline_keyboard: cats.map((c) => [{ text: `${c.emoji} ${c.name}`.trim(), callback_data: 'cat:' + c.slug }]) },
  });
}

async function showCategory(env, chat, slug) {
  const cats = await listCategories(env);
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) return showCategories(env, chat);
  const tpls = await listTemplates(env, slug);
  if (!tpls.length) {
    return send(env, chat, `${cat.emoji} <b>${esc(cat.name)}</b>\n\n⏳ New templates are coming soon.`, {
      reply_markup: { inline_keyboard: [[{ text: '⬅️ Categories', callback_data: 'list' }]] },
    });
  }
  return send(env, chat, `${cat.emoji} <b>${esc(cat.name)}</b>\n${esc(cat.blurb)}\n\n👇 Tap a template to preview`, {
    reply_markup: {
      inline_keyboard: [
        ...tpls.map((t) => [{ text: `${t.name} · ₹${t.price}`, callback_data: 'tpl:' + t.slug }]),
        [{ text: '⬅️ Categories', callback_data: 'list' }],
      ],
    },
  });
}

// Short card: three bullets, the price, two buttons. Media is always sent protected.
async function showTemplate(env, chat, user, slug) {
  const tpl = await getTemplate(env, slug);
  if (!tpl || !tpl.is_active) return send(env, chat, 'This template is no longer available.');
  const price = inr(priceFor(tpl, user));
  const bullets = (Array.isArray(tpl.bullets) ? tpl.bullets : []).slice(0, 3).map((b) => `✨ ${esc(b)}`).join('\n');
  const caption =
    `<b>${esc(tpl.name)}</b>\n\n${bullets}\n\n💰 <b>₹${price}</b> · one invitation\n🔗 Share by link · see replies in your dashboard`.slice(0, 1000);
  const reply_markup = {
    inline_keyboard: [
      [{ text: '🔒 Try live demo', callback_data: 'demo:' + tpl.slug }, { text: `🛒 Buy ₹${price}`, callback_data: 'buy:' + tpl.slug }],
      [{ text: '⬅️ Back', callback_data: tpl.category_slug ? 'cat:' + tpl.category_slug : 'list' }],
    ],
  };

  const media = await templateMedia(env, slug);
  const video = media.find((m) => m.kind === 'video');
  const stills = media.filter((m) => m.kind !== 'video');

  if (video) {
    const r = await sendProtectedVideo(env, chat, await mediaRef(env, 'previews', video.storage_path), caption, { reply_markup });
    await remember(env, 'previews', video.storage_path, r, 'video');
    if (r && r.ok) return;
  }
  if (stills.length > 1) {
    const refs = await Promise.all(stills.slice(0, 5).map((m) => mediaRef(env, 'previews', m.storage_path)));
    await sendProtectedAlbum(env, chat, refs);
    return send(env, chat, caption, { reply_markup });
  }
  if (stills.length === 1) {
    const r = await sendProtectedPhoto(env, chat, await mediaRef(env, 'previews', stills[0].storage_path), caption, { reply_markup });
    await remember(env, 'previews', stills[0].storage_path, r, 'photo');
    if (r && r.ok) return;
  }
  // No preview media uploaded yet: fall back to the public cover image from the website.
  if (!video && stills.length === 0 && tpl.cover_path && hasHttps(env)) {
    const cover = `${String(env.SITE_URL).replace(/\/+$/, '')}${tpl.cover_path}`;
    const r = await sendProtectedPhoto(env, chat, cover, caption, { reply_markup });
    if (r && r.ok) return;
  }
  return send(env, chat, caption, { reply_markup });
}

// A private, short-lived link to a live demo, made for this Telegram account.
async function makeDemo(env, chat, user, slug) {
  const tpl = await getTemplate(env, slug);
  if (!tpl || !tpl.is_active) return send(env, chat, 'This template is no longer available.');
  const [r] = await env.sql`select count(*)::int as n from public.preview_tokens
                            where tg_user_id = ${user.id} and created_at > now() - interval '1 hour'`;
  if (r.n >= DEMOS_PER_HOUR) return send(env, chat, '⏳ You opened several demos in the last hour. Please try again a little later.');

  const token = randToken(24);
  const name = String(user.first_name || user.username || 'Guest').replace(/[\u0000-\u001f<>]/g, '').slice(0, 60) || 'Guest';
  await env.sql`insert into public.preview_tokens (token_hash, template_slug, tg_user_id, tg_name, expires_at, max_views)
                values (${await sha256Hex(token)}, ${slug}, ${user.id}, ${name}, now() + make_interval(mins => ${DEMO_MINUTES}::int), ${DEMO_MAX_VIEWS})`;

  const body = `🔒 <b>Private demo</b> · ${esc(tpl.name)}\n\n⏱ Works for ${DEMO_MINUTES} minutes\n👤 Made for you, your name shows on it\n🎬 Sample names and dates only`;
  const url = demoUrl(env.SITE_URL, token);
  if (hasHttps(env)) {
    return send(env, chat, body, { reply_markup: { inline_keyboard: [[{ text: '▶️ Open demo', url }], [{ text: '🛒 Buy', callback_data: 'buy:' + slug }]] } });
  }
  return send(env, chat, `${body}\n\n${esc(url)}`);
}

async function showMine(env, chat, user) {
  const rows = await purchasesOf(env, user.id);
  if (!rows.length) {
    return send(env, chat, "You haven't bought a template yet.\nPick one and make your invitation in minutes 💌", {
      reply_markup: { inline_keyboard: [[{ text: '🔥 Browse templates', callback_data: 'list' }]] },
    });
  }
  const status = (r) => (r.consumed_at ? '✅ Invitation created' : r.claimed_at ? '✏️ Ready to edit' : '🆕 Not opened yet');
  const lines = rows.map((r) => `<b>${esc(r.name || r.template_slug)}</b>\n${status(r)}`);
  return send(env, chat, `📦 <b>Your purchases</b>\n\n${lines.join('\n\n')}`, {
    reply_markup: {
      inline_keyboard: rows.map((r) => [
        { text: `${r.consumed_at ? '🔗 Manage' : '✏️ Open studio'} · ${r.name || r.template_slug}`.slice(0, 60), callback_data: 'cl:' + r.order_id },
      ]),
    },
  });
}

async function openStudio(env, chat, user, orderId) {
  const r = await reissueClaim(env, user.id, orderId);
  if (!r) return send(env, chat, 'This purchase is not on your account.');
  const url = r.consumed ? `${String(env.SITE_URL).replace(/\/+$/, '')}/dashboard` : claimUrl(env.SITE_URL, r.token);
  const body = r.consumed ? '🔗 Manage your invitation, guests and replies on our site.' : '✏️ Your studio is ready. Sign in on our site to customize, publish and share.';
  if (hasHttps(env)) return send(env, chat, body, { reply_markup: { inline_keyboard: [[{ text: r.consumed ? '🔗 Open dashboard' : '✏️ Open my studio', url }]] } });
  return send(env, chat, `${body}\n\n${esc(url)}`);
}

async function onCallback(env, cb, user, admin) {
  const chat = (cb.message && cb.message.chat && cb.message.chat.id) || user.id;
  const data = String(cb.data || '');
  await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id });

  if (data === 'list') return showCategories(env, chat);
  if (data === 'mine') return showMine(env, chat, user);
  if (data.startsWith('cat:')) return showCategory(env, chat, data.slice(4));
  if (data.startsWith('tpl:')) return showTemplate(env, chat, user, data.slice(4));
  if (data.startsWith('demo:')) return makeDemo(env, chat, user, data.slice(5));
  if (data.startsWith('buy:')) {
    const tpl = await getTemplate(env, data.slice(4));
    if (!tpl || !tpl.is_active) return send(env, chat, 'This template is no longer available.');
    return startOrder(env, chat, user, tpl);
  }
  if (data.startsWith('chk:')) return send(env, chat, '📸 Send the <b>screenshot of your payment</b> here and I will check it right away.');
  if (data.startsWith('cl:')) return openStudio(env, chat, user, data.slice(3));
  if (data.startsWith('mus:')) {
    const [, orderId, n] = data.split(':');
    const tr = await chooseMusic(env, user.id, orderId, Number(n));
    return send(env, chat, tr ? `🎵 Music saved: <b>${esc(tr.title)}</b>\nYou can change it later in the studio.` : 'This purchase is already in the studio. You can change the music there.');
  }

  if (!admin) return; // everything below is admin-only
  if (data.startsWith('ap:')) return confirmApprove(env, chat, data.slice(3));
  if (data.startsWith('apy:')) return reviewDecision(env, chat, data.slice(4), true);
  if (data.startsWith('rj:')) return reviewDecision(env, chat, data.slice(3), false);
  if (data.startsWith('ln:')) return launchChoice(env, chat, user.id, data.slice(3));
}

// ---------- admin ----------
async function onAdmin(env, msg, chat, t, user) {
  const uid = user.id;
  const state = await getSetting(env, stateKey(uid));

  if (t === '/cancel') {
    await delSetting(env, stateKey(uid));
    await send(env, chat, 'Cancelled.');
    return true;
  }

  if (state && state.mode === 'launch') {
    await setSetting(env, stateKey(uid), { mode: 'launch_ready', from_chat: chat, message_id: msg.message_id });
    await tg(env, 'copyMessage', { chat_id: chat, from_chat_id: chat, message_id: msg.message_id });
    await send(env, chat, '👆 This is the preview. Who should get it?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📣 Everyone who bought', callback_data: 'ln:buyers' }],
          [{ text: '📣 Everyone who started the bot', callback_data: 'ln:all' }],
          [{ text: '❌ Cancel', callback_data: 'ln:x' }],
        ],
      },
    });
    return true;
  }

  const [cmd, arg] = t.split(/\s+/);
  switch (cmd) {
    case '/stats':
      await sendStats(env, chat);
      return true;
    case '/dashboard':
      await send(env, chat, `🔐 Admin panel:\n${esc(String(env.SITE_URL || '').replace(/\/+$/, ''))}/admin`);
      return true;
    case '/revoke': {
      if (!arg) {
        await send(env, chat, 'Use: /revoke &lt;order ID&gt;\nOnly for a sale whose money never reached your UPI app.');
        return true;
      }
      const r = await revokeOrder(env, arg);
      await send(env, chat, (r.ok ? '🗑 ' : '⚠️ ') + esc(r.message));
      return true;
    }
    case '/block':
    case '/unblock': {
      const id = Number(arg);
      if (!id) {
        await send(env, chat, `Use: ${cmd} &lt;telegram id&gt;`);
        return true;
      }
      const blocked = cmd === '/block' ? 1 : 0;
      await env.sql`update bot.users set blocked = ${blocked}, fake_count = 0 where id = ${id}`;
      await send(env, chat, `${blocked ? '🚫 Blocked' : '✅ Unblocked'} ${id}.`);
      return true;
    }
    case '/launch':
      await setSetting(env, stateKey(uid), { mode: 'launch' });
      await send(env, chat, '📣 Send the post now: text, photo or video. /cancel to stop.');
      return true;
    case '/launchstop': {
      const r = await env.sql`update bot.jobs set status = 'stopped' where kind = 'launch' and status = 'running' returning id`;
      await send(env, chat, r.length ? '🛑 Stopped.' : 'Nothing is running.');
      return true;
    }
  }
  return false;
}

async function launchChoice(env, chat, uid, choice) {
  const state = await getSetting(env, stateKey(uid));
  await delSetting(env, stateKey(uid));
  if (choice === 'x' || !state || state.mode !== 'launch_ready') return send(env, chat, 'Cancelled.');
  await env.sql`insert into bot.jobs (kind, audience, from_chat, message_id, admin_chat, created_at)
                values ('launch', ${choice === 'all' ? 'all' : 'buyers'}, ${state.from_chat}, ${state.message_id}, ${chat}, ${now()})`;
  return send(env, chat, '🚀 Sending now, about 20 people a minute. You get a summary at the end. /launchstop stops it.');
}

async function sendStats(env, chat) {
  const today = await salesSince(env, dayStart());
  const week = await salesSince(env, now() - 7 * 86400);
  const all = await salesSince(env, 0);
  const [users] = await env.sql`select count(*)::int as n from bot.users`;
  return send(
    env,
    chat,
    `📊 <b>Sales</b>\nToday: ${today.count} · ₹${rupees(today.paise)}\n7 days: ${week.count} · ₹${rupees(week.paise)}\nAll time: ${all.count} · ₹${rupees(all.paise)}\n\n👥 Users: ${users.n}`,
  );
}
