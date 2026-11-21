"use client";

import Link from "next/link";
import { LoadingIframe } from "@/components/ui/loading-iframe";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { watermarkBackground } from "@/lib/watermark";
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

  const bg = watermarkBackground(mark);

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
      <main className="paper-bg flex min-h-screen items-center justify-center px-4 pb-4 pt-[76px]">
        {/* As wide as the screen allows, never taller than it: the whole phone is always in view. */}
        <div className="relative w-full" style={{ maxWidth: "min(100%, calc((100svh - 92px) * 0.514))" }}>
          <PhoneFrame priority className="drop-shadow-[0_30px_60px_rgba(107,15,43,0.35)]">
            <LoadingIframe
              src={src}
              title="Live preview"
              label="Opening the live preview"
              hideScrollbars
              className="absolute inset-0 h-full w-full border-0 bg-black"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10"
              style={{ backgroundImage: bg, backgroundSize: "210px 140px" }}
            />
          </PhoneFrame>
        </div>
      </main>
      <div className="fixed inset-x-0 top-3 z-30 flex justify-center gap-2 px-3">
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
