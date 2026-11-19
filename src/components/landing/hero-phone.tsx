"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCheck, Link2, Send } from "lucide-react";
import { previewCover, previewVideo } from "@/lib/showcase";

const EASE = [0.22, 1, 0.36, 1] as const;

type Slide = { slug: string; name: string };

/** A real phone showing the real template playing, switching design every few seconds. */
export function HeroPhone({ slides }: { slides: Slide[] }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const current = slides[i] ?? slides[0];

  useEffect(() => {
    if (reduce || hold || slides.length < 2) return;
    const t = setTimeout(() => setI((v) => (v + 1) % slides.length), 9000);
    return () => clearTimeout(t);
  }, [i, reduce, hold, slides.length]);

  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="relative">
      {/* Golden halo behind the phone */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 h-[88%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,214,107,0.65),rgba(245,163,0,0.18)_55%,transparent_75%)] blur-2xl"
      />

      <div
        className="relative rounded-[46px] bg-gradient-to-b from-[#5a0f27] to-[#2a0610] p-[10px] shadow-[0_40px_90px_rgba(107,15,43,0.45),0_0_0_1.5px_rgba(255,214,107,0.55)]"
        onPointerEnter={() => setHold(true)}
        onPointerLeave={() => setHold(false)}
      >
        <div className="absolute left-1/2 top-[18px] z-20 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-[#14030a]" />
        <div className="relative aspect-[9/17.4] w-full overflow-hidden rounded-[36px] bg-[#fdf3e0]">
          <AnimatePresence initial={false}>
            <motion.div
              key={current.slug}
              className="absolute inset-0"
              initial={reduce ? false : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              {reduce ? (
                <Image
                  src={previewCover(current.slug)}
                  alt={`${current.name} invitation`}
                  fill
                  priority
                  sizes="340px"
                  className="object-cover"
                />
              ) : (
                <video
                  key={current.slug}
                  src={previewVideo(current.slug)}
                  poster={previewCover(current.slug)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label={`${current.name} invitation playing`}
                  className="h-full w-full object-cover"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating glass notes: what the host sees happening */}
      <div className="glass-strong float-y absolute -left-4 top-[14%] hidden items-center gap-3 rounded-2xl py-2.5 pl-3 pr-4 sm:flex lg:-left-16">
        <span className="grid size-9 place-items-center rounded-full bg-[#0e8a5f]/15 text-positive">
          <CheckCheck size={18} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="text-[13px] leading-4">
          <b className="block font-semibold text-text">Aarti opened it</b>
          <span className="text-text-2">just now</span>
        </span>
      </div>
      <div
        className="glass-strong float-y absolute -right-3 top-[46%] hidden items-center gap-3 rounded-2xl py-2.5 pl-3 pr-4 sm:flex lg:-right-14"
        style={{ animationDelay: "-2s" }}
      >
        <span className="grid size-9 place-items-center rounded-full bg-[#f5a300]/20 text-[#b36b00]">
          <Send size={17} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="text-[13px] leading-4">
          <b className="block font-semibold text-text">3 replied yes</b>
          <span className="text-text-2">12 guests coming</span>
        </span>
      </div>
      <div
        className="glass-strong float-y absolute -left-2 bottom-[12%] hidden items-center gap-3 rounded-2xl py-2.5 pl-3 pr-4 sm:flex lg:-left-12"
        style={{ animationDelay: "-4s" }}
      >
        <span className="grid size-9 place-items-center rounded-full bg-[#e11d74]/12 text-rose">
          <Link2 size={17} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="text-[13px] leading-4">
          <b className="block font-semibold text-text">Link for Rohan</b>
          <span className="text-text-2">ready to send</span>
        </span>
      </div>

      </div>

      {/* Design switcher: dots, with the current design named underneath */}
      <div className="mt-5 text-center">
        <div role="tablist" aria-label="Choose a design to preview" className="flex justify-center">
          {slides.map((s, idx) => (
            <button
              key={s.slug}
              type="button"
              role="tab"
              aria-selected={idx === i}
              aria-label={s.name}
              onClick={() => setI(idx)}
              className="grid size-11 place-items-center"
            >
              <span
                className={`block h-2.5 rounded-full transition-all duration-300 ${
                  idx === i ? "w-8 bg-maroon" : "w-2.5 bg-[rgba(107,15,43,0.28)]"
                }`}
              />
            </button>
          ))}
        </div>
        <p className="display -mt-1 text-[24px] leading-none text-maroon">{current.name}</p>
      </div>
    </div>
  );
}
