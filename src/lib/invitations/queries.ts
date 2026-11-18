import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Invitation = {
  id: string;
  template_slug: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  guest_mode: "common" | "personalised";
  config: Record<string, unknown>;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, template_slug, title, slug, status, guest_mode, config, published_at, view_count, created_at, updated_at";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;
  return {
    id: claims.sub as string,
    email: (claims.email as string | undefined) ?? "",
    name: ((claims.user_metadata as { full_name?: string } | undefined)?.full_name ?? "") as string,
  };
});

export async function getMyInvitations(): Promise<Invitation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invitations")
    .select(COLUMNS)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  return (data ?? []) as Invitation[];
}

// Row level security limits this to the signed-in owner's own rows.
export async function getMyInvitation(id: string): Promise<Invitation | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("invitations").select(COLUMNS).eq("id", id).maybeSingle();
  return (data as Invitation | null) ?? null;
}

export type MessageTemplate = { id: string; label: string; body: string };

export async function getMessageTemplates(): Promise<MessageTemplate[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("message_templates").select("id, label, body").order("sort", { ascending: true });
  return (data ?? []) as MessageTemplate[];
}

export type Stats = { guests: number; replies: number; headcount: number };

export async function getStats(): Promise<Record<string, Stats>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invitation_stats")
    .select("invitation_id, guests, replies, headcount");
  const out: Record<string, Stats> = {};
  for (const row of data ?? []) {
    out[row.invitation_id as string] = {
      guests: row.guests as number,
      replies: row.replies as number,
      headcount: row.headcount as number,
    };
  }
  return out;
}

export type Guest = {
  id: string;
  name: string;
  code: string;
  first_viewed_at: string | null;
};

export async function getGuests(invitationId: string): Promise<Guest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guests")
    .select("id, name, code, first_viewed_at")
    .eq("invitation_id", invitationId)
    .order("created_at", { ascending: true });
  return (data ?? []) as Guest[];
}

export type Rsvp = {
  id: string;
  name: string;
  contact: string | null;
  attending: boolean;
  headcount: number;
  message: string | null;
  responses: Array<{ event: string; status: string; guestCount: number | null }>;
  created_at: string;
};

export async function getRsvps(invitationId: string): Promise<Rsvp[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rsvps")
    .select("id, name, contact, attending, headcount, message, responses, created_at")
    .eq("invitation_id", invitationId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Rsvp[];
}

export type PublicInvitation = {
  id: string;
  slug: string;
  title: string;
  template_slug: string;
  guest_mode: "common" | "personalised";
  config: Record<string, unknown>;
  guest_name: string | null;
};

/** The one public read: a published invitation, plus the guest's name if their link is personal. */
// Cached per request so metadata and page share one call (and one view count).
export const openInvitation = cache(
  async (slug: string, code: string | null): Promise<PublicInvitation | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("open_invitation", {
      p_slug: slug,
      p_code: code,
    });
    if (error || !data) return null;
    return data as PublicInvitation;
  },
);
