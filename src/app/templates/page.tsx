import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TemplateCard } from "@/components/landing/template-card";
import { Reveal } from "@/components/ui/reveal";
import { getTemplates } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Templates",
  description: "Five interactive wedding invitation templates. Preview each one, then make it yours.",
};

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <>
      <SiteHeader />
      <main className="paper-bg px-6 pb-24 pt-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="display text-[40px] leading-[1.1] sm:text-[56px]">Templates</h1>
          <p className="mt-4 max-w-[36rem] text-[18px] leading-[28px] text-text-2">
            Open any template and try it the way your guests will. When you find the one, make it
            yours.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t, i) => (
              <Reveal key={t.slug} delay={(i % 3) * 0.05} className="h-full">
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
