/** One place for the brand, so a rename is a one-line change. */
export const BRAND = {
  name: "Pratham Invitation",
  short: "Pratham",
  devanagari: "प्रथम",
  meaning: "first",
  tagline: "Interactive wedding invitations",
  /** The line shown under the mark at the foot of every live invitation. */
  motto: "The first impression, beautifully made.",
  description:
    "Choose a royal interactive wedding invitation, add your names and photos, and share one link, or a personal link with every guest's name.",
  watermark: "Pratham Invitation preview",
} as const;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
