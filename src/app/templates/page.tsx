import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TemplateBrowser } from "@/components/landing/template-browser";
import { SectionHead } from "@/components/landing/sections";
import { getTemplates } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Invitation designs",
  description: "Interactive invitation designs for weddings, birthdays, baby showers, naming ceremonies, housewarmings and festive parties. Watch each one play, then make it yours for free.",
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
            sub="Choose a style, hover a design to watch it play, then tap it to see everything inside. Customize it with your own names for free."
          />

          <div className="mt-12">
            <TemplateBrowser templates={templates} priorityCount={3} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
