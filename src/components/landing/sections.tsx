import Image from "next/image";
import {
  CalendarHeart,
  Check,
  CheckCheck,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  PenLine,
  Plus,
  Send,
  Smartphone,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/button";
import { LazyVideo } from "@/components/ui/lazy-video";
import { Reveal } from "@/components/ui/reveal";
import { BRAND } from "@/lib/brand";
import { SHOWCASE, previewCover, previewStill, previewVideo } from "@/lib/showcase";
import type { Template } from "@/lib/templates";

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`px-5 py-20 sm:px-6 lg:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

/** A small lotus between two lines, used under section headings. */
export function Ornament() {
  return (
    <div className="mx-auto mt-5 flex items-center justify-center gap-3 text-seal" aria-hidden="true">
      <span className="h-px w-14 bg-current opacity-50" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21c-3-3-3-7 0-11 3 4 3 8 0 11Z" />
        <path d="M12 21c-5-1-8-4-8-9 4 0 7 3 8 9Z" opacity=".75" />
        <path d="M12 21c5-1 8-4 8-9-4 0-7 3-8 9Z" opacity=".75" />
      </svg>
      <span className="h-px w-14 bg-current opacity-50" />
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-[44rem] text-center">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="display mt-4 text-[38px] leading-[1.06] sm:text-[52px]">{title}</h2>
      <Ornament />
      {sub && <p className="mx-auto mt-5 max-w-[38rem] text-[18px] leading-[30px] text-text-2">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const SHARE = [
  { icon: MessageCircle, label: "WhatsApp" },
  { icon: Send, label: "Telegram" },
  { icon: Smartphone, label: "Text message" },
  { icon: Mail, label: "Email" },
  { icon: Link2, label: "Instagram" },
];

/** A strip right under the hero: where invitations travel. */
export function ShareStrip() {
  return (
    <section aria-label="Share anywhere" className="border-y border-(--hairline) bg-white/60 px-5 py-6 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
        <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-text-2">Send it on</p>
        {SHARE.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-2 text-[16px] font-medium text-maroon">
            <s.icon size={20} strokeWidth={1.75} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/** One full block per template: video, gallery, pros and a real use case. */
export function TemplateShowcase({ templates }: { templates: Template[] }) {
  return (
    <Section id="designs" className="bg-[linear-gradient(180deg,transparent,rgba(251,238,214,0.7)_20%,rgba(251,238,214,0.7)_80%,transparent)]">
      <SectionHead
        eyebrow="Five royal designs"
        title={
          <>
            See each one <em>come alive</em>
          </>
        }
        sub="Every design opens with its own animation, plays music, and collects RSVPs. Here is exactly what you get."
      />
      <div className="mt-16 grid gap-24 lg:gap-32">
        {templates.map((t, i) => {
          const info = SHOWCASE[t.slug];
          const flip = i % 2 === 1;
          return (
            <Reveal key={t.slug}>
              <article className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
                <div className={flip ? "lg:order-2" : ""}>
                  <div className="relative mx-auto w-full max-w-[300px]">
                    <div
                      aria-hidden="true"
                      className="absolute inset-[-8%] -z-10 rounded-[60px] bg-[radial-gradient(closest-side,rgba(255,214,107,0.55),transparent_75%)] blur-xl"
                    />
                    <div className="rounded-[42px] bg-gradient-to-b from-[#5a0f27] to-[#2a0610] p-[9px] shadow-[0_30px_70px_rgba(107,15,43,0.35),0_0_0_1.5px_rgba(255,214,107,0.5)]">
                      <div className="relative aspect-[9/17.4] overflow-hidden rounded-[34px] bg-[#fdf3e0]">
                        <LazyVideo
                          src={previewVideo(t.slug)}
                          poster={previewCover(t.slug)}
                          label={`${t.name} invitation playing`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={flip ? "lg:order-1" : ""}>
                  <p className="eyebrow !justify-start">{t.category}</p>
                  <h3 className="display mt-3 text-[40px] leading-[1.05] sm:text-[48px]">{t.name}</h3>
                  <p className="mt-2 text-[17px] italic text-seal">{info?.feel}</p>
                  <p className="mt-5 max-w-[34rem] text-[18px] leading-[30px] text-text-2">{t.tagline}</p>

                  <ul className="mt-6 grid gap-3">
                    {t.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-[16px] leading-6">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-maroon text-[#ffd66b]">
                          <Check size={14} strokeWidth={3} aria-hidden="true" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  {info && (
                    <div className="glass mt-7 max-w-[34rem] rounded-2xl p-5">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-crimson">
                        A real use
                      </p>
                      <p className="mt-2 text-[16px] leading-[26px]">{info.useCase}</p>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3" aria-label={`${t.name} screens`}>
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="relative aspect-[9/16] w-[72px] overflow-hidden rounded-xl ring-1 ring-[rgba(183,121,31,0.4)] sm:w-[88px]"
                      >
                        <Image src={previewStill(t.slug, n)} alt="" fill sizes="88px" className="object-cover" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <LinkButton href={`/preview/${t.slug}`} size="lg" className="btn-glint">
                      Customize this design
                    </LinkButton>
                    <LinkButton href={`/preview/${t.slug}#demo`} variant="glass" size="lg">
                      Open live preview
                    </LinkButton>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const STEPS = [
  {
    n: "१",
    title: "Choose your design",
    text: "Browse five royal designs and watch each one play. Pick the one that feels like your wedding.",
  },
  {
    n: "२",
    title: "Make it yours",
    text: "Type your names right on the invitation. Add parents, every ceremony with time and venue, photos and a note.",
  },
  {
    n: "३",
    title: "Share one link",
    text: "Send a ready-made message by WhatsApp, Instagram, Telegram or SMS, with each friend's name already in it.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHead
        eyebrow="Three simple steps"
        title={
          <>
            From idea to <em>invitation sent</em>, in minutes
          </>
        }
      />
      <ol className="relative mt-16 grid gap-6 md:grid-cols-3">
        <div
          aria-hidden="true"
          className="absolute left-[16%] right-[16%] top-[58px] hidden h-px border-t-2 border-dashed border-[rgba(183,121,31,0.5)] md:block"
        />
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <Reveal delay={i * 0.08} className="h-full">
              <div className="glass-strong relative h-full rounded-[28px] p-8 text-center">
                <span className="deva relative mx-auto grid size-[84px] place-items-center rounded-full bg-gradient-to-br from-[#8a1538] to-[#4a0a1e] text-[44px] leading-none text-[#ffd66b] shadow-[0_14px_30px_rgba(107,15,43,0.35),0_0_0_4px_#fff8ee,0_0_0_5.5px_rgba(201,122,0,0.6)]">
                  {s.n}
                </span>
                <h3 className="display mt-7 text-[30px] leading-[1.1]">{s.title}</h3>
                <p className="mt-3 text-[16px] leading-[26px] text-text-2">{s.text}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
      <Reveal className="mt-12 flex justify-center">
        <LinkButton href="/templates" size="lg" className="btn-glint">
          Start free
        </LinkButton>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: UserRound,
    title: "A personal link for every guest",
    text: "Add your guest list and each person gets their own link. When they open it, their name is on the invitation, like a hand-written card.",
    big: true,
  },
  {
    icon: CheckCheck,
    title: "RSVPs in one place",
    text: "Guests reply on the invitation. You see who is coming, how many, and any note they left.",
    big: true,
  },
  {
    icon: CalendarHeart,
    title: "Every ceremony",
    text: "Haldi to reception, each with its own date, time and venue.",
  },
  {
    icon: MapPin,
    title: "One-tap maps",
    text: "Guests tap the venue and their map opens, ready to navigate.",
  },
  {
    icon: Music,
    title: "Music that starts on open",
    text: "A soft track plays when the invitation opens, and guests can mute it.",
  },
  {
    icon: PenLine,
    title: "Edit any time",
    text: "Change a time or venue after sharing. The link stays the same, so nobody needs a new one.",
  },
];

export function Features() {
  return (
    <Section id="features">
      <SectionHead
        eyebrow="Everything included"
        title={
          <>
            Made for <em>real weddings</em>, with real guest lists
          </>
        }
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 4) * 0.05} className={f.big ? "lg:col-span-2" : ""}>
            <div className="glass glass-interactive h-full rounded-[28px] p-7">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#ffd66b] to-[#f5a300] text-[#3b0a1a] shadow-[0_10px_22px_rgba(245,163,0,0.35)]">
                <f.icon size={23} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <h3 className="display mt-5 text-[26px] leading-[1.12]">{f.title}</h3>
              <p className="mt-2 text-[16px] leading-[26px] text-text-2">{f.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const ROWS = [
  ["Opening", "A flat card", "An animated opening, with music"],
  ["Guest replies", "Phone calls and messages", "Collected in your dashboard"],
  ["Personal touch", "The same card for everyone", "The guest's own name on their link"],
  ["Sending", "Printing and postage time", "Share a link in seconds"],
  ["Changes", "Reprint and resend", "Edit it, the link stays the same"],
];

export function Comparison() {
  return (
    <Section>
      <SectionHead
        eyebrow="Why go interactive"
        title={
          <>
            A printed card, or one that <em>comes alive</em>
          </>
        }
      />
      <Reveal className="mt-14">
        <div className="glass-strong overflow-x-auto rounded-[28px]">
          <table className="w-full min-w-[640px] border-collapse text-left text-[16px] leading-6">
            <thead>
              <tr className="border-b border-(--hairline) text-text-2">
                <th scope="col" className="px-7 py-5" />
                <th scope="col" className="px-7 py-5 font-medium">
                  Printed card
                </th>
                <th scope="col" className="bg-maroon px-7 py-5 font-semibold text-[#ffd66b]">
                  {BRAND.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, printed, ours]) => (
                <tr key={label} className="border-b border-(--hairline) last:border-0">
                  <th scope="row" className="px-7 py-5 font-semibold text-maroon">
                    {label}
                  </th>
                  <td className="px-7 py-5 text-text-2">{printed}</td>
                  <td className="bg-[rgba(245,163,0,0.1)] px-7 py-5 font-medium">{ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "Can I try it before I decide?",
    a: "Yes. Pick a design and edit it with your own names, dates and photos for free. When you love it, publish it to get your shareable link.",
  },
  {
    q: "How do guests open the invitation?",
    a: "They tap your link. It opens in their phone's browser with its own animation and music, then shows the ceremonies and venues. No app to install.",
  },
  {
    q: "How do personal guest links work?",
    a: "Paste your guest names and each guest gets a unique link. When they open it, their name appears on the invitation.",
  },
  {
    q: "Can I change ceremonies, venues and times?",
    a: "Yes. Set the date, time and venue for each ceremony, with a map link guests can tap to navigate.",
  },
  {
    q: "How does RSVP work?",
    a: "Guests enter their name, say whether they are coming and how many people, and can leave a note. You see every reply in your dashboard.",
  },
  {
    q: "Can I edit after I share it?",
    a: "Yes. Your changes go live on the same link, so there is nothing to resend.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <SectionHead
        eyebrow="Good to know"
        title={
          <>
            Questions, <em>answered</em>
          </>
        }
      />
      <div className="mx-auto mt-12 grid max-w-3xl gap-3">
        {FAQS.map((f) => (
          <details key={f.q} className="glass group rounded-2xl px-6 open:bg-white/80">
            <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[18px] font-semibold leading-6 text-maroon [&::-webkit-details-marker]:hidden">
              {f.q}
              <Plus
                size={20}
                strokeWidth={2}
                aria-hidden="true"
                className="shrink-0 text-seal transition-transform duration-200 group-open:rotate-45"
              />
            </summary>
            <p className="pb-5 text-[16px] leading-[26px] text-text-2">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

export function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:pb-28">
      <div className="theme-dark band-maroon relative mx-auto max-w-6xl overflow-hidden rounded-[36px] px-6 py-20 text-center shadow-[0_40px_90px_rgba(107,15,43,0.35)] md:py-28">
        <Image
          src="/images/hero-haveli.jpg"
          alt=""
          fill
          sizes="1152px"
          className="-z-10 object-cover object-right opacity-25 mix-blend-luminosity"
        />
        <p className="deva text-[34px] leading-none text-[#ffd66b]">{BRAND.devanagari}</p>
        <h2 className="display mx-auto mt-5 max-w-[40rem] text-[42px] leading-[1.05] sm:text-[60px]">
          Make the <em>first</em> impression a beautiful one
        </h2>
        <p className="mx-auto mt-5 max-w-[32rem] text-[18px] leading-[30px] text-text-2">
          Your invitation is the first thing your guests see of your wedding. Start designing it now.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <LinkButton href="/templates" size="lg" className="btn-glint">
            Start free
          </LinkButton>
          <LinkButton href="/#designs" variant="glass" size="lg">
            See the designs again
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
