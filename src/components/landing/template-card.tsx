"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import type { Template } from "@/lib/templates";
import { previewVideo } from "@/lib/showcase";

/**
 * An arch-framed card. The cover is a real frame from the template; hover plays its video.
 *
 * On desktop the video is fetched once its card scrolls into view (phones never hover, so they
 * download nothing extra). It sits invisible on top. It only fades in once it is actually
 * playing, and it always starts from its first frame (the "Tap to open" card), so there is
 * no blank flash, no half-loaded frame and nothing that restarts.
 */
export function TemplateCard({ template, priority }: { template: Template; priority?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const card = useRef<HTMLAnchorElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const v = video.current;
    const el = card.current;
    if (!v || !el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        v.preload = "auto";
        io.disconnect();
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const play = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const v = video.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  };
  const stop = () => {
    const v = video.current;
    setLive(false);
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  return (
    <Link
      ref={card}
      href={`/preview/${template.slug}`}
      onPointerEnter={play}
      onPointerLeave={stop}
      onBlur={stop}
      className="glass glass-interactive group flex h-full flex-col overflow-hidden rounded-[28px] p-3 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-rose"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[18px] bg-[#fdf3e0] ring-1 ring-[rgba(183,121,31,0.35)]">
        <Image
          src={template.cover_path}
          alt={`${template.name} invitation`}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        <video
          ref={video}
          src={previewVideo(template.slug)}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onPlaying={() => setLive(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
            live ? "opacity-100" : "opacity-0"
          }`}
        />
        <span
          className={`absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#2a0610]/80 px-3.5 py-1.5 text-[12px] font-semibold text-[#fff4e2] backdrop-blur transition-opacity duration-200 ${
            live ? "opacity-0" : "opacity-100"
          }`}
        >
          <Play size={12} fill="currentColor" aria-hidden="true" />
          Live preview
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
        <p className="eyebrow !text-[11px]">{template.category}</p>
        <h3 className="display mt-2 text-[28px] leading-[1.1]">{template.name}</h3>
        <ul className="mt-3 grid gap-1.5 text-[14px] leading-5 text-text-2">
          {template.bullets.slice(0, 2).map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-[7px] size-1.5 shrink-0 rotate-45 bg-seal" aria-hidden="true" />
              {b}
            </li>
          ))}
        </ul>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] font-semibold text-maroon transition-transform duration-200 group-hover:translate-x-1">
          Customize this design
          <ArrowUpRight size={17} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
