import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Hero } from "@/components/landing/hero";
import { GuestDemo } from "@/components/landing/guest-demo";
import { MobileCta } from "@/components/landing/mobile-cta";
import { TemplateCard } from "@/components/landing/template-card";
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
import { Reveal } from "@/components/ui/reveal";
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
            sub="Hover a design to watch it play. Tap one to see everything inside."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-6 lg:[&>*]:col-span-2 lg:[&>*:nth-child(4)]:col-start-2">
            {templates.map((t, i) => (
              <Reveal key={t.slug} delay={(i % 3) * 0.06} className="h-full">
                <TemplateCard template={t} priority={i < 3} />
              </Reveal>
            ))}
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
