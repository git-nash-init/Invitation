"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Live preview of a template. A browser can never be made copy-proof, so this is
 * built to discourage and to trace: a brand watermark is tiled across the screen,
 * the link expires fast, and context menu, selection, dragging and printing are
 * switched off. Those last four only stop casual copying.
 */
export function DemoFrame({
  src,
  mark,
  expiresAtMs,
  designHref,
  designName,
}: {
  src: string;
  mark: string;
  expiresAtMs: number;
  designHref: string;
  designName: string;
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

  // The text goes into an image, so every character that could break it is removed.
  const safe = mark.replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 28) || "Preview";
  const tile =
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'>` +
    `<text x='150' y='100' transform='rotate(-24 150 100)' text-anchor='middle' font-family='sans-serif' font-size='17' ` +
    `fill='rgba(255,255,255,0.34)' stroke='rgba(0,0,0,0.28)' stroke-width='0.6'>${safe} · live preview</text></svg>`;
  const bg = `url("data:image/svg+xml;utf8,${encodeURIComponent(tile)}")`;

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  if (left === 0) {
    return (
      <main className="paper-bg flex min-h-screen items-center justify-center px-4">
        <div className="glass-strong w-full max-w-md rounded-[28px] p-8 text-center">
          <h1 className="display text-[34px] leading-[1.1]">That was the preview</h1>
          <p className="mt-3 text-[16px] leading-6 text-text-2">
            Make it yours: add your own names, dates and photos for free.
          </p>
          <Link href={designHref} className="btn btn-primary btn-lg btn-glint mt-8 w-full">
            Customize {designName}
          </Link>
          <Link href="/templates" className="btn btn-ghost mt-2 w-full">
            See other designs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <style>{`@media print { body { display: none !important; } } body { user-select: none; -webkit-user-select: none; }`}</style>
      <iframe src={src} title="Live preview" allow="autoplay" className="fixed inset-0 h-full w-full border-0 bg-black" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10" style={{ backgroundImage: bg, backgroundSize: "300px 200px" }} />
      <div className="fixed inset-x-0 top-3 z-20 flex justify-center gap-2 px-3">
        <div className="glass-strong flex items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-[14px] leading-5">
          <span className="num font-medium">Preview ends in {mm}:{ss}</span>
          <Link href={designHref} className="btn btn-primary btn-sm">
            Customize free
          </Link>
          <Link href={designHref} aria-label="Close preview" className="btn btn-ghost btn-sm !size-[38px] !p-0">
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
