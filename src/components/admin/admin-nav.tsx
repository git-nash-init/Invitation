"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, LayoutGrid, Music2, ReceiptText, Users } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/templates", label: "Templates", icon: LayoutGrid },
  { href: "/admin/music", label: "Music", icon: Music2 },
  { href: "/admin/users", label: "People", icon: Users },
  { href: "/admin/setup", label: "Payments setup", icon: CreditCard },
];

/** A side list on desktop; a swipeable row of tabs on phones. */
export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:gap-[2px] lg:overflow-visible lg:px-0 lg:pb-0">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`btn !h-10 shrink-0 !justify-start gap-[10px] !px-3 lg:!h-9 ${active ? "btn-glass" : "btn-ghost"}`}
          >
            <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
