import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { Button, LinkButton } from "@/components/ui/button";
import { startInvitation } from "@/lib/invitations/actions";
import { getCurrentUser } from "@/lib/invitations/queries";
import { createClient } from "@/lib/supabase/server";
import { botLink } from "@/lib/telegram";
import { getTemplate } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Open your studio",
  robots: { index: false, follow: false },
};

type Claimed = { entitlement_id: string; template_slug: string; music_track_id: string | null };

// The error messages come from our own database function; anything else is generic.
const KNOWN = new Set(["P0001", "P0002", "22023"]);

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="paper-bg flex min-h-[70vh] items-center justify-center px-4 py-16 sm:px-6">
        <div className="glass-strong w-full max-w-lg rounded-[20px] p-6 sm:p-10">{children}</div>
      </main>
    </>
  );
}

export default async function ClaimPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";
  const bot = botLink();

  if (!/^[A-Za-z0-9_-]{20,128}$/.test(token)) {
    return (
      <Shell>
        <h1 className="display text-[28px] leading-[1.15] sm:text-[32px]">This link is not valid</h1>
        <p className="mt-3 text-[14px] leading-5 text-text-2">
          Open the Telegram bot and tap <b>My purchases</b> to get a fresh link.
        </p>
        {bot && (
          <LinkButton href={bot} className="mt-8 w-full sm:w-auto" size="lg">
            Open Telegram bot
          </LinkButton>
        )}
      </Shell>
    );
  }

  // Sign in first, then come straight back here.
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/claim?t=${token}`)}`);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_entitlement", { p_token: token });

  if (error || !data) {
    const message = error && KNOWN.has(error.code ?? "") ? error.message : "We could not open this link right now.";
    return (
      <Shell>
        <h1 className="display text-[28px] leading-[1.15] sm:text-[32px]">We could not open your studio</h1>
        <p role="alert" className="mt-3 text-[14px] leading-5 text-text-2">
          {message}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {bot && (
            <LinkButton href={bot} size="lg">
              Get a new link
            </LinkButton>
          )}
          <LinkButton href="/dashboard" variant="glass" size="lg">
            My dashboard
          </LinkButton>
        </div>
      </Shell>
    );
  }

  const claimed = data as Claimed;
  const template = await getTemplate(claimed.template_slug);
  const start = startInvitation.bind(null, claimed.template_slug);

  return (
    <Shell>
      <p className="text-[13px] leading-5 text-text-2">Payment confirmed</p>
      <h1 className="display mt-1 text-[32px] leading-[1.1] sm:text-[40px]">
        {template ? template.name : "Your template"} is unlocked
      </h1>
      <ol className="mt-6 grid gap-3 text-[15px] leading-6">
        <li className="flex gap-3">
          <span className="num text-seal">01</span>
          <span>Customize names, dates, venues and photos right on the invitation</span>
        </li>
        <li className="flex gap-3">
          <span className="num text-seal">02</span>
          <span>Publish it to get your link</span>
        </li>
        <li className="flex gap-3">
          <span className="num text-seal">03</span>
          <span>Share it with each friend by WhatsApp, Instagram, Telegram or SMS</span>
        </li>
      </ol>
      <form action={start} className="mt-8">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Start customizing
        </Button>
      </form>
      <p className="mt-6 text-[13px] leading-5 text-muted">
        Already started?{" "}
        <Link href="/dashboard" className="link">
          Go to your dashboard
        </Link>
      </p>
    </Shell>
  );
}
