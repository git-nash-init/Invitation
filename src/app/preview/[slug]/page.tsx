import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { startInvitation } from "@/lib/invitations/actions";
import { getTemplate } from "@/lib/templates";

export async function generateMetadata({ params }: PageProps<"/preview/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = /^[a-z0-9-]{2,40}$/.test(slug) ? await getTemplate(slug) : null;
  return { title: t ? t.name : "Template" };
}

export default async function PreviewPage({ params }: PageProps<"/preview/[slug]">) {
  const { slug } = await params;
  const template = /^[a-z0-9-]{2,40}$/.test(slug) ? await getTemplate(slug) : null;
  if (!template) notFound();

  const start = startInvitation.bind(null, template.slug);

  return (
    <>
      <SiteHeader />
      <main className="paper-bg px-6 pb-24 pt-12">
        <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[1fr_auto] lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <p className="text-[13px] leading-5 text-text-2">{template.category}</p>
            <h1 className="display mt-2 text-[40px] leading-[1.1] sm:text-[56px]">
              {template.name}
            </h1>
            <p className="mt-6 max-w-[32rem] text-[18px] leading-[28px] text-text-2">
              {template.tagline}
            </p>
            <p className="num mt-4 text-[13px] text-muted">{template.highlights}</p>

            <form action={start} className="mt-10">
              <Button type="submit" size="lg">
                Use this template
              </Button>
            </form>
            <p className="mt-4 max-w-[28rem] text-[13px] leading-5 text-muted">
              This is a live preview with sample names. Tap through it the way a guest would.
            </p>
          </div>

          <div className="glass-strong mx-auto w-[340px] rounded-[44px] p-[10px]">
            <iframe
              src={`/templates/${template.slug}/`}
              title={`Live preview of ${template.name}`}
              allow="autoplay"
              className="block h-[680px] w-full rounded-[34px] border-0 bg-black"
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
