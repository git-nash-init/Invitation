import Image from "next/image";
import type { CSSProperties } from "react";
import { SealTick } from "@/components/icons";
import { LinkButton } from "@/components/ui/button";
import { Enter } from "@/components/ui/reveal";
import { BRAND } from "@/lib/brand";
import { FALLBACK_SLIDES } from "@/lib/showcase";
import { HeroPhone } from "./hero-phone";

const PROOF = [
  "5 royal designs",
  "A personal link per guest",
  "RSVPs tracked for you",
  "One-tap WhatsApp sharing",
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
    <section className="relative isolate -mt-[var(--header-space)] overflow-hidden">
      {/* A bright lake-palace morning, edge to edge and up behind the header. The calm sky on the
          left carries the headline; there is no white wash over the picture. */}
      <Image
        src="/images/hero-haveli.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[62%_50%]"
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_85%_at_16%_55%,rgba(255,248,238,0.72),rgba(255,248,238,0.3)_55%,transparent_78%)] max-lg:bg-[linear-gradient(180deg,rgba(255,248,238,0.55),rgba(255,248,238,0.15)_60%,transparent)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-[#fff8ee] to-transparent" />
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

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-16 pt-[calc(var(--header-space)+1.5rem)] sm:px-6 lg:min-h-svh lg:grid-cols-[1.08fr_0.92fr] lg:gap-8 lg:pb-20">
        <div className="max-w-[40rem]">
          <Enter>
            <p className="eyebrow">
              <span className="deva text-[18px] normal-case tracking-normal">{BRAND.devanagari}</span>
              <span>{BRAND.tagline}</span>
            </p>
          </Enter>
          <Enter delay={0.05}>
            <h1 className="display mt-5 text-[46px] leading-[1.02] [text-shadow:0_2px_30px_rgba(255,248,238,0.9)] sm:text-[64px] lg:text-[80px]">
              The invitation <br className="hidden sm:block" />your guests <br className="hidden sm:block" />open <em>first</em>
            </h1>
          </Enter>
          <Enter delay={0.1}>
            <p className="mt-6 max-w-[34rem] text-[18px] font-medium leading-[30px] text-text [text-shadow:0_1px_18px_rgba(255,248,238,0.95)] sm:text-[20px] sm:leading-[32px]">
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
            <ul className="glass-strong mt-9 grid w-fit max-w-full gap-x-8 gap-y-3 rounded-2xl px-5 py-4 sm:grid-cols-2">
              {PROOF.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[15px] font-semibold text-text">
                  <SealTick size={22} className="shrink-0" />
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
