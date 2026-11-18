import Link from "next/link";
import { LayoutGrid, LogOut, Mail } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { signOut } from "@/lib/auth/actions";

const NAV = [
  { href: "/dashboard", label: "Invitations", icon: Mail },
  { href: "/templates", label: "Templates", icon: LayoutGrid },
];

export function Sidebar({ name, email }: { name: string; email: string }) {
  return (
    <aside className="border-b border-(--hairline) bg-bg-deep lg:sticky lg:top-0 lg:h-screen lg:w-[256px] lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-4 px-4 py-3 lg:flex-col lg:items-stretch lg:gap-0 lg:p-4 lg:h-full">
        <div className="lg:px-2 lg:py-3">
          <Logo />
        </div>

        <nav
          aria-label="Dashboard"
          className="flex gap-1 lg:mt-6 lg:flex-col lg:gap-[2px]"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="btn btn-ghost !h-9 !justify-start gap-[10px] !px-3"
            >
              <item.icon size={16} strokeWidth={1.5} aria-hidden="true" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="hidden lg:mt-auto lg:block">
          <div className="border-t border-(--hairline) px-2 pt-4">
            <p className="truncate text-[14px] leading-5">{name || "Your account"}</p>
            <p className="truncate text-[12px] leading-4 text-muted">{email}</p>
          </div>
          <form action={signOut} className="mt-3">
            <button type="submit" className="btn btn-ghost !h-9 w-full !justify-start gap-[10px] !px-3">
              <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
              Log out
            </button>
          </form>
        </div>

        <form action={signOut} className="lg:hidden">
          <button type="submit" className="btn btn-ghost btn-sm" aria-label="Log out">
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        </form>
      </div>
    </aside>
  );
}
