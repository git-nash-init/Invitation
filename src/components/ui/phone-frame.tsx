import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

/**
 * The phone picture (public/brand/phone-frame.png, 588 x 1144) has a transparent screen. These are the
 * screen's edges as a share of the picture, so anything placed there sits exactly inside the glass.
 */
export const PHONE_ASPECT = 588 / 1144;
export const PHONE_SCREEN: CSSProperties = {
  left: "9.354%",
  top: "4.895%",
  width: "81.122%",
  height: "90.210%",
};

/** The phone's picture, drawn over whatever fills its screen. Used by the screen in a phone-sized wrapper. */
export function PhoneBezel({ priority = false }: { priority?: boolean }) {
  return (
    <Image
      src="/brand/phone-frame.png"
      alt=""
      width={588}
      height={1144}
      priority={priority}
      draggable={false}
      className="pointer-events-none absolute inset-0 z-20 h-full w-full select-none"
    />
  );
}

/**
 * A phone with its screen filled by `children`. Nothing inside scrolls visibly: the screen clips its
 * content and templates inside have their scrollbars hidden (see hideFrameScrollbars).
 */
export function PhoneFrame({
  children,
  className = "",
  priority = false,
}: {
  children: ReactNode;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative w-full ${className}`} style={{ aspectRatio: "588 / 1144" }}>
      <div className="absolute overflow-hidden bg-[#fdf3e0]" style={PHONE_SCREEN}>
        {children}
      </div>
      <PhoneBezel priority={priority} />
    </div>
  );
}
