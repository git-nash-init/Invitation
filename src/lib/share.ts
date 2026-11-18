/**
 * Builds the message a host sends to one friend, and the links that open the
 * friend-sending apps. Pure functions, no browser APIs, so they are easy to test.
 */

export type MessageInput = { body: string; friend: string; host: string; link: string };

const clean = (s: string, max: number) => s.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/** Fills {friend}, {host} and {link}. Names are cleaned so odd input cannot break the message. */
export function compose({ body, friend, host, link }: MessageInput): string {
  const f = clean(friend, 80) || "there";
  const h = clean(host, 120) || "us";
  return body.replaceAll("{friend}", f).replaceAll("{host}", h).replaceAll("{link}", link);
}

const enc = encodeURIComponent;

export const whatsappUrl = (message: string) => `https://wa.me/?text=${enc(message)}`;

/** Telegram wants the link and the text apart, so the link is not shown twice. */
export function telegramUrl(message: string, link: string) {
  const text = message.replaceAll(link, "").replace(/\n{3,}/g, "\n\n").trim();
  return `https://t.me/share/url?url=${enc(link)}&text=${enc(text)}`;
}

/** "?&body=" is read correctly by both iPhone and Android messaging apps. */
export const smsUrl = (message: string) => `sms:?&body=${enc(message)}`;

export const emailUrl = (message: string, subject: string) => `mailto:?subject=${enc(subject)}&body=${enc(message)}`;

/** Instagram has no web address that opens a message to someone, so it goes through the phone's share sheet. */
export const instagramInboxUrl = "https://www.instagram.com/direct/inbox/";
