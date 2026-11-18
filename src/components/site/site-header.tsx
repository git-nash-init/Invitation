import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/button";
import { Logo } from "./logo";

const LINKS = [
  { href: "/templates", label: "Templates" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="glass-strong mx-auto flex h-14 max-w-6xl items-center justify-between rounded-[16px] pl-5 pr-2">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="btn btn-ghost btn-sm">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {signedIn ? (
            <LinkButton href="/dashboard" size="sm">
              Dashboard
            </LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Log in
              </LinkButton>
              <LinkButton href="/signup" size="sm">
                Create invitation
              </LinkButton>
            </>
          )}
        </div>
      </div>

      {/* Small screens: the links collapse into one menu, no JavaScript needed. */}
      <details className="mx-auto mt-2 max-w-6xl md:hidden">
        <summary className="btn btn-glass btn-sm w-full list-none">Menu</summary>
        <nav aria-label="Mobile" className="glass-strong mt-2 grid gap-1 rounded-[16px] p-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="btn btn-ghost justify-start">
              {l.label}
            </Link>
          ))}
        </nav>
      </details>
    </header>
  );
}
