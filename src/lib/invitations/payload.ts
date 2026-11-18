type Ceremony = { name?: unknown; date?: unknown; enabled?: unknown };

export type PayloadInput = {
  id?: string;
  status: "draft" | "published" | "archived";
  config: Record<string, unknown>;
  guestName?: string | null;
  commonLink?: boolean;
};

/** The schedule the RSVP form asks about is derived from the template's ceremonies. */
function rsvpEvents(config: Record<string, unknown>) {
  const raw = (config.ceremonies ?? config.events ?? []) as Ceremony[];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c && typeof c === "object" && c.enabled !== false)
    .map(({ c, i }) => ({
      id: String(i),
      name: typeof c.name === "string" ? c.name : `Event ${i + 1}`,
      date: typeof c.date === "string" ? c.date : "",
    }));
}

/**
 * The templates read their configuration from `#platform=<base64url JSON>`.
 * It lives in the URL hash, so it never reaches a server log.
 */
export function buildPlatformHash({
  id,
  status,
  config,
  guestName,
  commonLink,
}: PayloadInput): string {
  const payload = {
    event: {
      id,
      status,
      commonLink: Boolean(commonLink),
      rsvpEvents: rsvpEvents(config),
      rsvpAutoManaged: true,
      rsvpManageable: false,
    },
    sectionOverrides: { __templateConfig: config },
    guest: guestName ? { name: guestName } : null,
  };
  return `#platform=${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")}`;
}
