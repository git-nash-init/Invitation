// Telegram Bot API. Never logs the token.
import { errMsg, redact, adminIds } from './util.js';

const api = (env, method) => `https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`;

export async function tg(env, method, payload) {
  if (!env.BOT_TOKEN) {
    console.error(`tg ${method}: BOT_TOKEN is not set`);
    return null;
  }
  try {
    const r = await fetch(api(env, method), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => null);
    if (!j || !j.ok) console.error(`tg ${method} failed:`, r.status, redact((j && j.description) || '', env));
    return j;
  } catch (e) {
    console.error(`tg ${method} network error:`, errMsg(e, env));
    return null;
  }
}

export const send = (env, chat, body, extra = {}) =>
  tg(env, 'sendMessage', {
    chat_id: chat,
    text: body,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    ...extra,
  });

// Preview media is always sent with protect_content: Telegram then blocks
// forwarding and saving of it.
export const sendProtectedVideo = (env, chat, video, caption, extra = {}) =>
  tg(env, 'sendVideo', {
    chat_id: chat,
    video,
    caption,
    parse_mode: 'HTML',
    protect_content: true,
    supports_streaming: true,
    ...extra,
  });

export const sendProtectedPhoto = (env, chat, photo, caption, extra = {}) =>
  tg(env, 'sendPhoto', { chat_id: chat, photo, caption, parse_mode: 'HTML', protect_content: true, ...extra });

export const sendProtectedAlbum = (env, chat, photos) =>
  tg(env, 'sendMediaGroup', {
    chat_id: chat,
    protect_content: true,
    media: photos.slice(0, 10).map((p) => ({ type: 'photo', media: p })),
  });

export const sendProtectedAudio = (env, chat, audio, title, extra = {}) =>
  tg(env, 'sendAudio', { chat_id: chat, audio, title, protect_content: true, ...extra });

export async function sendPhotoBytes(env, chat, bytes, caption, extra = {}) {
  const form = new FormData();
  form.set('chat_id', String(chat));
  form.set('caption', caption);
  form.set('parse_mode', 'HTML');
  if (extra.reply_markup) form.set('reply_markup', JSON.stringify(extra.reply_markup));
  form.set('photo', new Blob([bytes], { type: 'image/png' }), 'pay.png');
  try {
    const r = await fetch(api(env, 'sendPhoto'), { method: 'POST', body: form });
    const j = await r.json().catch(() => null);
    if (!j || !j.ok) console.error('tg sendPhoto failed:', r.status, redact((j && j.description) || '', env));
    return j;
  } catch (e) {
    console.error('tg sendPhoto network error:', errMsg(e, env));
    return null;
  }
}

// Downloads inside the function: the file URL contains the bot token, so it is
// never handed to anyone else (the AI gets the image bytes, not the URL).
export async function downloadFile(env, fileId) {
  const f = await tg(env, 'getFile', { file_id: fileId });
  if (!f || !f.ok || !f.result.file_path) return null;
  try {
    const r = await fetch(`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${f.result.file_path}`);
    if (!r.ok) return null;
    return new Uint8Array(await r.arrayBuffer());
  } catch (e) {
    console.error('tg download error:', errMsg(e, env));
    return null;
  }
}

export async function alertAdmins(env, body, extra = {}) {
  await Promise.all(adminIds(env).map((id) => send(env, id, body, extra)));
}
