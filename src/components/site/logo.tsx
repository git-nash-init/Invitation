import Link from "next/link";

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-accent"
    >
      {/* A cusped mandap arch with a single thread (sutra) running through it */}
      <path
        d="M4 21V11a8 8 0 0 1 16 0v10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      aria-label="SutraLuxe home"
    >
      <LogoMark />
      <span className="display text-[18px] leading-none text-text">SutraLuxe</span>
    </Link>
  );
}
