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

/**
 * A phone number as WhatsApp wants it: digits only, with the country code. A bare 10-digit number is
 * taken to be Indian. Returns "" when there is nothing usable.
 */
export function phoneDigits(raw: string | undefined | null): string {
  const d = (raw ?? "").replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d.length >= 11 && d.length <= 15 ? d : "";
}

/** With a phone number the message opens in that person's chat; without one WhatsApp asks who to send to. */
export const whatsappUrl = (message: string, phone?: string) => `https://wa.me/${phoneDigits(phone)}?text=${enc(message)}`;

/** Telegram wants the link and the text apart, so the link is not shown twice. */
export function telegramUrl(message: string, link: string) {
  const text = message.replaceAll(link, "").replace(/\n{3,}/g, "\n\n").trim();
  return `https://t.me/share/url?url=${enc(link)}&text=${enc(text)}`;
}

/** "?&body=" is read correctly by both iPhone and Android messaging apps. */
export const smsUrl = (message: string, phone?: string) => {
  const to = phoneDigits(phone);
  return `sms:${to ? `+${to}` : ""}?&body=${enc(message)}`;
};

export const emailUrl = (message: string, subject: string, to?: string) => {
  const addr = (to ?? "").trim();
  const ok = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(addr);
  return `mailto:${ok ? addr : ""}?subject=${enc(subject)}&body=${enc(message)}`;
};

/** Instagram has no web address that opens a message to someone, so it goes through the phone's share sheet. */
export const instagramInboxUrl = "https://www.instagram.com/direct/inbox/";
