import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Hero } from "@/components/landing/hero";
import { GuestDemo } from "@/components/landing/guest-demo";
import { TemplateCard } from "@/components/landing/template-card";
import {
  Comparison,
  Faq,
  Features,
  FinalCta,
  HowItWorks,
  Pricing,
  Section,
  SectionHead,
} from "@/components/landing/sections";
import { Reveal } from "@/components/ui/reveal";
import { getTemplates } from "@/lib/templates";

export default async function Home() {
  const templates = await getTemplates();

  return (
    <>
      <SiteHeader />
      <main className="paper-bg">
        <Hero />

        <HowItWorks />

        <Section>
          <GuestDemo />
        </Section>

        <Section id="templates">
          <SectionHead
            title="Five templates, each one interactive"
            sub="Tap one to see what it includes, then watch a private preview in our Telegram bot."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t, i) => (
              <Reveal key={t.slug} delay={(i % 3) * 0.05} className="h-full">
                <TemplateCard template={t} />
              </Reveal>
            ))}
          </div>
        </Section>

        <Features />
        <Pricing />
        <Comparison />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
