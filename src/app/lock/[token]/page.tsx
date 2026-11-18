import type { Metadata } from "next";
import { DemoFrame } from "@/components/invitation/demo-frame";
import { LinkButton } from "@/components/ui/button";
import { mintAssetToken } from "@/lib/asset-token";
import { buildPlatformHash } from "@/lib/invitations/payload";
import { createClient } from "@/lib/supabase/server";
import { botLink } from "@/lib/telegram";

export const metadata: Metadata = {
  title: "Private demo",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Demo = { template_slug: string; tg_name: string; expires_at: string };

// Evaluated on each request; kept out of the component body for the purity lint.
const msLeft = (expiresAt: string) => new Date(expiresAt).getTime() - Date.now();

function Ended() {
  const bot = botLink();
  return (
    <main className="paper-bg flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong w-full max-w-md rounded-[20px] p-8 text-center">
        <h1 className="display text-[28px] leading-[1.15]">This demo has ended</h1>
        <p className="mt-3 text-[14px] leading-5 text-text-2">Demo links work for a few minutes and a few views. Ask the Telegram bot for a new one.</p>
        {bot && (
          <LinkButton href={bot} size="lg" className="mt-8 w-full">
            Open Telegram bot
          </LinkButton>
        )}
      </div>
    </main>
  );
}

export default async function DemoPage({ params }: PageProps<"/lock/[token]">) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(token)) return <Ended />;

  const supabase = await createClient();
  const { data } = await supabase.rpc("consume_preview_token", { p_token: token });
  if (!data) return <Ended />;

  const demo = data as Demo;
  const remaining = Math.floor(msLeft(demo.expires_at) / 1000);
  if (remaining < 20) return <Ended />;

  const assetToken = mintAssetToken(demo.template_slug, Math.min(remaining, 15 * 60));
  // Sample names and dates only: the template's own defaults, shown as a guest would see them.
  const hash = buildPlatformHash({ status: "published", config: {}, commonLink: true, guestName: null });

  return (
    <DemoFrame
      src={`/t/${assetToken}/${demo.template_slug}/${hash}`}
      viewerName={demo.tg_name || "Guest"}
      expiresAtMs={new Date(demo.expires_at).getTime()}
      botUrl={botLink()}
    />
  );
}
