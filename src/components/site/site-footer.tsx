import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { BUSINESS } from "@/lib/business";
import { Logo } from "./logo";

const COLS = [
  {
    title: "Explore",
    links: [
      { href: "/templates", label: "Templates" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#features", label: "Features" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/refund", label: "Refunds and cancellation" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="theme-dark band-maroon mt-auto px-4 pb-8 pt-16 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo light />
          <p className="deva mt-5 text-[28px] leading-none text-[#ffd66b]">{BRAND.devanagari}</p>
          <p className="mt-3 text-[15px] leading-6 text-text-2">
            Royal interactive wedding invitations. Make yours in minutes and share it as a link, with
            every guest&apos;s name on it.
          </p>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#ffd66b]">{c.title}</p>
            <ul className="mt-4 grid gap-1">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-[44px] items-center text-[15px] text-text-2 transition-colors hover:text-[#ffd66b]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-(--hairline) pt-6 text-[13px] text-muted">
        © {new Date().getFullYear()} {BRAND.name}. Owned and operated by {BUSINESS.owner}. Made with
        care for Indian weddings.
      </p>
    </footer>
  );
}
