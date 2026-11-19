import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Hero } from "@/components/landing/hero";
import { GuestDemo } from "@/components/landing/guest-demo";
import { MobileCta } from "@/components/landing/mobile-cta";
import { TemplateBrowser } from "@/components/landing/template-browser";
import {
  Comparison,
  Faq,
  Features,
  FinalCta,
  HowItWorks,
  Section,
  SectionHead,
  ShareStrip,
  TemplateShowcase,
} from "@/components/landing/sections";
import { getTemplates } from "@/lib/templates";

export default async function Home() {
  const templates = await getTemplates();

  return (
    <>
      <SiteHeader />
      <main>
        <Hero slides={templates.map((t) => ({ slug: t.slug, name: t.name }))} />
        <ShareStrip />

        <Section id="templates">
          <SectionHead
            eyebrow="Choose your design"
            title={
              <>
                Pick the one that <em>feels like you</em>
              </>
            }
            sub="Filter by style, hover a design to watch it play, and tap one to see everything inside."
          />
          <div className="mt-12">
            <TemplateBrowser templates={templates} priorityCount={3} />
          </div>
        </Section>

        <TemplateShowcase templates={templates} />
        <HowItWorks />

        <Section>
          <GuestDemo />
        </Section>

        <Features />
        <Comparison />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <MobileCta />
    </>
  );
}
