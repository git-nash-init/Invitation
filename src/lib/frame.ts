const HIDE =
  "*{scrollbar-width:none!important;-ms-overflow-style:none!important}" +
  "*::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}";

/**
 * Hides every scrollbar inside a same-origin iframe (a template shown in a phone) while leaving it
 * scrollable by touch, wheel and keys. Returns a function that puts the scrollbars back.
 * Styles are set through the CSS object model, which a page's content security policy does not block.
 */
export function hideFrameScrollbars(frame: HTMLIFrameElement | null): () => void {
  try {
    const doc = frame?.contentDocument;
    const win = frame?.contentWindow as (Window & typeof globalThis) | null | undefined;
    if (!doc || !win) return () => {};

    const root = doc.documentElement;
    root.style.setProperty("scrollbar-width", "none");

    let sheet: CSSStyleSheet | null = null;
    let fallback: HTMLStyleElement | null = null;
    try {
      sheet = new win.CSSStyleSheet();
      sheet.replaceSync(HIDE);
      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
    } catch {
      fallback = doc.createElement("style");
      fallback.textContent = HIDE;
      doc.head?.appendChild(fallback);
    }

    return () => {
      try {
        root.style.removeProperty("scrollbar-width");
        if (sheet) doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((s) => s !== sheet);
        fallback?.remove();
      } catch {
        /* the frame has gone */
      }
    };
  } catch {
    return () => {};
  }
}
