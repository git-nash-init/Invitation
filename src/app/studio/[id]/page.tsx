import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StudioClient } from "@/components/studio/studio-client";
import { getMyInvitation } from "@/lib/invitations/queries";
import { buildPlatformHash } from "@/lib/invitations/payload";
import { mintAssetToken } from "@/lib/asset-token";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit invitation", robots: { index: false } };

export default async function StudioPage({ params }: PageProps<"/studio/[id]">) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const invitation = await getMyInvitation(id);
  if (!invitation) notFound();

  const hash = buildPlatformHash({
    id: invitation.id,
    status: invitation.status,
    config: invitation.config,
  });

  const supabase = await createClient();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("invitation_id", id)
    .eq("status", "paid");

  // Twelve hours covers a long editing session; a fresh page load mints a new one.
  const assetToken = mintAssetToken(invitation.template_slug, 12 * 3600);

  return (
    <StudioClient
      assetToken={assetToken}
      id={invitation.id}
      slug={invitation.slug}
      templateSlug={invitation.template_slug}
      initialTitle={invitation.title}
      initialStatus={invitation.status}
      initialGuestMode={invitation.guest_mode}
      initialHash={hash}
      paid={(count ?? 0) > 0}
    />
  );
}
