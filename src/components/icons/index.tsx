import { useId } from "react";
import type { ReactNode, SVGProps } from "react";
import { BRAND_PATHS } from "./brand-paths";

/**
 * The site's icon set. Every icon here is a small illustration, not a line pictogram:
 *  - brand logos (WhatsApp, Telegram, Instagram) are the official marks;
 *  - the rest are drawn in the site's own palette (maroon, marigold, ivory, rose) and
 *    show the actual thing they stand for: an invitation card, a calendar with a diya,
 *    a map pin over a jharokha, a dhol.
 * All are decorative (aria-hidden); put the meaning in nearby text.
 */

const MAROON = "#6b0f2b";
const DEEP = "#3b0a1a";
const GOLD_LIGHT = "#ffd66b";
const GOLD = "#f5a300";
const CREAM = "#fffaf0";
const ROSE = "#e11d74";

type IconProps = { size?: number; className?: string };

/** Unique, selector-safe id prefix per icon instance. */
function useUid() {
  return useId().replace(/[^a-zA-Z0-9]/g, "");
}

function Art({
  size = 56,
  className,
  children,
  viewBox = "0 0 64 64",
  ...rest
}: IconProps & { children: ReactNode; viewBox?: string } & Omit<SVGProps<SVGSVGElement>, "children">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Shared gradients: marigold, maroon and a warm halo to sit each illustration on. */
function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={GOLD_LIGHT} />
        <stop offset="1" stopColor={GOLD} />
      </linearGradient>
      <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8a1538" />
        <stop offset="1" stopColor="#4a0a1e" />
      </linearGradient>
      <radialGradient id={`${id}h`} cx="0.5" cy="0.4" r="0.75">
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="1" stopColor="#fde2a8" />
      </radialGradient>
    </defs>
  );
}

const Halo = ({ id }: { id: string }) => <circle cx="32" cy="32" r="31" fill={`url(#${id}h)`} />;

/* ---------------------------- Brand logos ---------------------------- */

export function WhatsAppLogo({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path d={BRAND_PATHS.whatsapp.path} fill={BRAND_PATHS.whatsapp.hex} />
    </svg>
  );
}

export function TelegramLogo({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path d={BRAND_PATHS.telegram.path} fill={BRAND_PATHS.telegram.hex} />
    </svg>
  );
}

export function InstagramLogo({ size = 24, className }: IconProps) {
  const id = useUid();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={`${id}ig`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#feda75" />
          <stop offset="0.28" stopColor="#fa7e1e" />
          <stop offset="0.55" stopColor="#d62976" />
          <stop offset="0.8" stopColor="#962fbf" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <path d={BRAND_PATHS.instagram.path} fill={`url(#${id}ig)`} />
    </svg>
  );
}

/** Text message: the familiar green bubble with three dots. */
export function SmsLogo({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M5 3h14a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-7.2L6.6 21.6a.6.6 0 0 1-1-.5V18H5a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"
        fill="#2fb86a"
      />
      <circle cx="7.6" cy="10.5" r="1.4" fill="#fff" />
      <circle cx="12" cy="10.5" r="1.4" fill="#fff" />
      <circle cx="16.4" cy="10.5" r="1.4" fill="#fff" />
    </svg>
  );
}

/** Email: a red envelope. */
export function EmailLogo({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <rect x="1.5" y="4" width="21" height="16" rx="3.5" fill="#ea4335" />
      <path d="m3.4 7.4 7.4 5.6a2 2 0 0 0 2.4 0l7.4-5.6" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ----------------------- Illustrated feature icons ----------------------- */

/** An invitation card with a guest's name on it and a link attached: "a personal link for every guest". */
export function GuestLinkIcon({ size = 64, className }: IconProps) {
  const id = useUid();
  return (
    <Art size={size} className={className}>
      <Defs id={id} />
      <Halo id={id} />
      <rect x="13" y="12" width="34" height="38" rx="5" fill={CREAM} stroke={MAROON} strokeWidth="2" />
      <path d="M22 27v-3a8 8 0 0 1 16 0v3" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
      <circle cx="30" cy="19" r="2.2" fill={`url(#${id}g)`} />
      <rect x="20" y="31" width="20" height="3.6" rx="1.8" fill={MAROON} />
      <rect x="24" y="38" width="12" height="2.6" rx="1.3" fill={GOLD} />
      <rect x="22" y="43" width="16" height="2.6" rx="1.3" fill="#e9c98b" />
      <circle cx="46" cy="46" r="12" fill={`url(#${id}g)`} stroke={CREAM} strokeWidth="2.5" />
      <g transform="rotate(-45 46 46)" stroke={MAROON} strokeWidth="2.2">
        <rect x="38.6" y="42.6" width="9" height="6.8" rx="3.4" />
        <rect x="44.4" y="42.6" width="9" height="6.8" rx="3.4" />
      </g>
    </Art>
  );
}

/** A guest list with ticks: RSVPs in one place. */
export function RsvpIcon({ size = 64, className }: IconProps) {
  const id = useUid();
  return (
    <Art size={size} className={className}>
      <Defs id={id} />
      <Halo id={id} />
      <rect x="11" y="11" width="42" height="42" rx="6" fill={CREAM} stroke={MAROON} strokeWidth="2" />
      {[0, 1, 2].map((i) => {
        const y = 21 + i * 11;
        return (
          <g key={i}>
            <circle cx="21" cy={y} r="3.4" fill={`url(#${id}g)`} stroke={MAROON} strokeWidth="1.2" />
            <rect x="28" y={y - 1.7} width={i === 1 ? 12 : 15} height="3.4" rx="1.7" fill={i === 1 ? "#e9c98b" : MAROON} opacity={i === 1 ? 1 : 0.85} />
            {i === 1 ? (
              <path d={`M44.5 ${y - 3.2}l5 6.4m0-6.4-5 6.4`} stroke={ROSE} strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d={`M44.5 ${y}l2.8 2.8 5-5.8`} stroke="#0e8a5f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </g>
        );
      })}
    </Art>
  );
}

/** A calendar with a lit diya: every ceremony, each with its date. */
export function CeremonyIcon({ size = 64, className }: IconProps) {
  const id = useUid();
  return (
    <Art size={size} className={className}>
      <Defs id={id} />
      <Halo id={id} />
      <rect x="11" y="14" width="42" height="40" rx="6" fill={CREAM} stroke={MAROON} strokeWidth="2" />
      <path d="M11 20a6 6 0 0 1 6-6h30a6 6 0 0 1 6 6v6H11v-6Z" fill={`url(#${id}m)`} />
      <rect x="20" y="9" width="3.6" height="10" rx="1.8" fill={`url(#${id}g)`} stroke={DEEP} strokeWidth="1" />
      <rect x="40.4" y="9" width="3.6" height="10" rx="1.8" fill={`url(#${id}g)`} stroke={DEEP} strokeWidth="1" />
      <path d="M32 30c4.6 4 4.6 8.4 0 11.2-4.6-2.8-4.6-7.2 0-11.2Z" fill="#ff7a1a" />
      <path d="M32 34.5c1.9 1.7 1.9 3.6 0 4.9-1.9-1.3-1.9-3.2 0-4.9Z" fill={GOLD_LIGHT} />
      <path d="M22 42.5h20c0 5.2-4.4 8.6-10 8.6s-10-3.4-10-8.6Z" fill={`url(#${id}g)`} stroke={MAROON} strokeWidth="1.8" strokeLinejoin="round" />
    </Art>
  );
}

/** A map with a pin that holds a little jharokha arch: one-tap maps to the venue. */
export function MapPinIcon({ size = 64, className }: IconProps) {
  const id = useUid();
  return (
    <Art size={size} className={className}>
      <Defs id={id} />
      <Halo id={id} />
      <path d="M7 26 22 21l20 6 15-5v24l-15 5-20-6-15 5V26Z" fill="#fff3dc" stroke={MAROON} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M22 21v24M42 27v24" stroke="#e0b768" strokeWidth="1.6" />
      <path d="M12 41c6-3 10 1 16-1s9-5 16-3" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="1 4.2" />
      <path
        d="M32 6.5c-8.6 0-15 6.4-15 14.8 0 10.8 15 26.2 15 26.2s15-15.4 15-26.2c0-8.4-6.4-14.8-15-14.8Z"
        fill={`url(#${id}m)`}
        stroke={CREAM}
        strokeWidth="2.2"
      />
      <circle cx="32" cy="21.5" r="8.4" fill={`url(#${id}g)`} />
      <path d="M27.6 26v-5.4a4.4 4.4 0 0 1 8.8 0V26Z" fill={MAROON} />
      <path d="M32 14.8v1.8" stroke={MAROON} strokeWidth="1.6" strokeLinecap="round" />
    </Art>
  );
}

/** A dhol with a note above it: music that starts when the invitation opens. */
export function MusicIcon({ size = 64, className }: IconProps) {
  const id = useUid();
  return (
    <Art size={size} className={className}>
      <Defs id={id} />
      <Halo id={id} />
      <path d="M13 24q19-6 38 0v20q-19 6-38 0V24Z" fill={`url(#${id}m)`} stroke={DEEP} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M18 25.5 25 43.5 32 25 39 43.5 46 25.5" stroke={GOLD_LIGHT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="13" cy="34" rx="4.6" ry="10.6" fill={CREAM} stroke={MAROON} strokeWidth="1.8" />
      <ellipse cx="51" cy="34" rx="4.6" ry="10.6" fill="#f7dca4" stroke={MAROON} strokeWidth="1.8" />
      <circle cx="13" cy="34" r="2" fill={GOLD} />
      <path d="M40 15V7.5l9-2.4V12" stroke={MAROON} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="37.4" cy="15.6" rx="3.4" ry="2.7" fill={MAROON} transform="rotate(-18 37.4 15.6)" />
      <ellipse cx="46.4" cy="13.2" rx="3.4" ry="2.7" fill={MAROON} transform="rotate(-18 46.4 13.2)" />
    </Art>
  );
}

/** A fountain pen mid-flourish: edit any time. */
export function PenIcon({ size = 64, className }: IconProps) {
  const id = useUid();
  return (
    <Art size={size} className={className}>
      <Defs id={id} />
      <Halo id={id} />
      <path d="M9 52c7-9 12 3 18-3s9-2 14-6" stroke={GOLD} strokeWidth="2.6" strokeLinecap="round" />
      <PenBody id={id} transform="rotate(38 32 32) translate(0 -3)" />
    </Art>
  );
}

function PenBody({ id, transform }: { id: string; transform: string }) {
  return (
    <g transform={transform}>
      <rect x="28" y="8" width="8" height="30" rx="2.4" fill={`url(#${id}m)`} stroke={DEEP} strokeWidth="1.2" />
      <rect x="28" y="14" width="8" height="3.4" fill={`url(#${id}g)`} />
      <rect x="29.6" y="9.6" width="1.6" height="22" rx="0.8" fill="#fff" opacity="0.22" />
      <path d="M28 38h8l-4 13.5L28 38Z" fill={`url(#${id}g)`} stroke={DEEP} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M32 41v6" stroke={DEEP} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="32" cy="48" r="1" fill={DEEP} />
    </g>
  );
}

/* --------------------------- Step illustrations --------------------------- */

const ARCH = "M20 52V27a12 12 0 0 1 24 0v25Z";

/** A fan of arch-shaped invitations: choose your design. */
export function ChooseDesignIcon({ size = 72, className }: IconProps) {
  const id = useUid();
  return (
    <Art size={size} className={className}>
      <Defs id={id} />
      <Halo id={id} />
      <g transform="rotate(-17 32 52)">
        <path d={ARCH} fill={`url(#${id}m)`} stroke={DEEP} strokeWidth="1.4" />
      </g>
      <g transform="rotate(17 32 52)">
        <path d={ARCH} fill={`url(#${id}g)`} stroke={MAROON} strokeWidth="1.4" />
      </g>
      <path d={ARCH} fill={CREAM} stroke={MAROON} strokeWidth="2" />
      <path d="M24.5 50V28a7.5 7.5 0 0 1 15 0v22" stroke="#e0b768" strokeWidth="1.4" />
      <path d="M32 46c-4-3-4-7.4 0-11.4 4 4 4 8.4 0 11.4Z" fill={ROSE} />
      <path d="M32 46c-6.2 0-9.4-3-9.6-7.4 4.4.2 8.2 2.2 9.6 7.4Z" fill={`url(#${id}g)`} stroke={MAROON} strokeWidth="0.8" />
      <path d="M32 46c6.2 0 9.4-3 9.6-7.4-4.4.2-8.2 2.2-9.6 7.4Z" fill={`url(#${id}g)`} stroke={MAROON} strokeWidth="0.8" />
      <path d="M32 24.5 33.1 27.4 36 28.5 33.1 29.6 32 32.5 30.9 29.6 28 28.5 30.9 27.4Z" fill={GOLD} />
      <path d="M52 10 53.5 13.7 57.2 15.2 53.5 16.7 52 20.4 50.5 16.7 46.8 15.2 50.5 13.7Z" fill={`url(#${id}g)`} stroke={MAROON} strokeWidth="0.8" strokeLinejoin="round" />
    </Art>
  );
}

/** A card with the couple's names and a pen: make it yours. */
export function MakeItYoursIcon({ size = 72, className }: IconProps) {
  const id = useUid();
  return (
    <Art size={size} className={className}>
      <Defs id={id} />
      <Halo id={id} />
      <rect x="10" y="11" width="35" height="44" rx="5" fill={CREAM} stroke={MAROON} strokeWidth="2" />
      <path d="M18 24v-2a9.5 9.5 0 0 1 19 0v2" stroke="#e0b768" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="17" y="27" width="21" height="4" rx="2" fill={MAROON} />
      <circle cx="27.5" cy="36.4" r="2.6" fill={`url(#${id}g)`} stroke={MAROON} strokeWidth="1" />
      <rect x="19" y="41.2" width="17" height="4" rx="2" fill={MAROON} />
      <rect x="21.5" y="48.4" width="12" height="2.6" rx="1.3" fill={GOLD} />
      <PenBody id={id} transform="translate(8 14.6) rotate(36 44 36) scale(0.8)" />
    </Art>
  );
}

/** A phone with a sent message and a paper plane: share one link. */
export function ShareLinkIcon({ size = 72, className }: IconProps) {
  const id = useUid();
  return (
    <Art size={size} className={className}>
      <Defs id={id} />
      <Halo id={id} />
      <rect x="14" y="9" width="30" height="48" rx="6.5" fill={CREAM} stroke={MAROON} strokeWidth="2" />
      <rect x="24" y="12.4" width="10" height="2.6" rx="1.3" fill={MAROON} />
      <path d="M19 24.5a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4h-8l-4.4 3.4V31.5H23a4 4 0 0 1-4-4v-3Z" fill={`url(#${id}m)`} />
      <path d="M29 28.4c-2.6-1.6-3.4-3-3.4-4a1.8 1.8 0 0 1 3.4-.8 1.8 1.8 0 0 1 3.4.8c0 1-.8 2.4-3.4 4Z" fill={GOLD_LIGHT} />
      <path d="M39 38.5a3.6 3.6 0 0 0-3.6-3.6H22.6A3.6 3.6 0 0 0 19 38.5v1.6a3.6 3.6 0 0 0 3.6 3.6h4.6l3.6 2.8v-2.8h4.6a3.6 3.6 0 0 0 3.6-3.6v-1.6Z" fill="#f7dca4" stroke={MAROON} strokeWidth="1.2" />
      <path d="M59 8 38 17.4l7.2 4.6L47 31.5l4.6-6.6L59 8Z" fill={`url(#${id}g)`} stroke={MAROON} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m45.2 22 14-14" stroke={MAROON} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M47 33c-4 6-10 9-16 9.6" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeDasharray="0.1 5" />
    </Art>
  );
}

/* ------------------------------- Small marks ------------------------------- */

/** A scalloped maroon seal with a gold tick: the bullet used in checklists. */
const SEAL = (() => {
  const pts: string[] = [];
  const n = 96;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 10.6 + 1.3 * Math.cos(a * 12);
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
})();

export function SealTick({ size = 22, className }: IconProps) {
  const id = useUid();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a1538" />
          <stop offset="1" stopColor="#4a0a1e" />
        </linearGradient>
      </defs>
      <path d={SEAL} fill={`url(#${id}s)`} />
      <path d="m7.6 12.4 3 3 5.8-6.4" fill="none" stroke={GOLD_LIGHT} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A small lotus, used as a section ornament and list bullet. */
export function LotusMark({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d="M12 21c-3-3-3-7 0-11 3 4 3 8 0 11Z" />
      <path d="M12 21c-5-1-8-4-8-9 4 0 7 3 8 9Z" opacity=".75" />
      <path d="M12 21c5-1 8-4 8-9-4 0-7 3-8 9Z" opacity=".75" />
    </svg>
  );
}
