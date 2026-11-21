"use client";

import { useState } from "react";
import { FrameLoading } from "@/components/ui/page-loading";
import { hideFrameScrollbars } from "@/lib/frame";

/** An iframe with a loading cover that fades away once the page inside it has loaded. */
export function LoadingIframe({
  src,
  title,
  className,
  label,
  fixed = false,
  frameRef,
  hideScrollbars = false,
}: {
  src: string;
  title: string;
  className?: string;
  label?: string;
  /** The cover fills the screen instead of its nearest positioned parent. */
  fixed?: boolean;
  frameRef?: React.Ref<HTMLIFrameElement>;
  /** For a template shown inside a phone: it still scrolls, but no scrollbar is drawn. */
  hideScrollbars?: boolean;
}) {
  const [ready, setReady] = useState(false);
  return (
    <>
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        allow="autoplay"
        onLoad={(e) => {
          if (hideScrollbars) hideFrameScrollbars(e.currentTarget);
          setReady(true);
        }}
        className={className}
      />
      <FrameLoading visible={!ready} label={label} fixed={fixed} />
    </>
  );
}
