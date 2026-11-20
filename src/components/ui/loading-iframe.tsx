"use client";

import { useState } from "react";
import { FrameLoading } from "@/components/ui/page-loading";

/** An iframe with a loading cover that fades away once the page inside it has loaded. */
export function LoadingIframe({
  src,
  title,
  className,
  label,
  fixed = false,
  frameRef,
}: {
  src: string;
  title: string;
  className?: string;
  label?: string;
  /** The cover fills the screen instead of its nearest positioned parent. */
  fixed?: boolean;
  frameRef?: React.Ref<HTMLIFrameElement>;
}) {
  const [ready, setReady] = useState(false);
  return (
    <>
      <iframe ref={frameRef} src={src} title={title} allow="autoplay" onLoad={() => setReady(true)} className={className} />
      <FrameLoading visible={!ready} label={label} fixed={fixed} />
    </>
  );
}
