import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarHeart,
  CheckCheck,
  Link2,
  Lock,
  MessageCircle,
  Music,
  PenLine,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { CheckoutButton } from "@/components/studio/checkout-button";
import { LazyVideo } from "@/components/ui/lazy-video";
import { LoadingIframe } from "@/components/ui/loading-iframe";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { mintAssetToken } from "@/lib/asset-token";
import { BRAND } from "@/lib/brand";
import { cashfreeKeys } from "@/lib/cashfree";
import { buildPlatformHash } from "@/lib/invitations/payload";
import { getMyInvitation } from "@/lib/invitations/queries";
import { SHOWCASE, previewCover, previewVideo } from "@/lib/showcase";
import { createClient } from "@/lib/supabase/server";
import { getPricedTemplate } from "@/lib/templates";

export const metadata: Metadata = { title: "Publish your invitation", robots: { index: false } };

const UNLOCKS = [
  { icon: Link2, title: "Your own shareable link", text: "One link for your whole guest list, live the moment you publish." },
  { icon: UserRound, title: "A personal link for every guest", text: "Each friend opens it with their own name on the invitation." },
  { icon: MessageCircle, title: "Ready-made messages", text: "Send on WhatsApp, Instagram, Telegram or SMS with the name filled in." },
  { icon: CheckCheck, title: "RSVPs in one place", text: "See who is coming, how many, and every note they leave." },
  { icon: Music, title: "Music and animation", text: "The full opening, the music and every interaction, without the preview watermark." },
  { icon: PenLine, title: "Edit any time", text: "Change a time or venue later. The same link updates for everyone." },
];

const steps = (partner: string) => [
  ["Pay securely", `UPI, cards, netbanking or wallets, through ${partner}.`],
  ["It goes live", "Your invitation is published on its own link straight away."],
  ["Send it to everyone", "Pick a message, add friends' names and share in a tap."],
];

const faq = (partner: string) => [
  {
    q: "Is this a subscription?",
    a: "No. It is a one-time payment for this invitation. There is nothing to renew and no hidden charge.",
  },
  {
    q: "Which payment methods can I use?",
    a: `UPI (Google Pay, PhonePe, Paytm), debit and credit cards, netbanking and wallets. Payment is handled by ${partner}, so we never see your card or bank details.`,
  },
  {
    q: "Can I still edit after I pay?",
    a: "Yes, as often as you like. Your changes go live on the same link.",
  },
  {
    q: "What if something goes wrong?",
    a: "Write to us from the contact page and we will sort it out. Our refund and cancellation policy is on the Refunds page.",
  },
];

export default async function PublishPage({ params, searchParams }: PageProps<"/studio/[id]/publish">) {
  const { id } = await params;
  const cfOrder = (await searchParams).cf_order;
  // Set when a bank or UPI app sends the customer back here after a Cashfree payment.
  const resumeOrderId = typeof cfOrder === "string" && z.string().uuid().safeParse(cfOrder).success ? cfOrder : undefined;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const invitation = await getMyInvitation(id);
  if (!invitation) notFound();
  if (invitation.status === "published") redirect(`/dashboard/${id}/guests`);

  const template = await getPricedTemplate(invitation.template_slug);
  if (!template) notFound();

  const supabase = await createClient();
  const { count: paidCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("invitation_id", id)
    .eq("status", "paid");
  const { data: premiumFlag } = await supabase.rpc("is_premium");
  const premium = premiumFlag === true;
  const paid = premium || (paidCount ?? 0) > 0;

  const token = mintAssetToken(template.slug, 3600);
  const hash = buildPlatformHash({ status: "published", config: invitation.config, commonLink: true, guestName: null });
  const info = SHOWCASE[template.slug];
  const price = template.price;
  const was = template.list_price && template.list_price > price ? template.list_price : null;
  const useCashfree = cashfreeKeys() !== null;
  const partner = useCashfree ? "Cashfree Payments" : "Razorpay";
  const askPhone = useCashfree && !paid;
  const STEPS = steps(partner);
  const FAQ = faq(partner);
  const off = was ? Math.round(((was - price) / was) * 100) : 0;

  return (
    <div className="paper-bg min-h-screen">
      <header className="glass-strong sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-x-0 border-t-0 px-4 sm:px-6">
        <Logo />
        <Link href={`/studio/${id}`} className="btn btn-glass btn-sm">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          Back to editing
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-28 pt-10 sm:px-6">
        <div className="mx-auto max-w-[44rem] text-center">
          <p className="eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            One step left
          </p>
          <h1 className="display mt-4 text-[42px] leading-[1.04] sm:text-[60px]">
            Your invitation looks <em>beautiful</em>. Let&apos;s send it.
          </h1>
          <p className="mx-auto mt-5 max-w-[36rem] text-[18px] leading-[30px] text-text-2">
            You have already done the hard part. Publish it to get your link, then send it to every guest with their own name on it.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-[auto_1fr] lg:gap-16">
          {/* Their own invitation, live */}
          <div className="mx-auto w-full max-w-[320px]">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-[-10%] -z-10 rounded-[60px] bg-[radial-gradient(closest-side,rgba(255,214,107,0.6),transparent_75%)] blur-xl"
              />
              <PhoneFrame className="drop-shadow-[0_30px_50px_rgba(107,15,43,0.35)]">
                <LoadingIframe
                  src={`/t/${token}/${template.slug}/${hash}`}
                  title="Your invitation"
                  label="Opening your invitation"
                  hideScrollbars
                  className="absolute inset-0 h-full w-full border-0 bg-black"
                />
              </PhoneFrame>
            </div>
            <p className="mt-5 text-center text-[14px] text-text-2">This is your own invitation, with your names.</p>
          </div>

          {/* The one place a price is shown */}
          <div className="theme-dark band-maroon relative overflow-hidden rounded-[32px] p-7 shadow-[0_40px_90px_rgba(107,15,43,0.4)] sm:p-10">
            <p className="eyebrow !justify-start">{template.name}</p>
            <h2 className="display mt-3 text-[34px] leading-[1.08] sm:text-[42px]">
              Publish and share, <em>all in one go</em>
            </h2>

            {premium ? (
              <>
                <p className="mt-7 flex items-center gap-3 text-[34px] font-semibold leading-none text-[#ffd66b]">
                  <BadgeCheck size={34} strokeWidth={1.9} aria-hidden="true" />
                  Premium member
                </p>
                <p className="mt-3 text-[16px] leading-6 text-text-2">
                  Every design is included in your premium membership. Publish this one at no charge.
                </p>
              </>
            ) : (
              <>
                <div className="mt-7 flex flex-wrap items-end gap-x-4 gap-y-1">
                  <p className="num text-[64px] font-semibold leading-none text-[#ffd66b]">₹{price.toLocaleString("en-IN")}</p>
                  {was && (
                    <p className="pb-2 text-[22px] text-text-2">
                      <s className="num">₹{was.toLocaleString("en-IN")}</s>
                      <span className="ml-3 rounded-full bg-[#ffd66b] px-3 py-1 align-middle text-[13px] font-bold text-[#3b0a1a]">
                        {off}% off
                      </span>
                    </p>
                  )}
                </div>
                <p className="mt-3 text-[16px] leading-6 text-text-2">
                  One-time payment for this invitation. No subscription, no hidden charges.
                </p>
              </>
            )}

            <ul className="mt-7 grid gap-3 text-[16px] leading-6">
              {["Live on your own link right away", "Personal links and messages for every guest", "RSVPs, music and animation included", "Edit any time, the link never changes"].map((x) => (
                <li key={x} className="flex items-start gap-3">
                  <BadgeCheck size={21} strokeWidth={1.9} className="mt-0.5 shrink-0 text-[#ffd66b]" aria-hidden="true" />
                  {x}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {paid ? (
                <CheckoutButton invitationId={id} label="Publish my invitation" description={`${template.name} invitation`} />
              ) : (
                <CheckoutButton
                  invitationId={id}
                  label={`Pay ₹${price.toLocaleString("en-IN")} and publish`}
                  description={`${template.name} invitation`}
                  askPhone={askPhone}
                  resumeOrderId={resumeOrderId}
                />
              )}
            </div>

            {!premium && (
              <div className="mt-6 grid gap-2 text-[14px] text-text-2">
                <p className="flex items-center gap-2.5">
                  <ShieldCheck size={18} strokeWidth={1.9} className="shrink-0 text-[#ffd66b]" aria-hidden="true" />
                  Secure payment by {partner}: UPI, cards, netbanking, wallets
                </p>
                <p className="flex items-center gap-2.5">
                  <Lock size={17} strokeWidth={1.9} className="shrink-0 text-[#ffd66b]" aria-hidden="true" />
                  We never see your card or bank details
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Why it is worth it */}
        <section className="mt-28">
          <div className="mx-auto max-w-[40rem] text-center">
            <p className="eyebrow">What you unlock</p>
            <h2 className="display mt-4 text-[38px] leading-[1.06] sm:text-[50px]">
              Everything a guest, and <em>you</em>, will need
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {UNLOCKS.map((u) => (
              <div key={u.title} className="glass rounded-[28px] p-7">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#ffd66b] to-[#f5a300] text-[#3b0a1a] shadow-[0_10px_22px_rgba(245,163,0,0.35)]">
                  <u.icon size={23} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <h3 className="display mt-5 text-[24px] leading-[1.12]">{u.title}</h3>
                <p className="mt-2 text-[16px] leading-[26px] text-text-2">{u.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* A real use and the design in motion */}
        <section className="mt-28 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow !justify-start">
              <CalendarHeart size={15} aria-hidden="true" />
              How couples use it
            </p>
            <h2 className="display mt-4 text-[36px] leading-[1.08] sm:text-[46px]">
              From &ldquo;I have the link&rdquo; to <em>everyone replied</em>
            </h2>
            {info && <p className="mt-5 text-[18px] leading-[30px] text-text-2">{info.useCase}</p>}
            <ol className="mt-8 grid gap-5">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="deva grid size-11 shrink-0 place-items-center rounded-full bg-maroon text-[24px] leading-none text-[#ffd66b]">
                    {["१", "२", "३"][i]}
                  </span>
                  <span>
                    <b className="block text-[17px] font-semibold text-maroon">{t}</b>
                    <span className="text-[16px] leading-6 text-text-2">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mx-auto w-full max-w-[280px]">
            <PhoneFrame className="drop-shadow-[0_30px_50px_rgba(107,15,43,0.35)]">
              <LazyVideo
                src={previewVideo(template.slug)}
                poster={previewCover(template.slug)}
                label={`${template.name} invitation playing`}
                className="h-full w-full object-cover"
              />
            </PhoneFrame>
          </div>
        </section>

        {/* Final nudge */}
        <section className="mt-28">
          <div className="theme-dark band-maroon mx-auto max-w-3xl rounded-[32px] px-7 py-12 text-center shadow-[0_40px_90px_rgba(107,15,43,0.35)] sm:px-12">
            <p className="deva text-[30px] leading-none text-[#ffd66b]">{BRAND.devanagari}</p>
            <h2 className="display mt-4 text-[34px] leading-[1.08] sm:text-[44px]">
              Be the <em>first</em> to send it
            </h2>
            <p className="mx-auto mt-3 max-w-[30rem] text-[17px] leading-7 text-text-2">
              Your guests are waiting for this invitation. Publish it and send it today.
            </p>
            <div className="mx-auto mt-8 max-w-sm">
              <CheckoutButton
                invitationId={id}
                label={paid ? "Publish my invitation" : `Pay ₹${price.toLocaleString("en-IN")} and publish`}
                description={`${template.name} invitation`}
                askPhone={askPhone}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-3xl">
          <h2 className="display text-center text-[34px] leading-[1.1] sm:text-[42px]">Before you pay</h2>
          <div className="mt-8 grid gap-3">
            {FAQ.map((f) => (
              <details key={f.q} className="glass group rounded-2xl px-6 open:bg-white/80">
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold leading-6 text-maroon [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Plus size={20} strokeWidth={2} aria-hidden="true" className="shrink-0 text-seal transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="pb-5 text-[16px] leading-[26px] text-text-2">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-[14px] text-text-2">
            <Link href="/refund" className="link">
              Refunds and cancellation
            </Link>
            {" · "}
            <Link href="/terms" className="link">
              Terms
            </Link>
            {" · "}
            <Link href="/contact" className="link">
              Contact us
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
