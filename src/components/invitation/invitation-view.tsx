import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicFrame } from "@/components/invitation/public-frame";
import { openInvitation } from "@/lib/invitations/queries";
import { buildPlatformHash } from "@/lib/invitations/payload";
import { mintAssetToken } from "@/lib/asset-token";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{3,59}$/;
const CODE_RE = /^[a-z0-9]{6,40}$/;

function names(config: Record<string, unknown>) {
  const a = typeof config.brideName === "string" ? config.brideName : "";
  const b = typeof config.groomName === "string" ? config.groomName : "";
  return a && b ? `${a} & ${b}` : "Wedding invitation";
}

export async function invitationMetadata(slug: string, code: string | null): Promise<Metadata> {
  const inv = SLUG_RE.test(slug) ? await openInvitation(slug, code) : null;
  if (!inv) return { title: "Invitation not found", robots: { index: false } };
  return {
    title: names(inv.config),
    description: "You are invited. Open the invitation.",
    // Invitations are private links, never for search engines.
    robots: { index: false, follow: false },
  };
}

export async function InvitationView({ slug, code }: { slug: string; code: string | null }) {
  if (!SLUG_RE.test(slug) || (code !== null && !CODE_RE.test(code))) notFound();

  const inv = await openInvitation(slug, code);
  if (!inv) notFound();

  const personal = inv.guest_mode === "personalised" && Boolean(inv.guest_name);
  const hash = buildPlatformHash({
    id: undefined,
    status: "published",
    config: inv.config,
    guestName: personal ? inv.guest_name : null,
    commonLink: !personal,
  });

  // Six hours is long enough to read an invitation; reopening the link mints a new token.
  const token = mintAssetToken(inv.template_slug, 6 * 3600);

  return (
    <PublicFrame
      src={`/t/${token}/${inv.template_slug}/${hash}`}
      slug={inv.slug}
      code={personal ? code : null}
      title={names(inv.config)}
    />
  );
}
