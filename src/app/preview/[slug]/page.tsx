import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button, LinkButton } from "@/components/ui/button";
import { startInvitation } from "@/lib/invitations/actions";
import { getCurrentUser } from "@/lib/invitations/queries";
import { botLink } from "@/lib/telegram";
import { getTemplate, hasCredit } from "@/lib/templates";

export async function generateMetadata({ params }: PageProps<"/preview/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = /^[a-z0-9-]{2,40}$/.test(slug) ? await getTemplate(slug) : null;
  return { title: t ? t.name : "Template" };
}

export default async function PreviewPage({
  params,
  searchParams,
}: PageProps<"/preview/[slug]"> & { searchParams: Promise<{ buy?: string }> }) {
  const { slug } = await params;
  const { buy } = await searchParams;
  const template = /^[a-z0-9-]{2,40}$/.test(slug) ? await getTemplate(slug) : null;
  if (!template) notFound();

  const user = await getCurrentUser();
  const credit = user ? await hasCredit(template.slug) : false;
  const bot = botLink(template.slug);
  const start = startInvitation.bind(null, template.slug);

  return (
    <>
      <SiteHeader />
      <main className="paper-bg px-4 pb-24 pt-10 sm:px-6 sm:pt-12">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1fr_auto] lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <p className="text-[13px] leading-5 text-text-2">{template.category}</p>
            <h1 className="display mt-2 text-[36px] leading-[1.1] sm:text-[56px]">{template.name}</h1>
            <p className="mt-5 max-w-[32rem] text-[16px] leading-[26px] text-text-2 sm:text-[18px] sm:leading-[28px]">
              {template.tagline}
            </p>
            <ul className="mt-6 grid gap-2 text-[15px] leading-6">
              {template.bullets.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="text-seal" aria-hidden="true">
                    ✦
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            {buy === "1" && !credit && (
              <p role="status" className="glass mt-6 rounded-[12px] p-4 text-[14px] leading-5 text-text-2">
                You need to buy this template first. After you pay in Telegram you get a link that opens your studio here.
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              {credit ? (
                <form action={start}>
                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    Start customizing
                  </Button>
                </form>
              ) : bot ? (
                <LinkButton href={bot} target="_blank" rel="noopener noreferrer" size="lg" className="w-full sm:w-auto">
                  Buy ₹{template.price} on Telegram
                </LinkButton>
              ) : (
                <LinkButton href="/#pricing" size="lg" className="w-full sm:w-auto">
                  See pricing
                </LinkButton>
              )}
              <p className="num text-[13px] text-muted">₹{template.price} · one invitation</p>
            </div>
          </div>

          <div className="glass-strong mx-auto w-full max-w-[340px] rounded-[44px] p-[10px]">
            <div className="relative h-[560px] w-full overflow-hidden rounded-[34px] bg-black sm:h-[640px]">
              <Image
                src={template.cover_path}
                alt={`${template.name} invitation`}
                fill
                priority
                sizes="340px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
