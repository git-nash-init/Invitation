"use client";

import { useEffect, useState } from "react";

/**
 * Live demo of a template. A browser can never be made copy-proof, so this is
 * built to discourage and to trace: the viewer's name is tiled across the screen,
 * the link expires fast, and context menu, selection, dragging and printing are
 * switched off. Those last four only stop casual copying.
 */
export function DemoFrame({
  src,
  viewerName,
  expiresAtMs,
  botUrl,
}: {
  src: string;
  viewerName: string;
  expiresAtMs: number;
  botUrl: string | null;
}) {
  const [left, setLeft] = useState(() => Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000)));

  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))), 1000);
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("dragstart", block);
    return () => {
      clearInterval(id);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("dragstart", block);
    };
  }, [expiresAtMs]);

  // The name goes into an image, so every character that could break it is removed.
  const safe = viewerName.replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 28) || "Guest";
  const tile =
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'>` +
    `<text x='150' y='100' transform='rotate(-24 150 100)' text-anchor='middle' font-family='sans-serif' font-size='17' ` +
    `fill='rgba(255,255,255,0.34)' stroke='rgba(0,0,0,0.28)' stroke-width='0.6'>${safe} · private demo</text></svg>`;
  const mark = `url("data:image/svg+xml;utf8,${encodeURIComponent(tile)}")`;

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  if (left === 0) {
    return (
      <main className="paper-bg flex min-h-screen items-center justify-center px-4">
        <div className="glass-strong w-full max-w-md rounded-[20px] p-8 text-center">
          <h1 className="display text-[28px] leading-[1.15]">Your demo has ended</h1>
          <p className="mt-3 text-[14px] leading-5 text-text-2">Go back to Telegram for a new demo link, or buy the template to make it yours.</p>
          {botUrl && (
            <a href={botUrl} className="btn btn-primary btn-lg mt-8 w-full">
              Open Telegram bot
            </a>
          )}
        </div>
      </main>
    );
  }

  return (
    <>
      <style>{`@media print { body { display: none !important; } } body { user-select: none; -webkit-user-select: none; }`}</style>
      <iframe src={src} title="Private demo" allow="autoplay" className="fixed inset-0 h-full w-full border-0 bg-black" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10" style={{ backgroundImage: mark, backgroundSize: "300px 200px" }} />
      <div className="glass-strong fixed left-1/2 top-3 z-20 -translate-x-1/2 rounded-full px-4 py-2 text-[12px] leading-4">
        <span className="num">Demo ends in {mm}:{ss}</span>
      </div>
    </>
  );
}
