import {
  Check,
  CheckCheck,
  Link2,
  MapPin,
  Music,
  PenLine,
  Plus,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { botLink } from "@/lib/telegram";

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
    <section id={id} className={`scroll-mt-24 px-6 py-24 lg:py-32 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="max-w-[40rem]">
      <h2 className="display text-[32px] leading-[1.15] sm:text-[40px]">{title}</h2>
      {sub && <p className="mt-4 text-[18px] leading-[28px] text-text-2">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const STEPS = [
  {
    title: "Choose a template",
    text: "Browse by style in our Telegram bot and watch a private preview of each one. Pay by UPI and you are sent straight to the site.",
  },
  {
    title: "Make it yours",
    text: "Edit right on the invitation: names, parents, ceremonies with times and venues, photos and a note.",
  },
  {
    title: "Publish and share",
    text: "Publish to get a link. Pick a ready-made message, add each friend's name and send it by WhatsApp, Instagram, Telegram or SMS.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHead title="From template to sent in three steps" />
      <ol className="mt-12 grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <Reveal delay={i * 0.05} className="h-full">
              <div className="glass h-full rounded-[16px] p-6">
                <span className="num text-[13px] text-seal">0{i + 1}</span>
                <h3 className="mt-6 text-[18px] font-medium leading-6">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-5 text-text-2">{s.text}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Link2,
    title: "A private link",
    text: "Each invitation lives at its own link that cannot be guessed. Share it on WhatsApp, by email or in a message.",
  },
  {
    icon: UserRound,
    title: "Personal guest links",
    text: "Add your guest list and get one link per guest. Their name appears on the invitation when they open it.",
  },
  {
    icon: MapPin,
    title: "Ceremonies and maps",
    text: "Set the date, time and venue for each ceremony, from Haldi to the reception, with a map link guests can tap.",
  },
  {
    icon: Music,
    title: "Music",
    text: "Background music starts when a guest opens the invitation. Choose one of our tracks or upload your own.",
  },
  {
    icon: CheckCheck,
    title: "RSVP replies",
    text: "Guests reply on the invitation. You see every reply and the headcount in your dashboard.",
  },
  {
    icon: PenLine,
    title: "Edit any time",
    text: "Change a date or a venue after you publish. The link stays the same, so nobody needs a new one.",
  },
];

export function Features() {
  return (
    <Section id="features">
      <SectionHead title="What every invitation includes" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.05} className="h-full">
            <div className="glass glass-interactive h-full rounded-[16px] p-6">
              <f.icon size={20} strokeWidth={1.5} className="text-text-2" aria-hidden="true" />
              <h3 className="mt-5 text-[16px] font-medium leading-6">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-5 text-text-2">{f.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const INCLUDED = [
  "The template you choose",
  "Edit names, dates, venues, photos and notes",
  "A private link to share",
  "Personal links and a ready-made message for every friend",
  "Background music from our licensed catalogue",
  "RSVP replies in your dashboard",
];

export function Pricing() {
  return (
    <Section id="pricing">
      <div className="glass-strong grid gap-10 rounded-[20px] p-8 md:grid-cols-[1.3fr_1fr] md:p-12">
        <div>
          <h2 className="display text-[32px] leading-[1.15] sm:text-[40px]">
            One price for each invitation
          </h2>
          <ul className="mt-8 grid gap-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] leading-[22px]">
                <Check
                  size={18}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-seal"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-center rounded-[12px] border border-(--hairline) bg-[rgba(239,233,222,0.04)] p-8">
          <p className="num text-[56px] leading-none">₹699</p>
          <p className="mt-3 text-[14px] leading-5 text-text-2">
            One time for each invitation, not a subscription
          </p>
          <LinkButton href={botLink() ?? "/templates"} target={botLink() ? "_blank" : undefined} rel="noopener noreferrer" size="lg" className="mt-8 w-full">
            {botLink() ? "Get it on Telegram" : "Browse templates"}
          </LinkButton>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const ROWS = [
  ["Opening", "A static card", "An animated opening, with music"],
  ["Guest replies", "Phone calls and messages", "Collected in your dashboard"],
  ["Personal greeting", "The same card for everyone", "The guest's own name on their link"],
  ["Sending", "Printing and postage time", "Share a link in seconds"],
  ["Changes", "Reprint and resend", "Edit it, the link stays the same"],
];

export function Comparison() {
  return (
    <Section>
      <SectionHead title="A printed card or an interactive one" />
      <Reveal className="mt-12">
        <div className="glass overflow-x-auto rounded-[16px]">
          <table className="w-full min-w-[640px] border-collapse text-left text-[14px] leading-5">
            <thead>
              <tr className="border-b border-(--hairline) text-text-2">
                <th scope="col" className="px-6 py-4 font-normal" />
                <th scope="col" className="px-6 py-4 font-normal">
                  Printed card
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-text">
                  SutraLuxe
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, printed, ours]) => (
                <tr key={label} className="border-b border-(--hairline) last:border-0">
                  <th scope="row" className="px-6 py-4 font-normal text-text-2">
                    {label}
                  </th>
                  <td className="px-6 py-4 text-text-2">{printed}</td>
                  <td className="px-6 py-4">{ours}</td>
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
    q: "How do guests open the invitation?",
    a: "They tap your link. The invitation opens with its own animation, the music starts, and the ceremonies and venues appear.",
  },
  {
    q: "Can I change ceremonies, venues and times?",
    a: "Yes. Set the date, time and venue for each ceremony, and add a map link so guests can navigate with one tap.",
  },
  {
    q: "How does RSVP work?",
    a: "Guests enter their name, say whether they are coming and how many people, and can leave a note. Every reply shows in your dashboard.",
  },
  {
    q: "How do personal guest links work?",
    a: "Choose personalised, paste your guest names, and each guest gets a unique link. When they open it, their name appears on the invitation.",
  },
  {
    q: "Can I edit after I publish?",
    a: "Yes. Your changes go live on the same link, so there is nothing to resend.",
  },
  {
    q: "Is ₹699 a subscription?",
    a: "No. It is a one-time price for each invitation.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <SectionHead title="Questions people ask" />
      <div className="mt-12 grid max-w-3xl gap-3">
        {FAQS.map((f) => (
          <details key={f.q} className="glass group rounded-[12px] px-6 open:bg-[rgba(38,36,33,0.6)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16px] leading-6 [&::-webkit-details-marker]:hidden">
              {f.q}
              <Plus
                size={18}
                strokeWidth={1.5}
                aria-hidden="true"
                className="shrink-0 text-text-2 transition-transform duration-200 group-open:rotate-45"
              />
            </summary>
            <p className="pb-5 text-[14px] leading-5 text-text-2">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function FinalCta() {
  return (
    <Section>
      <div className="glass-strong rounded-[20px] px-8 py-16 text-center md:py-20">
        <h2 className="display mx-auto max-w-[32rem] text-[32px] leading-[1.15] sm:text-[40px]">
          Start your invitation today
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {botLink() ? (
            <LinkButton href={botLink() as string} target="_blank" rel="noopener noreferrer" size="lg">
              Get it on Telegram
            </LinkButton>
          ) : null}
          <LinkButton href="/templates" variant={botLink() ? "glass" : "primary"} size="lg">
            Browse templates
          </LinkButton>
        </div>
      </div>
    </Section>
  );
}
