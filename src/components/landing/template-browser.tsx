"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Template } from "@/lib/templates";
import { FILTERS, TEMPLATE_GROUPS } from "@/lib/showcase";
import { TemplateCard } from "./template-card";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Every design, with style buttons on top. Choosing a style shows all the designs in it.
 * Cards are centred, so a last, lone card never sits in a corner.
 */
export function TemplateBrowser({
  templates,
  priorityCount = 0,
  heading,
}: {
  templates: Template[];
  priorityCount?: number;
  heading?: string;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string>("all");
  const statusId = useId();

  const groups = FILTERS.map((f) => ({
    ...f,
    count: templates.filter((t) => (TEMPLATE_GROUPS[t.slug] ?? []).includes(f.id)).length,
  })).filter((f) => f.count > 0);

  const shown =
    active === "all" ? templates : templates.filter((t) => (TEMPLATE_GROUPS[t.slug] ?? []).includes(active));

  const chip = (id: string, label: string, count: number) => {
    const on = active === id;
    return (
      <button
        key={id}
        type="button"
        aria-pressed={on}
        aria-describedby={statusId}
        onClick={() => setActive(id)}
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-colors duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rose ${
          on
            ? "bg-maroon text-[#ffd66b] shadow-[0_10px_24px_rgba(107,15,43,0.28)]"
            : "border border-[rgba(183,121,31,0.4)] bg-white/70 text-maroon hover:bg-white"
        }`}
      >
        {label}
        <span
          className={`grid min-w-6 place-items-center rounded-full px-1.5 text-[12px] leading-6 ${
            on ? "bg-[#ffd66b]/20 text-[#ffd66b]" : "bg-[rgba(107,15,43,0.08)] text-maroon"
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div>
      {groups.length > 1 && (
        <div role="group" aria-label={heading ?? "Filter designs by style"} className="flex flex-wrap justify-center gap-2.5">
          {chip("all", "All designs", templates.length)}
          {groups.map((g) => chip(g.id, g.label, g.count))}
        </div>
      )}
      <p id={statusId} className="sr-only" role="status" aria-live="polite">
        Showing {shown.length} {shown.length === 1 ? "design" : "designs"}
      </p>

      <motion.ul layout={!reduce} className="mt-10 flex flex-wrap justify-center gap-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((t, i) => (
            <motion.li
              key={t.slug}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : Math.min(i, 4) * 0.04 }}
              className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
            >
              <TemplateCard template={t} priority={i < priorityCount} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
