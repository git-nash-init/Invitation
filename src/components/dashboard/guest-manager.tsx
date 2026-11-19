"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { Check, Copy, Mail, MessageCircle, Send, Share2, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addGuests, removeGuest } from "@/lib/invitations/actions";
import type { Guest, MessageTemplate } from "@/lib/invitations/queries";
import { compose, emailUrl, instagramInboxUrl, smsUrl, telegramUrl, whatsappUrl } from "@/lib/share";

type Notice = { ok: boolean; text: string } | null;

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

type RowProps = {
  rowKey: string;
  label: React.ReactNode;
  plainLabel: string;
  sub?: string;
  message: string;
  link: string;
  extra?: React.ReactNode;
  published: boolean;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  onInstagram: (key: string, text: string) => void;
};

function Row({ rowKey, label, plainLabel, sub, message, link, extra, published, copiedKey, onCopy, onInstagram }: RowProps) {
  const disabled = !published;
  const tile = "btn btn-glass !h-11 flex-1 sm:flex-none sm:!px-4";
  return (
    <li className="grid gap-3 px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-5">{label}</p>
          {sub && <p className="num mt-1 truncate text-[12px] leading-4 text-muted">{sub}</p>}
        </div>
        {extra}
      </div>
      <div className={`flex flex-wrap gap-2 ${disabled ? "pointer-events-none opacity-50" : ""}`} aria-disabled={disabled}>
        <a
          className={tile}
          href={whatsappUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Send to ${plainLabel} on WhatsApp`}
        >
          <MessageCircle size={18} strokeWidth={1.5} /> WhatsApp
        </a>
        <a className={tile} href={telegramUrl(message, link)} target="_blank" rel="noopener noreferrer">
          <Send size={18} strokeWidth={1.5} /> Telegram
        </a>
        <a className={tile} href={smsUrl(message)}>
          <Smartphone size={18} strokeWidth={1.5} /> SMS
        </a>
        <button type="button" className={tile} onClick={() => onInstagram(rowKey, message)}>
          <Share2 size={18} strokeWidth={1.5} /> Instagram
        </button>
        <a className={tile} href={emailUrl(message, "You are invited")}>
          <Mail size={18} strokeWidth={1.5} /> Email
        </a>
        <button type="button" className={tile} onClick={() => onCopy(rowKey, message)}>
          {copiedKey === rowKey ? <Check size={18} strokeWidth={1.5} /> : <Copy size={18} strokeWidth={1.5} />}
          {copiedKey === rowKey ? "Copied" : "Copy"}
        </button>
      </div>
    </li>
  );
}

export function GuestManager({
  invitationId,
  slug,
  published,
  guests,
  messages,
  hostName,
}: {
  invitationId: string;
  slug: string;
  published: boolean;
  guests: Guest[];
  messages: MessageTemplate[];
  hostName: string;
}) {
  const origin = useSyncExternalStore(subscribe, getOrigin, getServerOrigin);
  const [names, setNames] = useState("");
  const [messageId, setMessageId] = useState(messages[0]?.id ?? "");
  const [notice, setNotice] = useState<Notice>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const body = messages.find((m) => m.id === messageId)?.body ?? "Hi {friend}! {host} invites you: {link}";
  const everyoneLink = `${origin}/i/${slug}`;
  const personalLink = (code: string) => `${origin}/i/${slug}/${code}`;
  const sample = compose({ body, friend: guests[0]?.name ?? "Aarti", host: hostName, link: `${origin || "https://…"}/i/${slug}/…` });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await addGuests(invitationId, names);
      if (res.ok) {
        setNames("");
        setNotice({ ok: true, text: res.message ?? "Friends added" });
      } else {
        setNotice({ ok: false, text: res.error });
      }
    });
  }

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      setNotice({ ok: false, text: "Copy is blocked in this browser. Select the text and copy it." });
    }
  }

  // The phone's share sheet is the route to Instagram; on a computer the message is copied instead.
  async function instagram(key: string, message: string) {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: message });
      } catch {
        /* the person closed the share sheet */
      }
      return;
    }
    await copy(key, message);
    window.open(instagramInboxUrl, "_blank", "noopener,noreferrer");
    setNotice({ ok: true, text: "Message copied. Paste it in your Instagram chat." });
  }

  return (
    <div className="grid gap-6">
      {!published && (
        <p role="status" className="glass rounded-[12px] p-4 text-[14px] leading-5 text-text-2">
          Publish your invitation first. The links below start working the moment it is live.
        </p>
      )}

      {/* 1. Pick the message */}
      <section className="glass rounded-[16px] p-4 sm:p-5" aria-labelledby="msg-h">
        <h3 id="msg-h" className="text-[15px] font-medium leading-5">
          1. Choose a message
        </h3>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Message style">
          {messages.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={m.id === messageId}
              onClick={() => setMessageId(m.id)}
              className={`btn !h-10 ${m.id === messageId ? "btn-primary" : "btn-glass"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-4 whitespace-pre-line rounded-[10px] border border-(--hairline) bg-[rgba(245,163,0,0.08)] p-4 text-[14px] leading-6 text-text-2">
          {sample}
        </p>
      </section>

      {/* 2. Add friends */}
      <form onSubmit={submit} className="glass rounded-[16px] p-4 sm:p-5">
        <label htmlFor="friend-names" className="text-[15px] font-medium leading-5">
          2. Add your friends
        </label>
        <p className="mt-1 text-[13px] leading-5 text-text-2">One name per line. Each friend gets a personal link that shows their name on the invitation.</p>
        <textarea
          id="friend-names"
          className="field mt-3"
          rows={3}
          value={names}
          onChange={(e) => setNames(e.target.value)}
          placeholder={"Aarti Mehra\nThe Iyer family"}
          maxLength={8000}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || names.trim() === ""} className="w-full sm:w-auto">
            {pending ? "Adding" : "Add friends"}
          </Button>
          {notice && (
            <p role={notice.ok ? "status" : "alert"} className={`text-[14px] ${notice.ok ? "text-positive" : "text-negative"}`}>
              {notice.text}
            </p>
          )}
        </div>
      </form>

      {/* 3. Send */}
      <section aria-labelledby="send-h">
        <h3 id="send-h" className="mb-3 text-[15px] font-medium leading-5">
          3. Send
        </h3>
        <ul className="glass divide-y divide-(--hairline) overflow-hidden rounded-[16px]">
          <Row
            rowKey="everyone"
            published={published}
            copiedKey={copiedKey}
            onCopy={copy}
            onInstagram={instagram}
            plainLabel="everyone"
            label="One link for everyone"
            sub={`/i/${slug}`}
            link={everyoneLink}
            message={compose({ body, friend: "everyone", host: hostName, link: everyoneLink })}
          />
          {guests.map((g) => (
            <Row
              key={g.id}
              rowKey={g.id}
              published={published}
              copiedKey={copiedKey}
              onCopy={copy}
              onInstagram={instagram}
              plainLabel={g.name}
              label={<span className="tag-chip !h-7">{g.name}</span>}
              sub={`${g.first_viewed_at ? `Opened ${new Date(g.first_viewed_at).toLocaleDateString("en-IN")} · ` : ""}/i/${slug}/${g.code}`}
              link={personalLink(g.code)}
              message={compose({ body, friend: g.name, host: hostName, link: personalLink(g.code) })}
              extra={
                <button
                  type="button"
                  className="btn btn-ghost btn-sm !h-9 !w-9 !px-0"
                  onClick={() => start(async () => void (await removeGuest(invitationId, g.id)))}
                  aria-label={`Remove ${g.name}`}
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              }
            />
          ))}
        </ul>
        {guests.length === 0 && <p className="mt-3 text-[14px] text-text-2">Add a friend above to get their personal link.</p>}
      </section>
    </div>
  );
}
