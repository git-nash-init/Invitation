/** A tiled brand mark as a CSS background image, laid over live previews to discourage copying them. */
export function watermarkBackground(mark: string): string {
  // The text goes into an image, so every character that could break it is removed.
  const safe = mark.replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 28) || "Preview";
  const tile =
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'>` +
    `<text x='150' y='100' transform='rotate(-24 150 100)' text-anchor='middle' font-family='sans-serif' font-size='17' ` +
    `fill='rgba(255,255,255,0.34)' stroke='rgba(0,0,0,0.28)' stroke-width='0.6'>${safe} · live preview</text></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(tile)}")`;
}
