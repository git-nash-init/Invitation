import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { SealTick } from "@/components/icons";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TemplateBrowser } from "@/components/landing/template-browser";
import { SectionHead } from "@/components/landing/sections";
import { Button, LinkButton } from "@/components/ui/button";
import { LazyVideo } from "@/components/ui/lazy-video";
import { startInvitation } from "@/lib/invitations/actions";
import { getCurrentUser } from "@/lib/invitations/queries";
import { SHOWCASE, previewCover, previewPoster, previewStill, previewVideo } from "@/lib/showcase";
import { getTemplate, getTemplates } from "@/lib/templates";

const validSlug = (slug: string) => /^[a-z0-9-]{2,40}$/.test(slug);

export async function generateMetadata({ params }: PageProps<"/preview/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = validSlug(slug) ? await getTemplate(slug) : null;
  return {
    title: t ? t.name : "Design",
    description: t ? `${t.tagline} Customize it free with your own names, dates and photos.` : undefined,
    openGraph: t ? { images: [previewCover(t.slug)] } : undefined,
  };
}

export default async function PreviewPage({
  params,
  searchParams,
}: PageProps<"/preview/[slug]"> & { searchParams: Promise<{ start?: string }> }) {
  const { slug } = await params;
  const { start } = await searchParams;
  // Independent lookups run together, not one after the other.
  const [template, all] = await Promise.all([
    validSlug(slug) ? getTemplate(slug) : Promise.resolve(null),
    getTemplates(),
  ]);
  if (!template) notFound();

  // Returning from sign-in with ?start=1: carry on into the editor without a second click.
  if (start === "1" && (await getCurrentUser())) await startInvitation(template.slug);

  const info = SHOWCASE[template.slug];
  const others = all.filter((t) => t.slug !== template.slug);
  const begin = startInvitation.bind(null, template.slug);

  return (
    <>
      <SiteHeader />
      <main className="paper-bg px-5 pb-24 pt-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Link href="/templates" className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-maroon">
            <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
            All designs
          </Link>

          <div className="mt-4 grid items-start gap-12 lg:grid-cols-[auto_1fr] lg:gap-20">
            <div className="lg:sticky lg:top-[calc(var(--header-space)+8px)]">
              <div className="relative mx-auto w-full max-w-[320px]">
                <div
                  aria-hidden="true"
                  className="absolute inset-[-10%] -z-10 rounded-[60px] bg-[radial-gradient(closest-side,rgba(255,214,107,0.6),transparent_75%)] blur-xl"
                />
                <div className="rounded-[44px] bg-gradient-to-b from-[#5a0f27] to-[#2a0610] p-[10px] shadow-[0_34px_80px_rgba(107,15,43,0.38),0_0_0_1.5px_rgba(255,214,107,0.55)]">
                  <div className="relative aspect-[9/17.4] overflow-hidden rounded-[35px] bg-[#fdf3e0]">
                    <LazyVideo
                      src={previewVideo(template.slug)}
                      poster={previewPoster(template.slug)}
                      label={`${template.name} invitation playing`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-6 flex max-w-[320px] justify-center gap-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="relative aspect-[9/16] w-[84px] overflow-hidden rounded-xl ring-1 ring-[rgba(183,121,31,0.4)]"
                  >
                    <Image src={previewStill(template.slug, n)} alt={`${template.name} screen ${n}`} fill sizes="84px" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow !justify-start">{template.category}</p>
              <h1 className="display mt-4 text-[44px] leading-[1.03] sm:text-[64px]">{template.name}</h1>
              {info && <p className="mt-3 text-[19px] italic text-seal">{info.feel}</p>}
              <p className="mt-6 max-w-[36rem] text-[19px] leading-[31px] text-text-2">{template.tagline}</p>

              <ul className="mt-8 grid gap-3.5">
                {template.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-[17px] leading-6">
                    <SealTick size={24} className="mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              {info && (
                <div className="glass mt-8 max-w-[36rem] rounded-2xl p-6">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-crimson">A real use</p>
                  <p className="mt-2 text-[17px] leading-[27px]">{info.useCase}</p>
                </div>
              )}

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <form action={begin}>
                  <Button type="submit" size="lg" className="btn-glint w-full sm:w-auto">
                    Customize free
                  </Button>
                </form>
                <LinkButton href={`/demo/${template.slug}`} variant="glass" size="lg" className="w-full sm:w-auto">
                  <Eye size={18} strokeWidth={2} aria-hidden="true" />
                  Open live preview
                </LinkButton>
              </div>
              <p className="mt-4 text-[15px] text-text-2">
                Add your own names, dates and photos for free. Nothing is shared until you publish.
              </p>

              <div className="mt-12 grid max-w-[36rem] gap-3 sm:grid-cols-2">
                {[
                  "A personal link for every guest",
                  "RSVPs collected for you",
                  "Music when it opens",
                  "Share on WhatsApp, Instagram, SMS",
                ].map((x) => (
                  <p key={x} className="flex items-center gap-2.5 text-[15px] font-medium">
                    <SealTick size={20} className="shrink-0" />
                    {x}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {others.length > 0 && (
            <section className="mt-28">
              <SectionHead
                eyebrow="More designs"
                title={
                  <>
                    Every other design, <em>one tap away</em>
                  </>
                }
                sub="Choose a style to see all the designs in it."
              />
              <div className="mt-12">
                <TemplateBrowser templates={others} />
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
