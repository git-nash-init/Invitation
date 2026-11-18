"use client";

import { useState, useTransition } from "react";
import { Check, Copy, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addGuests, removeGuest } from "@/lib/invitations/actions";
import type { Guest } from "@/lib/invitations/queries";

export function GuestManager({
  invitationId,
  slug,
  published,
  guests,
}: {
  invitationId: string;
  slug: string;
  published: boolean;
  guests: Guest[];
}) {
  const [names, setNames] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const linkFor = (code: string) => `${origin}/i/${slug}/${code}`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await addGuests(invitationId, names);
      if (res.ok) {
        setNames("");
        setMessage({ ok: true, text: res.message ?? "Guests added" });
      } else {
        setMessage({ ok: false, text: res.error });
      }
    });
  }

  async function copy(g: Guest) {
    try {
      await navigator.clipboard.writeText(linkFor(g.code));
      setCopiedId(g.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setMessage({ ok: false, text: "Copy is blocked in this browser" });
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="glass rounded-[16px] p-5">
        <label htmlFor="guest-names" className="label">
          Add guests, one name per line
        </label>
        <textarea
          id="guest-names"
          className="field"
          rows={4}
          value={names}
          onChange={(e) => setNames(e.target.value)}
          placeholder={"Aarti Mehra\nThe Iyer family"}
          maxLength={8000}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || names.trim() === ""}>
            {pending ? "Adding" : "Add guests"}
          </Button>
          {message && (
            <p
              role={message.ok ? "status" : "alert"}
              className={`text-[14px] ${message.ok ? "text-positive" : "text-negative"}`}
            >
              {message.text}
            </p>
          )}
        </div>
      </form>

      {!published && guests.length > 0 && (
        <p className="text-[14px] leading-5 text-text-2">
          These links will open once you publish the invitation.
        </p>
      )}

      {guests.length === 0 ? (
        <p className="text-[14px] text-text-2">No guests yet.</p>
      ) : (
        <ul className="glass divide-y divide-(--hairline) overflow-hidden rounded-[16px]">
          {guests.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[15px] leading-5">
                  <span className="tag-chip !h-6 truncate">{g.name}</span>
                  {g.first_viewed_at && (
                    <span className="num text-[12px] text-muted">
                      Opened {new Date(g.first_viewed_at).toLocaleDateString("en-IN")}
                    </span>
                  )}
                </p>
                <p className="num mt-1 truncate text-[12px] leading-4 text-muted">
                  /i/{slug}/{g.code}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="btn btn-glass btn-sm"
                  onClick={() => copy(g)}
                  aria-label={`Copy link for ${g.name}`}
                >
                  {copiedId === g.id ? (
                    <Check size={16} strokeWidth={1.5} />
                  ) : (
                    <Copy size={16} strokeWidth={1.5} />
                  )}
                  {copiedId === g.id ? "Copied" : "Copy"}
                </button>
                <a
                  className="btn btn-ghost btn-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Hi ${g.name}, you are invited. Open your invitation: ${linkFor(g.code)}`,
                  )}`}
                  aria-label={`Send ${g.name} their link on WhatsApp`}
                >
                  <MessageCircle size={16} strokeWidth={1.5} />
                  WhatsApp
                </a>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm !px-2"
                  onClick={() => start(async () => void (await removeGuest(invitationId, g.id)))}
                  aria-label={`Remove ${g.name}`}
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
