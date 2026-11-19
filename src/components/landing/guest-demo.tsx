"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BRAND } from "@/lib/brand";

const SAMPLE = ["Aarti Mehra", "Rohan Kapoor", "The Iyer family"];
const EASE = [0.22, 1, 0.36, 1] as const;

/** Type a guest name and watch it appear on the invitation, as it would on a personal link. */
export function GuestDemo() {
  const [name, setName] = useState(SAMPLE[0]);
  const reduce = useReducedMotion();
  const shown = name.trim() || "Your guest";
  const code = "7f3a9c2e41b8";

  return (
    <div className="glass-strong grid items-center gap-10 rounded-[36px] p-6 sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
      <div>
        <p className="eyebrow !justify-start">Try it yourself</p>
        <h2 className="display mt-4 text-[38px] leading-[1.06] sm:text-[48px]">
          Every guest opens an invitation with <em>their own name</em> on it
        </h2>
        <p className="mt-5 max-w-[34rem] text-[18px] leading-[30px] text-text-2">
          Add your guest list and each person gets a personal link. Type a name and watch the card
          change, exactly as your guests will see it.
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
                className="tag-chip min-h-[44px] cursor-pointer transition-colors duration-150 hover:bg-[rgba(245,163,0,0.3)]"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The invitation card: a rich object on a maroon ground. */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-[-6%] -z-10 rounded-[40px] bg-[radial-gradient(closest-side,rgba(255,214,107,0.5),transparent_75%)] blur-xl"
        />
        <div className="rounded-[28px] bg-gradient-to-b from-[#7c1233] to-[#3d0818] p-3 shadow-[0_30px_70px_rgba(107,15,43,0.35)]">
          <div className="relative overflow-hidden rounded-[20px] border border-[#c9a76a]/70 bg-[#fdf3e0] px-8 py-12 text-center text-[#2b0a14]">
            <p className="deva text-[26px] leading-none text-[#9a1740]">श्री गणेशाय नमः</p>
            <p className="mt-6 text-[14px] tracking-[0.04em] text-[#6d4a3a]">Specially honouring</p>
            <div className="relative mt-2 h-[56px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={shown}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="display absolute inset-x-0 truncate text-[42px] leading-[56px] !text-[#6b0f2b]"
                >
                  {shown}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mx-auto my-6 h-px w-20 bg-gradient-to-r from-transparent via-[#c9a76a] to-transparent" />
            <p className="display text-[28px] leading-[1.2] !text-[#2b0a14]">Ankita &amp; Kaushik</p>
            <p className="num mt-2 text-[15px] text-[#6d4a3a]">2 December 2026</p>
          </div>
        </div>

        <p className="num mt-5 truncate px-2 text-center text-[13px] leading-4 text-muted">
          {BRAND.short.toLowerCase()}.app/i/ankita-kaushik/<span className="font-semibold text-maroon">{code}</span>
        </p>
      </div>
    </div>
  );
}
