import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Lock, Plus, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { MobileCta } from "@/components/landing/mobile-cta";
import { Comparison, Section, SectionHead } from "@/components/landing/sections";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { BRAND } from "@/lib/brand";
import { getPricedTemplates, type PricedTemplate } from "@/lib/templates";

// Not linked from the menu or the footer and kept out of search: people arrive here from an advert.
export const metadata: Metadata = {
  title: "Pricing",
  description: `One payment per invitation on ${BRAND.name}. Design it free, pay only when you publish.`,
  robots: { index: false, follow: false },
};

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const INCLUDED = [
  ["An animated opening", "Your guests tap to open it, and it comes alive with motion and music."],
  ["Your words, your photos", "Change every line, every date and every picture until it is exactly yours."],
  ["Music of your choice", "Pick a track from our library or add your own."],
  ["One link to share", "Send it on WhatsApp, Instagram, SMS or email. Nothing to install."],
  ["A link with each guest's name", "Add your guest list and every guest gets their own named link."],
  ["Replies in one place", "Guests answer on the invitation. You see who is coming in your dashboard."],
  ["Venue maps", "Each event carries a map link guests can tap for directions."],
  ["Edit after you share", "Fix a time or a venue later. The link stays the same."],
] as const;

const STEPS = [
  ["Design it free", "Choose a design and make it yours. No card needed, no time limit."],
  ["Pay once to publish", "When you love it, pay one time for that invitation through our secure payment partner."],
  ["Share your link", "Your invitation goes live straight away. Send it to everyone."],
] as const;

const FAQS = [
  {
    q: "Is it really free to design?",
    a: "Yes. You can choose any design and edit it with your own names, dates, photos and music without paying. You pay only when you publish it to get your shareable link.",
  },
  {
    q: "Is it a subscription?",
    a: "No. It is one payment for one invitation. There is nothing to renew and nothing to cancel.",
  },
  {
    q: "What can I pay with?",
    a: "UPI and net banking, through our payment partner. The methods offered are shown in the payment window before you pay.",
  },
  {
    q: "Can I change the invitation after paying?",
    a: "Yes. Edit it as many times as you like after publishing. Your changes appear on the same link, at no extra cost.",
  },
  {
    q: "What if something goes wrong with my payment?",
    a: "If you are charged and the invitation cannot be published, or you are charged twice, we refund you in full. The refund page has the details.",
  },
  {
    q: "Do my guests need an app?",
    a: "No. The link opens in the browser on any phone.",
  },
];

function DesignCard({ t }: { t: PricedTemplate }) {
  const was = t.list_price && t.list_price > t.price ? t.list_price : null;
  return (
    <Link
      href={`/preview/${t.slug}`}
      className="glass glass-interactive group flex h-full w-full max-w-[300px] flex-col overflow-hidden rounded-[26px] p-3 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-rose"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-[#fdf3e0] ring-1 ring-[rgba(183,121,31,0.35)]">
        <Image
          src={t.cover_path}
          alt={`${t.name} invitation`}
          fill
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        <span className="num absolute right-3 top-3 rounded-full bg-maroon px-3.5 py-1.5 text-[15px] font-semibold text-[#ffd66b] shadow-[0_8px_20px_rgba(61,8,24,0.35)]">
          {rupees(t.price)}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <p className="eyebrow !text-[11px]">{t.category}</p>
        <h3 className="display mt-2 text-[25px] leading-[1.1]">{t.name}</h3>
        <p className="mt-2 text-[14px] leading-5 text-text-2">{t.highlights}</p>
        <p className="mt-3 text-[14px] leading-5 text-text-2">
          <span className="num text-[20px] font-semibold text-maroon">{rupees(t.price)}</span>
          {was ? <s className="num ml-2 text-muted">{rupees(was)}</s> : null}
          <span className="ml-1.5">one time</span>
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[15px] font-semibold text-maroon transition-transform duration-200 group-hover:translate-x-1">
          Try it free
          <ArrowUpRight size={17} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export default async function PricingPage() {
  const { templates, categories } = await getPricedTemplates();
  const prices = templates.map((t) => t.price);
  const low = prices.length ? Math.min(...prices) : 0;
  const onePrice = prices.every((p) => p === low);

  // Designs grouped under their category, in the catalogue's own order; anything unfiled comes last.
  const groups = categories
    .map((c) => ({ ...c, items: templates.filter((t) => t.category_slug === c.slug) }))
    .filter((g) => g.items.length > 0);
  const filed = new Set(groups.flatMap((g) => g.items.map((t) => t.slug)));
  const rest = templates.filter((t) => !filed.has(t.slug));

  return (
    <>
      <SiteHeader />
      <main className="paper-bg">
        {/* The offer */}
        <section className="px-5 pb-10 pt-8 sm:px-6 sm:pt-14">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="text-center lg:text-left">
              <p className="eyebrow">Simple pricing</p>
              <h1 className="display mt-4 text-[44px] leading-[1.02] sm:text-[64px]">
                Design it free. <em>Pay only when you love it.</em>
              </h1>
              <p className="mx-auto mt-5 max-w-[34rem] text-[18px] leading-[30px] text-text-2 lg:mx-0">
                An invitation that opens with animation and music, carries each guest&apos;s name and
                collects their replies. One payment for each invitation, and it is yours.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <LinkButton href="/templates" size="lg" className="btn-glint">
                  Start free
                </LinkButton>
                <LinkButton href="#designs" variant="glass" size="lg">
                  See every design
                </LinkButton>
              </div>
              <p className="mt-4 text-[14px] leading-5 text-muted">No card needed to start. No subscription.</p>
            </div>

            <div className="theme-dark band-maroon relative overflow-hidden rounded-[32px] px-7 py-10 text-center shadow-[0_40px_90px_rgba(107,15,43,0.35)] sm:px-10">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#ffd66b]/15 px-4 py-1.5 text-[13px] font-semibold text-[#ffd66b]">
                <Sparkles size={15} aria-hidden="true" />
                Everything included
              </p>
              <p className="mt-6 text-[15px] font-medium text-text-2">{onePrice ? "Every design" : "Designs from"}</p>
              <p className="num mt-1 text-[84px] font-semibold leading-none text-[#ffd66b] sm:text-[104px]">{rupees(low)}</p>
              <p className="mt-3 text-[17px] leading-7 text-text">one time, for one invitation</p>
              <ul className="mx-auto mt-7 grid max-w-[22rem] gap-2.5 text-left text-[15px] leading-6 text-text">
                {["Animation, music and your photos", "A named link for every guest", "Replies collected for you", "Edit any time, same link"].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <Check size={18} strokeWidth={2.5} className="mt-[3px] shrink-0 text-[#ffd66b]" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
              <LinkButton href="/templates" size="lg" className="btn-glint mt-8 w-full">
                Choose a design
              </LinkButton>
              <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-text-2">
                <Lock size={13} aria-hidden="true" />
                Secure payment by UPI or net banking
              </p>
            </div>
          </div>
        </section>

        {/* What the payment covers */}
        <Section>
          <SectionHead
            eyebrow="What you get"
            title={
              <>
                Everything is <em>in the price</em>
              </>
            }
            sub="There are no add-ons and no tiers. Each invitation you publish includes all of this."
          />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map(([title, text], i) => (
              <li key={title}>
                <Reveal delay={Math.min(i, 3) * 0.05} className="glass h-full rounded-[22px] p-6">
                  <span className="grid size-9 place-items-center rounded-full bg-maroon text-[#ffd66b]">
                    <Check size={18} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-[18px] font-semibold leading-6 text-maroon">{title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-text-2">{text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </Section>

        {/* Every product with its price */}
        <Section id="designs">
          <SectionHead
            eyebrow="Every design"
            title={
              <>
                Pick yours and <em>try it free</em>
              </>
            }
            sub="Tap a design to watch it play and edit it with your own details. The price is charged only when you publish."
          />
          {groups.map((g) => (
            <div key={g.slug} className="mt-14">
              <div className="text-center">
                <h3 className="display text-[32px] leading-[1.1]">
                  {g.emoji ? <span aria-hidden="true">{g.emoji} </span> : null}
                  {g.name}
                </h3>
                {g.blurb ? <p className="mt-2 text-[16px] leading-6 text-text-2">{g.blurb}</p> : null}
              </div>
              <ul className="mt-8 flex flex-wrap justify-center gap-6">
                {g.items.map((t) => (
                  <li key={t.slug} className="flex w-full justify-center sm:w-[300px]">
                    <DesignCard t={t} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {rest.length > 0 && (
            <ul className="mt-14 flex flex-wrap justify-center gap-6">
              {rest.map((t) => (
                <li key={t.slug} className="flex w-full justify-center sm:w-[300px]">
                  <DesignCard t={t} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* How paying works */}
        <Section>
          <SectionHead
            eyebrow="How it works"
            title={
              <>
                You see it finished <em>before you pay</em>
              </>
            }
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <Reveal delay={i * 0.06} className="glass-strong h-full rounded-[24px] p-7">
                  <span className="num grid size-11 place-items-center rounded-full bg-[linear-gradient(180deg,#ffd66b,#f5a300)] text-[20px] font-semibold text-[#3b0a1a]">
                    {i + 1}
                  </span>
                  <h3 className="display mt-5 text-[28px] leading-[1.1]">{title}</h3>
                  <p className="mt-3 text-[16px] leading-[26px] text-text-2">{text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-8 max-w-2xl text-center text-[15px] leading-6 text-text-2">
            We never see your UPI PIN, OTP or bank login. If a payment goes wrong, our{" "}
            <Link href="/refund" className="font-semibold text-maroon underline underline-offset-4">
              refund policy
            </Link>{" "}
            explains exactly what happens.
          </p>
        </Section>

        <Comparison />

        <Section id="pricing-faq">
          <SectionHead
            eyebrow="Before you pay"
            title={
              <>
                Pricing questions, <em>answered</em>
              </>
            }
          />
          <div className="mx-auto mt-12 grid max-w-3xl gap-3">
            {FAQS.map((f) => (
              <details key={f.q} className="glass group rounded-2xl px-6 open:bg-white/80">
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[18px] font-semibold leading-6 text-maroon [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Plus size={20} strokeWidth={2} aria-hidden="true" className="shrink-0 text-seal transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="pb-5 text-[16px] leading-[26px] text-text-2">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        <section className="px-4 pb-20 sm:px-6 lg:pb-28">
          <div className="theme-dark band-maroon mx-auto max-w-6xl rounded-[36px] px-6 py-16 text-center shadow-[0_40px_90px_rgba(107,15,43,0.35)] md:py-24">
            <h2 className="display mx-auto max-w-[40rem] text-[40px] leading-[1.05] sm:text-[56px]">
              Start now. <em>It costs nothing to try.</em>
            </h2>
            <p className="mx-auto mt-5 max-w-[32rem] text-[18px] leading-[30px] text-text-2">
              Make your invitation today and decide when you have seen it with your own names on it.
            </p>
            <div className="mt-9 flex justify-center">
              <LinkButton href="/templates" size="lg" className="btn-glint">
                Start free
              </LinkButton>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileCta />
    </>
  );
}
