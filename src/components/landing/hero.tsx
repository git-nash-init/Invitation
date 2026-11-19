import Image from "next/image";
import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { LinkButton } from "@/components/ui/button";
import { Enter } from "@/components/ui/reveal";
import { BRAND } from "@/lib/brand";
import { FALLBACK_SLIDES } from "@/lib/showcase";
import { HeroPhone } from "./hero-phone";

const PROOF = [
  "5 royal designs",
  "A personal link for every guest",
  "RSVPs tracked for you",
  "Share on WhatsApp in one tap",
];

const PETALS = [
  { left: "8%", s: 13, t: 15, d: -2, x: 60 },
  { left: "22%", s: 10, t: 18, d: -9, x: -40 },
  { left: "41%", s: 15, t: 13, d: -5, x: 50 },
  { left: "58%", s: 11, t: 17, d: -12, x: -60 },
  { left: "74%", s: 14, t: 14, d: -7, x: 40 },
  { left: "90%", s: 10, t: 16, d: -3, x: -30 },
];

export function Hero({ slides }: { slides: { slug: string; name: string }[] }) {
  const list = slides.length ? slides : FALLBACK_SLIDES;
  return (
    <section className="relative isolate overflow-hidden">
      {/* A bright lake-palace morning. The calm sky on the left carries the headline. */}
      <Image
        src="/images/hero-haveli.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[70%_50%]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fff8ee] via-[#fff8ee]/80 to-[#fff8ee]/0 lg:via-[#fff8ee]/55" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-[#fff8ee] to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {PETALS.map((p, i) => (
          <span
            key={i}
            className="petal"
            style={
              {
                left: p.left,
                "--s": `${p.s}px`,
                "--t": `${p.t}s`,
                "--d": `${p.d}s`,
                "--drift": `${p.x}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-16 pt-6 sm:px-6 lg:min-h-[calc(100svh-var(--header-space))] lg:grid-cols-[1.08fr_0.92fr] lg:gap-8 lg:pb-20">
        <div className="max-w-[40rem]">
          <Enter>
            <p className="eyebrow">
              <span className="deva text-[18px] normal-case tracking-normal">{BRAND.devanagari}</span>
              <span>{BRAND.tagline}</span>
            </p>
          </Enter>
          <Enter delay={0.05}>
            <h1 className="display mt-5 text-[46px] leading-[1.02] sm:text-[64px] lg:text-[76px]">
              The invitation your guests open <em>first</em>
            </h1>
          </Enter>
          <Enter delay={0.1}>
            <p className="mt-6 max-w-[34rem] text-[18px] leading-[30px] text-text-2 sm:text-[20px] sm:leading-[32px]">
              Choose a royal interactive design, add your names, dates and photos, and share one link,
              or a personal link with every guest&apos;s name on it.
            </p>
          </Enter>
          <Enter delay={0.15}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <LinkButton href="/templates" size="lg" className="btn-glint">
                Start free
              </LinkButton>
              <LinkButton href="/#templates" variant="glass" size="lg">
                Watch the designs
              </LinkButton>
            </div>
          </Enter>
          <Enter delay={0.2}>
            <ul className="mt-9 grid max-w-[34rem] gap-x-6 gap-y-3 sm:grid-cols-2">
              {PROOF.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[15px] font-medium text-text">
                  <span className="grid size-5 place-items-center rounded-full bg-maroon text-[#ffd66b]">
                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </Enter>
        </div>

        <Enter delay={0.15}>
          <HeroPhone slides={list} />
        </Enter>
      </div>
    </section>
  );
}
