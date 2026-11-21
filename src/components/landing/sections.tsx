import Image from "next/image";
import { Plus } from "lucide-react";
import {
  CeremonyIcon,
  ChooseDesignIcon,
  EmailLogo,
  GuestLinkIcon,
  InstagramLogo,
  LotusMark,
  MakeItYoursIcon,
  MapPinIcon,
  MusicIcon,
  PenIcon,
  RsvpIcon,
  SealTick,
  ShareLinkIcon,
  SmsLogo,
  TelegramLogo,
  WhatsAppLogo,
} from "@/components/icons";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/button";
import { LazyVideo } from "@/components/ui/lazy-video";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { Reveal } from "@/components/ui/reveal";
import { BRAND } from "@/lib/brand";
import { SHOWCASE, previewPoster, previewStill, previewVideo } from "@/lib/showcase";
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
      <LotusMark size={22} />
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
  { logo: WhatsAppLogo, label: "WhatsApp" },
  { logo: InstagramLogo, label: "Instagram" },
  { logo: TelegramLogo, label: "Telegram" },
  { logo: SmsLogo, label: "Text message" },
  { logo: EmailLogo, label: "Email" },
];

/** A strip right under the hero: where invitations travel. The logos are the real apps'. */
export function ShareStrip() {
  return (
    <section aria-label="Share anywhere" className="border-y border-(--hairline) bg-white/70 px-5 py-6 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-5">
        <p className="mr-1 text-[14px] font-semibold uppercase tracking-[0.14em] text-text-2">Send it on</p>
        {SHARE.map((s) => (
          <span
            key={s.label}
            className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-[rgba(183,121,31,0.28)] bg-white py-1.5 pl-2.5 pr-4 text-[15px] font-semibold text-text shadow-[0_4px_14px_rgba(107,15,43,0.06)]"
          >
            <s.logo size={26} />
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
                    <PhoneFrame className="drop-shadow-[0_30px_50px_rgba(107,15,43,0.35)]">
                      <LazyVideo
                        src={previewVideo(t.slug)}
                        poster={previewPoster(t.slug)}
                        label={`${t.name} invitation playing`}
                        className="h-full w-full object-cover"
                      />
                    </PhoneFrame>
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
                        <SealTick size={24} className="mt-0.5 shrink-0" />
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
    art: ChooseDesignIcon,
    title: "Choose your design",
    text: "Browse five royal designs and watch each one play. Pick the one that feels like your wedding.",
  },
  {
    n: "२",
    art: MakeItYoursIcon,
    title: "Make it yours",
    text: "Type your names right on the invitation. Add parents, every ceremony with time and venue, photos and a note.",
  },
  {
    n: "३",
    art: ShareLinkIcon,
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
          className="absolute left-[16%] right-[16%] top-[76px] hidden h-px border-t-2 border-dashed border-[rgba(183,121,31,0.5)] md:block"
        />
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <Reveal delay={i * 0.08} className="h-full">
              <div className="glass-strong relative h-full rounded-[28px] p-8 text-center">
                <div className="relative mx-auto w-fit">
                  <s.art size={128} className="drop-shadow-[0_14px_22px_rgba(107,15,43,0.18)]" />
                  <span className="deva absolute -right-2 -top-1 grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#8a1538] to-[#4a0a1e] text-[22px] leading-none text-[#ffd66b] shadow-[0_6px_14px_rgba(107,15,43,0.35),0_0_0_3px_#fff8ee]">
                    {s.n}
                  </span>
                </div>
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
    art: GuestLinkIcon,
    title: "A personal link for every guest",
    text: "Add your guest list and each person gets their own link. When they open it, their name is on the invitation, like a hand-written card.",
    big: true,
  },
  {
    art: RsvpIcon,
    title: "RSVPs in one place",
    text: "Guests reply on the invitation. You see who is coming, how many, and any note they left.",
    big: true,
  },
  {
    art: CeremonyIcon,
    title: "Every ceremony",
    text: "Haldi to reception, each with its own date, time and venue.",
  },
  {
    art: MapPinIcon,
    title: "One-tap maps",
    text: "Guests tap the venue and their map opens, ready to navigate.",
  },
  {
    art: MusicIcon,
    title: "Music that starts on open",
    text: "A soft track plays when the invitation opens, and guests can mute it.",
  },
  {
    art: PenIcon,
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
            <div className="glass glass-interactive group/card h-full rounded-[28px] p-7">
              <f.art size={f.big ? 84 : 72} className="drop-shadow-[0_10px_16px_rgba(107,15,43,0.16)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:-translate-y-1 group-hover/card:scale-105" />
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
