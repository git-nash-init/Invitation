import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LOGO } from "./logo-paths";

/** The mark: the letters प्र ("pra", the start of प्रथम) inside a gold-framed jharokha arch. */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  const id = `lm-${size}`;
  const arch = "translate(50 116) scale(.83 .9) translate(-50 -116)";
  return (
    <svg
      width={(size * 100) / 120}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#FFE59A" />
          <stop offset="0.5" stopColor="#F5A300" />
          <stop offset="1" stopColor="#B8741A" />
        </linearGradient>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9A1740" />
          <stop offset="1" stopColor="#4A0A1E" />
        </linearGradient>
      </defs>
      <path d={LOGO.outer} fill={`url(#${id}-g)`} />
      <path d={LOGO.outer} fill={`url(#${id}-m)`} transform={arch} />
      <path
        d={LOGO.outer}
        stroke="#FFE59A"
        strokeOpacity=".55"
        strokeWidth=".8"
        transform="translate(50 116) scale(.9 .94) translate(-50 -116)"
      />
      <path d={LOGO.pra} fill={`url(#${id}-g)`} transform={LOGO.praTransform} />
      <g fill={`url(#${id}-g)`}>
        <path d="M50 110C47 105 47 102 50 99C53 102 53 105 50 110Z" />
        <path transform="rotate(-40 50 110)" d="M50 110C47 105 47 102 50 99C53 102 53 105 50 110Z" />
        <path transform="rotate(40 50 110)" d="M50 110C47 105 47 102 50 99C53 102 53 105 50 110Z" />
      </g>
      <circle cx="50" cy="2.4" r="2.4" fill={`url(#${id}-g)`} />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose"
      aria-label={`${BRAND.name} home`}
    >
      <LogoMark size={40} />
      <span className="flex flex-col leading-none">
        <span
          className={`display text-[26px] leading-[0.95] ${light ? "!text-[#fff4e2]" : "!text-maroon"}`}
        >
          {BRAND.short}
        </span>
        <span className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.34em] text-[#b7791f]">
          Invitation
        </span>
      </span>
    </Link>
  );
}
