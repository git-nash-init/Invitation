"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { LoadingIframe } from "@/components/ui/loading-iframe";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { BRAND } from "@/lib/brand";
import { startLivePreview } from "@/lib/preview";
import { previewCover } from "@/lib/showcase";
import { watermarkBackground } from "@/lib/watermark";

type Slide = { slug: string; name: string };
type Live = { slug: string; src: string; expiresAtMs: number };

/**
 * A phone showing a design. It rests on the design's cover; a tap plays the real template inside the
 * phone, and the arrows or dots swap to another design. Nothing changes by itself, and no scrollbar is drawn.
 */
export function HeroPhone({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [live, setLive] = useState<Live | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const wanted = useRef(slides[0]?.slug ?? "");
  const current = slides[i] ?? slides[0];

  // A live preview lasts ten minutes; after that the phone goes back to its cover.
  useEffect(() => {
    if (!live) return;
    const t = setTimeout(() => setLive(null), Math.max(0, live.expiresAtMs - Date.now()));
    return () => clearTimeout(t);
  }, [live]);

  function go(next: number) {
    const to = (next + slides.length) % slides.length;
    wanted.current = slides[to]?.slug ?? "";
    setI(to);
    setLive(null);
    setError("");
    setStarting(false);
  }

  async function play() {
    if (starting || !current) return;
    const slug = current.slug;
    setStarting(true);
    setError("");
    const res = await startLivePreview(slug);
    // The visitor may have moved on to another design while this was on its way.
    if (wanted.current !== slug) return;
    setStarting(false);
    if (res.ok) setLive({ slug, src: res.src, expiresAtMs: res.expiresAtMs });
    else setError(res.error);
  }

  if (!current) return null;
  const playing = live && live.slug === current.slug ? live : null;

  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className="relative">
        {/* Golden halo behind the phone */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -z-10 h-[88%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,214,107,0.65),rgba(245,163,0,0.18)_55%,transparent_75%)] blur-2xl"
        />

        <PhoneFrame priority className="drop-shadow-[0_30px_50px_rgba(107,15,43,0.35)]">
          {playing ? (
            <>
              <LoadingIframe
                key={playing.slug}
                src={playing.src}
                title={`${current.name} invitation, live`}
                label="Opening the invitation"
                hideScrollbars
                className="absolute inset-0 h-full w-full border-0 bg-black"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10"
                style={{ backgroundImage: watermarkBackground(BRAND.watermark), backgroundSize: "210px 140px" }}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={play}
              disabled={starting}
              aria-busy={starting || undefined}
              aria-label={`Play the ${current.name} invitation`}
              className="group absolute inset-0 block h-full w-full cursor-pointer"
            >
              <Image
                key={current.slug}
                src={previewCover(current.slug)}
                alt={`${current.name} invitation`}
                fill
                priority
                sizes="260px"
                className="object-cover"
              />
              <span className="absolute inset-x-0 bottom-[9%] flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#2a0610]/85 px-5 py-2.5 text-[14px] font-semibold text-[#fff4e2] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur transition-transform duration-200 group-hover:scale-105">
                  {starting ? (
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                  ) : (
                    <Play size={14} fill="currentColor" aria-hidden="true" />
                  )}
                  {starting ? "Opening" : "Tap to play"}
                </span>
              </span>
            </button>
          )}
        </PhoneFrame>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-center text-[14px] text-negative">
          {error}
        </p>
      )}

      {/* Swap design: arrows and dots, with the current design named for screen readers */}
      <div className="mt-4 flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => go(i - 1)}
          aria-label="Previous design"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-white/60 text-maroon shadow-[0_6px_20px_rgba(107,15,43,0.12)] backdrop-blur-md"
        >
          <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <div
          role="tablist"
          aria-label="Choose a design to preview"
          className="flex w-fit justify-center rounded-full bg-white/60 px-2 shadow-[0_6px_20px_rgba(107,15,43,0.12)] backdrop-blur-md"
        >
          {slides.map((s, idx) => (
            <button
              key={s.slug}
              type="button"
              role="tab"
              aria-selected={idx === i}
              aria-label={s.name}
              onClick={() => go(idx)}
              className="grid size-7 place-items-center"
            >
              <span
                className={`block h-2.5 rounded-full transition-all duration-300 ${
                  idx === i ? "w-5 bg-maroon" : "w-2.5 bg-[rgba(107,15,43,0.28)]"
                }`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(i + 1)}
          aria-label="Next design"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-white/60 text-maroon shadow-[0_6px_20px_rgba(107,15,43,0.12)] backdrop-blur-md"
        >
          <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2 text-center text-[14px] font-medium text-text-2" aria-live="polite">
        {current.name}
      </p>
    </div>
  );
}
