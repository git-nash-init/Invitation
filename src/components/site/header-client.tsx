"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Logo } from "./logo";

const LINKS = [
  { href: "/templates", label: "Templates" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#faq", label: "FAQ" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * One header, one size, one place on every page. The page reserves its height
 * (see the spacer) so nothing ever sits underneath it. Scrolling down tucks it
 * away; scrolling up even slightly brings it back; at the very top it is simply
 * the normal header.
 */
export function HeaderClient({ signedIn }: { signedIn: boolean }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    const delta = y - prev;
    if (y < 80) setHidden(false);
    else if (delta > 6) setHidden(true);
    else if (delta < -6) setHidden(false);
  });

  const away = hidden && !open;

  return (
    <>
      {/* Reserves exactly the header's height, so content never starts underneath it. */}
      <div aria-hidden="true" style={{ height: "var(--header-space)" }} />
      <motion.header
        className="fixed inset-x-0 top-0 z-50 px-3 sm:px-6"
        style={{ paddingTop: "var(--header-gap)" }}
        initial={false}
        animate={
          reduce
            ? { opacity: away ? 0 : 1 }
            : { y: away ? "-130%" : "0%", opacity: away ? 0 : 1 }
        }
        transition={{ duration: away ? 0.28 : 0.38, ease: EASE }}
        onFocusCapture={() => setHidden(false)}
        inert={away ? true : undefined}
      >
        <div
          className="glass-strong mx-auto flex max-w-6xl items-center justify-between rounded-[18px] pl-4 pr-2 sm:pl-5"
          style={{ height: "var(--header-h)" }}
        >
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
                <LinkButton href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Log in
                </LinkButton>
                <LinkButton href="/templates" size="sm" className="btn-glint">
                  Start free
                </LinkButton>
              </>
            )}
            <button
              type="button"
              className="btn btn-ghost size-[44px] !p-0 md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              aria-label="Mobile"
              className="glass-strong mx-auto mt-2 grid max-w-6xl gap-1 rounded-[18px] p-2 md:hidden"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: EASE }}
            >
              {[...LINKS, ...(signedIn ? [] : [{ href: "/login", label: "Log in" }])].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost h-12 justify-start text-[16px]"
                >
                  {l.label}
                </Link>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
