/** Selling copy for each template, keyed by slug. The facts (name, bullets) come from the database. */
export const SHOWCASE: Record<string, { useCase: string; feel: string }> = {
  royale: {
    feel: "Grand, regal, unforgettable",
    useCase:
      "A big family wedding or sangeet for 300 guests: send each family a link with their own name on the gate, and watch the RSVPs arrive.",
  },
  noor: {
    feel: "Soft, blush and golden",
    useCase:
      "A poolside or garden ceremony. Guests open the arches, hear the music and reply right on the invitation.",
  },
  "rose-invitation": {
    feel: "Romantic, floral, hand-painted",
    useCase:
      "A romantic day wedding. Guests drag the rose petals to reveal the date, a small moment they will talk about.",
  },
  "papercut-magenta": {
    feel: "Bold, festive, layered paper",
    useCase:
      "A mehendi, haldi or full multi-day celebration, with a card for every function and its own time and venue.",
  },
  papercut: {
    feel: "Calm, botanical, modern",
    useCase:
      "An intimate wedding with a modern taste. Clean ceremony cards, a keepsake note and a photo for each function.",
  },
};

export const FALLBACK_SLIDES = [
  { slug: "royale", name: "The Royale Gate" },
  { slug: "noor", name: "The Noor Solarium" },
  { slug: "rose-invitation", name: "The Rose Pavilion" },
  { slug: "papercut-magenta", name: "The Magenta Lotus" },
  { slug: "papercut", name: "The Sage Lotus" },
];

export const previewVideo = (slug: string) => `/previews/${slug}/preview.mp4`;
export const previewCover = (slug: string) => `/previews/${slug}/cover.webp`;
export const previewStill = (slug: string, n: number) => `/previews/${slug}/still-${n}.webp`;
/** First frame of the preview video. Used as the poster so the video never "jumps" when it starts. */
export const previewPoster = (slug: string) => `/previews/${slug}/poster.webp`;

/**
 * Style groups the visitor can filter by. A design can sit in more than one group.
 * Unknown slugs (templates added later) fall into "All" only until they are listed here.
 */
export const FILTERS = [
  { id: "royal", label: "Royal & grand" },
  { id: "floral", label: "Floral & romantic" },
  { id: "papercut", label: "Papercut & modern" },
  { id: "festive", label: "Festive functions" },
] as const;

export const TEMPLATE_GROUPS: Record<string, string[]> = {
  royale: ["royal"],
  noor: ["royal", "floral"],
  "rose-invitation": ["floral"],
  "papercut-magenta": ["papercut", "festive"],
  papercut: ["papercut", "floral"],
};
