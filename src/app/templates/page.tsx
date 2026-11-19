import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TemplateCard } from "@/components/landing/template-card";
import { SectionHead } from "@/components/landing/sections";
import { Reveal } from "@/components/ui/reveal";
import { getTemplates } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Wedding invitation designs",
  description: "Five royal interactive wedding invitation designs. Watch each one play, then make it yours for free.",
};

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <>
      <SiteHeader />
      <main className="paper-bg px-5 pb-24 pt-8 sm:px-6 sm:pt-12">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="All designs"
            title={
              <>
                Choose the invitation that <em>feels like you</em>
              </>
            }
            sub="Hover a design to watch it play. Tap one to see everything inside, then customize it with your own names for free."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-6 lg:[&>*]:col-span-2 lg:[&>*:nth-child(4)]:col-start-2">
            {templates.map((t, i) => (
              <Reveal key={t.slug} delay={(i % 3) * 0.06} className="h-full">
                <TemplateCard template={t} priority={i < 3} />
              </Reveal>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
