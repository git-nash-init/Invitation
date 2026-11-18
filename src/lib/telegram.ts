/** Link to the sales bot, optionally opening one template's card. */
export function botLink(templateSlug?: string): string | null {
  const name = (process.env.NEXT_PUBLIC_BOT_USERNAME ?? "").replace(/^@/, "");
  if (!name) return null;
  return `https://t.me/${name}${templateSlug ? `?start=t-${encodeURIComponent(templateSlug)}` : ""}`;
}
