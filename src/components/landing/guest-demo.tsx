"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const SAMPLE = ["Aarti Mehra", "Rohan Kapoor", "The Iyer family"];
const EASE = [0.22, 1, 0.36, 1] as const;

/** Type a guest name and watch it appear on the invitation, as it would on a personal link. */
export function GuestDemo() {
  const [name, setName] = useState(SAMPLE[0]);
  const reduce = useReducedMotion();
  const shown = name.trim() || "Your guest";
  const code = "7f3a9c2e41b8";

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <h2 className="display text-[32px] leading-[1.15] sm:text-[40px]">
          Every guest opens an invitation with their own name on it
        </h2>
        <p className="mt-4 max-w-[36rem] text-[18px] leading-[28px] text-text-2">
          Add your guest list and each person gets a personal link. Try it: type a name.
        </p>

        <div className="mt-8 max-w-sm">
          <label htmlFor="demo-name" className="label">
            Guest name
          </label>
          <input
            id="demo-name"
            className="field"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {SAMPLE.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setName(n)}
                className="tag-chip cursor-pointer transition-colors duration-150 hover:bg-[rgba(232,169,59,0.2)]"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The invitation card: the one bright, rich object in this section. */}
      <div className="glass rounded-[20px] p-4">
        <div className="relative overflow-hidden rounded-[12px] bg-[#f1e9d6] px-8 py-12 text-center text-[#2b2118]">
          <svg
            className="mx-auto mb-6 text-[#9c6b1f]"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 21V11a8 8 0 0 1 16 0v10"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
            <path d="M12 3v18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
          <p className="text-[13px] tracking-[0.01em] text-[#6d5a43]">Specially honouring</p>
          <div className="relative mt-2 h-[48px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={shown}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="display absolute inset-x-0 truncate text-[36px] leading-[48px]"
              >
                {shown}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="mx-auto my-6 h-px w-16 bg-[#c9a76a]" />
          <p className="display text-[24px] leading-[1.25]">Ankita &amp; Kaushik</p>
          <p className="num mt-2 text-[13px] text-[#6d5a43]">2 December 2026</p>
        </div>

        <p className="num mt-4 truncate px-2 text-[12px] leading-4 text-muted">
          sutraluxe.com/i/ankita-kaushik/<span className="text-text-2">{code}</span>
        </p>
      </div>
    </div>
  );
}
