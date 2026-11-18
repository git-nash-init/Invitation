import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-(--hairline) px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-[14px] leading-5 text-text-2">
            Interactive wedding invitations you customize, publish and share as a link.
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-16 gap-y-3 text-[14px]">
          <Link href="/templates" className="text-text-2 transition-colors hover:text-text">
            Templates
          </Link>
          <Link href="/#pricing" className="text-text-2 transition-colors hover:text-text">
            Pricing
          </Link>
          <Link href="/privacy" className="text-text-2 transition-colors hover:text-text">
            Privacy
          </Link>
          <Link href="/terms" className="text-text-2 transition-colors hover:text-text">
            Terms
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-[12px] text-muted">
        © {new Date().getFullYear()} SutraLuxe
      </p>
    </footer>
  );
}
