"use client";

import { useEffect, useRef } from "react";
import { LoadingIframe } from "@/components/ui/loading-iframe";

/** The published invitation, full screen. Relays guest replies from the template to the API. */
export function PublicFrame({
  src,
  slug,
  code,
  title,
}: {
  src: string;
  slug: string;
  code: string | null;
  title: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.source !== ref.current?.contentWindow) return;
      const d = e.data as {
        type?: string;
        name?: string;
        contact?: string;
        message?: string;
        responses?: Array<{ rsvpEventId: string | number; status: string; guestCount: number | null }>;
      } | null;
      if (d?.type !== "sutra:rsvp") return;

      fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          code,
          name: d.name ?? "",
          contact: d.contact ?? "",
          message: d.message ?? "",
          responses: d.responses ?? [],
        }),
      }).catch(() => {
        /* the template already confirmed locally; a retry is the guest's call */
      });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [slug, code]);

  return (
    <LoadingIframe
      frameRef={ref}
      src={src}
      title={title}
      fixed
      label="Opening your invitation"
      className="fixed inset-0 h-full w-full border-0 bg-black"
    />
  );
}
