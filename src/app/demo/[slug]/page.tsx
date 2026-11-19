import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { DemoFrame } from "@/components/invitation/demo-frame";
import { LinkButton } from "@/components/ui/button";
import { mintAssetToken } from "@/lib/asset-token";
import { BRAND } from "@/lib/brand";
import { rateLimit } from "@/lib/security";
import { getTemplate } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Live preview",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const DEMO_SECONDS = 10 * 60;
const nowMs = () => Date.now();

/**
 * A public, ten-minute preview of the real template with the template's own sample names.
 * Every load is rate limited per visitor address, and the signed link inside expires with the page.
 */
export default async function DemoPage({ params }: PageProps<"/demo/[slug]">) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) notFound();
  const template = await getTemplate(slug);
  if (!template) notFound();

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`demo:${ip}`, 12, 10 * 60_000)) {
    return (
      <main className="paper-bg flex min-h-screen items-center justify-center px-4">
        <div className="glass-strong w-full max-w-md rounded-[28px] p-8 text-center">
          <h1 className="display text-[34px] leading-[1.1]">Take a short break</h1>
          <p className="mt-3 text-[16px] leading-6 text-text-2">
            You have opened a lot of previews. Try again in a few minutes, or customize a design now.
          </p>
          <LinkButton href={`/preview/${template.slug}`} size="lg" className="mt-8 w-full">
            Back to {template.name}
          </LinkButton>
        </div>
      </main>
    );
  }

  const assetToken = mintAssetToken(template.slug, DEMO_SECONDS);
  // No platform payload on purpose. Without one the template runs in its own stand-alone mode, which
  // is how a shopper is meant to see it: sample names and dates, and the whole sample gallery.
  // With a payload it switches to guest mode and hides every frame that has no photo, which left
  // the hanging-frames rail with two cards and nothing to scroll.

  return (
    <DemoFrame
      src={`/t/${assetToken}/${template.slug}/`}
      mark={BRAND.watermark}
      expiresAtMs={nowMs() + DEMO_SECONDS * 1000}
      designHref={`/preview/${template.slug}`}
      designName={template.name}
    />
  );
}
