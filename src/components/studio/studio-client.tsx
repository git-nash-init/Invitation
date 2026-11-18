"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, Monitor, Smartphone, Users, X } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { saveConfig, setStatus, updateSettings } from "@/lib/invitations/actions";

type Props = {
  id: string;
  slug: string;
  templateSlug: string;
  initialTitle: string;
  initialStatus: "draft" | "published" | "archived";
  initialGuestMode: "common" | "personalised";
  initialHash: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function StudioClient({
  id,
  slug,
  templateSlug,
  initialTitle,
  initialStatus,
  initialGuestMode,
  initialHash,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // The iframe src is fixed on first render; the template navigates itself afterwards.
  const [src] = useState(`/templates/${templateSlug}/?edit=1${initialHash}`);

  const [title, setTitle] = useState(initialTitle);
  const [status, setStatusState] = useState(initialStatus);
  const [guestMode, setGuestMode] = useState(initialGuestMode);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [panelOpen, setPanelOpen] = useState(false);
  const [device, setDevice] = useState<"phone" | "desktop">("desktop");
  const [copied, setCopied] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [busy, setBusy] = useState(false);

  const published = status === "published";
  // The panel that shows this only renders after a click, so the origin is always
  // known by then and there is nothing to hydrate.
  const shareUrl = `${typeof window === "undefined" ? "" : window.location.origin}/i/${slug}`;

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
      } else if (data.type === "sutra:finalize") {
        setPanelOpen(true);
      } else if (data.type === "sutra:buy") {
        setPanelOpen(true);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [id]);

  const togglePublish = useCallback(async () => {
    setBusy(true);
    setPanelError("");
    const res = await setStatus(id, published ? "draft" : "published");
    setBusy(false);
    if (res.ok) setStatusState(published ? "draft" : "published");
    else setPanelError(res.error);
  }, [id, published]);

  async function saveSettings() {
    setBusy(true);
    setPanelError("");
    const res = await updateSettings(id, { title, guest_mode: guestMode });
    setBusy(false);
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
    <div className="flex h-screen flex-col bg-bg-deep">
      <header className="glass-strong z-20 flex h-14 shrink-0 items-center gap-3 border-x-0 border-t-0 px-3 sm:px-4">
        <Link href="/dashboard" className="btn btn-ghost btn-sm" aria-label="Back to dashboard">
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-[14px] leading-5">
            <span
              className={`seal ${published ? "" : "seal-draft"}`}
              aria-label={published ? "Published" : "Draft"}
            />
            <span className="truncate">{title}</span>
            <span className="num hidden text-[12px] text-muted sm:inline">
              {saveState === "saving" && "Saving"}
              {saveState === "saved" && "Saved"}
              {saveState === "error" && "Not saved"}
            </span>
          </p>
        </div>

        <div className="hidden items-center gap-1 sm:flex" role="group" aria-label="Preview size">
          <button
            type="button"
            className={`btn btn-sm ${device === "phone" ? "btn-glass" : "btn-ghost"}`}
            onClick={() => setDevice("phone")}
            aria-pressed={device === "phone"}
            aria-label="Phone width"
          >
            <Smartphone size={16} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className={`btn btn-sm ${device === "desktop" ? "btn-glass" : "btn-ghost"}`}
            onClick={() => setDevice("desktop")}
            aria-pressed={device === "desktop"}
            aria-label="Desktop width"
          >
            <Monitor size={16} strokeWidth={1.5} />
          </button>
        </div>

        <LinkButton href={`/dashboard/${id}/guests`} variant="ghost" size="sm">
          <Users size={16} strokeWidth={1.5} />
          <span className="hidden sm:inline">Guests</span>
        </LinkButton>
        <Button size="sm" onClick={() => setPanelOpen(true)}>
          {published ? "Share" : "Publish"}
        </Button>
      </header>

      <main className="relative flex min-h-0 flex-1 justify-center">
        <iframe
          ref={iframeRef}
          src={src}
          title="Invitation editor"
          allow="autoplay"
          className={`h-full border-0 bg-black transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            device === "phone" ? "w-[390px] max-w-full" : "w-full"
          }`}
        />

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

                <fieldset>
                  <legend className="label">Who is it for</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["common", "One link for everyone"],
                        ["personalised", "A personal link per guest"],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3 text-[14px] transition-colors duration-150 ${
                          guestMode === value
                            ? "border-accent bg-[rgba(232,169,59,0.1)]"
                            : "border-(--glass-border) hover:border-(--hairline-strong)"
                        }`}
                      >
                        <input
                          type="radio"
                          name="guest_mode"
                          value={value}
                          checked={guestMode === value}
                          onChange={() => {
                            setGuestMode(value);
                            setBusy(true);
                            updateSettings(id, { title, guest_mode: value }).then((r) => {
                              setBusy(false);
                              if (!r.ok) setPanelError(r.error);
                            });
                          }}
                          className="accent-[#e8a93b]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  {guestMode === "personalised" && (
                    <p className="mt-3 text-[13px] leading-5 text-text-2">
                      Add your guest list to get a link for each person.{" "}
                      <Link href={`/dashboard/${id}/guests`} className="link">
                        Open guest list
                      </Link>
                    </p>
                  )}
                </fieldset>

                {published && guestMode === "common" && (
                  <div>
                    <label htmlFor="share-url" className="label">
                      Share link
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
                  <Button onClick={togglePublish} disabled={busy} className="flex-1">
                    {published ? "Unpublish" : "Publish invitation"}
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
