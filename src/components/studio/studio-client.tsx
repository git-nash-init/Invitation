"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, Monitor, Smartphone, Users, X } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { FrameLoading } from "@/components/ui/page-loading";
import { PHONE_SCREEN, PhoneBezel } from "@/components/ui/phone-frame";
import { hideFrameScrollbars } from "@/lib/frame";
import { saveConfig, setStatus, updateSettings } from "@/lib/invitations/actions";

type Props = {
  id: string;
  slug: string;
  templateSlug: string;
  assetToken: string;
  initialTitle: string;
  initialStatus: "draft" | "published" | "archived";
  initialGuestMode: "common" | "personalised";
  initialHash: string;
  /** A paid order exists, so publishing needs no further payment. */
  paid: boolean;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function StudioClient({
  id,
  slug,
  templateSlug,
  assetToken,
  initialTitle,
  initialStatus,
  initialGuestMode,
  initialHash,
  paid,
}: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // The iframe src is fixed on first render; the template navigates itself afterwards.
  const [src] = useState(`/t/${assetToken}/${templateSlug}/?edit=1${initialHash}`);

  const [title, setTitle] = useState(initialTitle);
  const [status, setStatusState] = useState(initialStatus);
  // Adding a friend switches this on its own (see addGuests), so it is not chosen here.
  const guestMode = initialGuestMode;
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [panelOpen, setPanelOpen] = useState(false);
  const [device, setDevice] = useState<"phone" | "desktop">("desktop");
  const [copied, setCopied] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [busy, setBusy] = useState(false);
  // What the bar says while a publish, unpublish or name change is on its way.
  const [busyLabel, setBusyLabel] = useState("");
  const [frameReady, setFrameReady] = useState(false);
  const [navigating, startNav] = useTransition();

  const published = status === "published";
  // The panel that shows this only renders after a click, so the origin is always
  // known by then and there is nothing to hydrate.
  const shareUrl = `${typeof window === "undefined" ? "" : window.location.origin}/i/${slug}`;

  // Publishing an unpaid invitation goes to the page that explains and takes the payment.
  function openPublish() {
    if (!published && !paid) startNav(() => router.push(`/studio/${id}/publish`));
    else setPanelOpen(true);
  }

  // In phone width the editor sits inside a phone, so no scrollbar is drawn there.
  useEffect(() => {
    if (device !== "phone" || !frameReady) return;
    return hideFrameScrollbars(iframeRef.current);
  }, [device, frameReady]);

  // Messages from the template running in the iframe. Only our own iframe, same origin.
  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as { type?: string; config?: unknown } | null;
      if (!data || typeof data.type !== "string") return;

      if (data.type === "sutra:save") {
        setSaveState("saving");
        const res = await saveConfig(id, data.config);
        setSaveState(res.ok ? "saved" : "error");
      } else if (data.type === "sutra:finalize" || data.type === "sutra:buy") {
        openPublish();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, published, paid]);

  const togglePublish = useCallback(async () => {
    setBusy(true);
    setBusyLabel(published ? "Unpublishing" : "Publishing");
    setPanelError("");
    const res = await setStatus(id, published ? "draft" : "published");
    setBusy(false);
    setBusyLabel("");
    if (res.ok) setStatusState(published ? "draft" : "published");
    else setPanelError(res.error);
  }, [id, published]);

  async function saveSettings() {
    setBusy(true);
    setBusyLabel("Saving name");
    setPanelError("");
    const res = await updateSettings(id, { title, guest_mode: guestMode });
    setBusy(false);
    setBusyLabel("");
    if (!res.ok) setPanelError(res.error);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setPanelError("Copy is blocked in this browser. Select the link and copy it.");
    }
  }

  return (
    <div className="h-screen bg-bg-deep">
      <main className="relative flex h-full justify-center">
        {/* No bar across the top: the invitation fills the screen and every control floats over it. */}
        {/* The iframe stays in the same place in the tree when the width changes, so the editor never
            reloads (and never loses an edit). In phone width the wrapper becomes the phone. */}
        <div
          className={device === "phone" ? "relative my-3 h-[calc(100%-1.5rem)]" : "relative h-full w-full"}
          style={device === "phone" ? { aspectRatio: "588 / 1144" } : undefined}
        >
          <iframe
            ref={iframeRef}
            src={src}
            title="Invitation editor"
            allow="autoplay"
            onLoad={() => setFrameReady(true)}
            className={device === "phone" ? "absolute border-0 bg-black" : "h-full w-full border-0 bg-black"}
            style={device === "phone" ? PHONE_SCREEN : undefined}
          />
          {device === "phone" && <PhoneBezel />}
        </div>

        <FrameLoading visible={!frameReady} label="Opening your editor" />

        <nav
          aria-label="Editor controls"
          className="glass-strong pointer-events-auto fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-1 rounded-full p-1.5 shadow-[0_14px_40px_rgba(74,10,30,0.35)]"
        >
          <Link href="/dashboard" className="btn btn-ghost btn-sm !rounded-full" aria-label="Back to dashboard">
            <ArrowLeft size={16} strokeWidth={1.75} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          {/* Visible on every screen: shows the invitation being saved, published or sent. */}
          <span
            role="status"
            aria-live="polite"
            className="num flex min-w-[88px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap px-1 text-[13px] text-muted"
          >
            {busyLabel || saveState === "saving" ? (
              <>
                <span className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                <span>{busyLabel || "Saving"}…</span>
              </>
            ) : saveState === "saved" ? (
              <>
                <Check size={14} strokeWidth={2} aria-hidden="true" />
                <span>Saved</span>
              </>
            ) : saveState === "error" ? (
              <span className="text-negative">Not saved</span>
            ) : null}
          </span>

          <p className="hidden max-w-[220px] items-center gap-2 px-2 text-[14px] leading-5 sm:flex">
            <span
              className={`seal shrink-0 ${published ? "" : "seal-draft"}`}
              aria-label={published ? "Published" : "Draft"}
            />
            <span className="truncate">{title}</span>
          </p>

          <span className="mx-1 hidden h-6 w-px bg-[rgba(107,15,43,0.18)] md:block" aria-hidden="true" />
          <div className="hidden items-center gap-1 md:flex" role="group" aria-label="Preview size">
            <button
              type="button"
              className={`btn btn-sm !rounded-full ${device === "phone" ? "btn-glass" : "btn-ghost"}`}
              onClick={() => setDevice("phone")}
              aria-pressed={device === "phone"}
              aria-label="Phone width"
            >
              <Smartphone size={16} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className={`btn btn-sm !rounded-full ${device === "desktop" ? "btn-glass" : "btn-ghost"}`}
              onClick={() => setDevice("desktop")}
              aria-pressed={device === "desktop"}
              aria-label="Desktop width"
            >
              <Monitor size={16} strokeWidth={1.75} />
            </button>
          </div>

          <span className="mx-1 hidden h-6 w-px bg-[rgba(107,15,43,0.18)] sm:block" aria-hidden="true" />
          <LinkButton href={`/dashboard/${id}/guests`} variant="ghost" size="sm" className="!rounded-full">
            <Users size={16} strokeWidth={1.75} />
            <span className="hidden sm:inline">Share</span>
          </LinkButton>
          <Button size="sm" onClick={openPublish} loading={navigating} className="!rounded-full">
            {navigating ? "Opening" : published ? "Share" : "Publish"}
          </Button>
        </nav>

        {panelOpen && (
          <div
            className="absolute inset-0 z-30 flex items-start justify-end bg-black/40 p-3 sm:p-4"
            onClick={() => setPanelOpen(false)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label="Publish and share"
              className="glass-strong w-full max-w-md rounded-[20px] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="display text-[24px] leading-[1.2]">
                    {published ? "Your invitation is live" : "Publish your invitation"}
                  </h2>
                  <p className="mt-1 text-[14px] leading-5 text-text-2">
                    {published
                      ? "Anyone with the link can open it."
                      : "Guests can open it once it is published."}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm !px-2"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              <div className="mt-6 grid gap-5">
                <div>
                  <label htmlFor="title" className="label">
                    Name (only you see this)
                  </label>
                  <input
                    id="title"
                    className="field"
                    value={title}
                    maxLength={120}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={saveSettings}
                  />
                </div>

                {published && (
                  <div>
                    <label htmlFor="share-url" className="label">
                      Link for everyone
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="share-url"
                        readOnly
                        className="field num !text-[13px]"
                        value={shareUrl}
                        onFocus={(e) => e.currentTarget.select()}
                      />
                      <Button variant="glass" onClick={copyLink} aria-label="Copy link">
                        {copied ? (
                          <Check size={16} strokeWidth={1.5} />
                        ) : (
                          <Copy size={16} strokeWidth={1.5} />
                        )}
                      </Button>
                      <LinkButton
                        href={`/i/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="glass"
                        aria-label="Open invitation"
                      >
                        <ExternalLink size={16} strokeWidth={1.5} />
                      </LinkButton>
                    </div>
                  </div>
                )}

                {panelError && (
                  <p role="alert" className="text-[14px] text-negative">
                    {panelError}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {published ? (
                    <>
                      <LinkButton href={`/dashboard/${id}/guests`} size="lg" className="w-full">
                        Send to your friends
                      </LinkButton>
                      <Button onClick={togglePublish} loading={busy} variant="ghost" className="w-full">
                        {busy ? "Unpublishing" : "Unpublish"}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={togglePublish} loading={busy} size="lg" className="w-full">
                      {busy ? "Publishing" : "Publish invitation"}
                    </Button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
