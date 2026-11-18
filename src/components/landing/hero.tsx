import Image from "next/image";
import { LinkButton } from "@/components/ui/button";
import { Enter } from "@/components/ui/reveal";

export function Hero() {
  return (
    <section className="relative -mt-[120px] min-h-[100svh] overflow-hidden md:-mt-[72px]">
      {/* The scene carries the colour; the headline sits on its calm left half. */}
      <Image
        src="/images/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#12110f]/80 via-[#12110f]/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg to-transparent" />

      <div className="relative mx-auto grid min-h-[100svh] max-w-6xl grid-cols-1 gap-12 px-6 pb-16 pt-[168px] md:pt-[136px] lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:pb-0 lg:pt-[160px]">
        <div className="max-w-[40rem]">
          <Enter>
            <h1 className="display text-[40px] leading-[1.05] sm:text-[56px] lg:text-[64px]">
              Make your wedding invitation, then share it as a link
            </h1>
          </Enter>
          <Enter delay={0.06}>
            <p className="mt-6 max-w-[36rem] text-[18px] leading-[28px] text-text-2">
              Choose an interactive template, add your names, dates and photos, and publish. Send
              one link to everyone, or a personal link for each guest.
            </p>
          </Enter>
          <Enter delay={0.12}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <LinkButton href="/signup" size="lg">
                Create invitation
              </LinkButton>
              <LinkButton href="/templates" variant="glass" size="lg">
                Browse templates
              </LinkButton>
            </div>
          </Enter>
        </div>

        {/* The product, rising past the bottom edge: a real template, running live. */}
        <Enter delay={0.2} className="relative flex justify-center lg:justify-end lg:self-end">
          <div className="glass-strong w-[300px] rounded-[40px] p-2 lg:translate-y-[18%]">
            <iframe
              src="/templates/royale/"
              title="Live preview of the Royale Gate invitation"
              loading="eager"
              allow="autoplay"
              className="block h-[560px] w-full rounded-[32px] border-0 bg-black lg:h-[640px]"
            />
          </div>
        </Enter>
      </div>
    </section>
  );
}
