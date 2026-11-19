import Image from "next/image";
import { Logo } from "@/components/site/logo";
import { BRAND } from "@/lib/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-bg grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="theme-dark relative hidden overflow-hidden lg:block">
        <Image
          src="/images/hero-haveli.jpg"
          alt="A marigold-draped marble pavilion by a lake at golden hour"
          fill
          priority
          sizes="50vw"
          className="object-cover object-[62%_50%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3d0818]/85 via-[#3d0818]/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="deva text-[34px] leading-none text-[#ffd66b]">{BRAND.devanagari}</p>
          <p className="display mt-4 max-w-md text-[40px] leading-[1.05]">
            Make the <em>first</em> impression a beautiful one
          </p>
          <p className="mt-4 max-w-md text-[17px] leading-7 text-text-2">
            Design your invitation for free. One link for the whole guest list, or one for each guest with their own name.
          </p>
        </div>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-12">
        <div>
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">{children}</div>
      </main>
    </div>
  );
}
