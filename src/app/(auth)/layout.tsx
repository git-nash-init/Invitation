import Image from "next/image";
import { Logo } from "@/components/site/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-bg grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/covers/royale.webp"
          alt="A mandap at dusk from the Royale Gate invitation"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#12110f]/55" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <div className="glass-strong max-w-md rounded-[20px] p-8">
            <p className="display text-[28px] leading-[1.15] text-text">
              One link for the whole guest list, or one for each guest
            </p>
            <p className="mt-4 text-[14px] leading-5 text-text-2">
              Personal links open with the guest&apos;s own name on the gate.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex flex-col px-6 py-8 sm:px-12">
        <div>
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
