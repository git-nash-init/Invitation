import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/security";

const body = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{3,59}$/),
  code: z.string().max(40).nullish(),
  name: z.string().max(80).default(""),
  contact: z.string().max(30).default(""),
  message: z.string().max(500).default(""),
  responses: z
    .array(
      z.object({
        rsvpEventId: z.union([z.string().max(40), z.number()]).transform(String),
        status: z.enum(["attending", "maybe", "not-attending"]),
        guestCount: z.number().int().min(1).max(20).nullable().optional(),
      }),
    )
    .max(20),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!rateLimit(`rsvp:${clientIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many replies, try again shortly" }, { status: 429 });
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check your reply and try again" }, { status: 400 });
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_rsvp", {
    p_slug: d.slug,
    p_code: d.code ?? null,
    p_name: d.name,
    p_contact: d.contact,
    p_responses: d.responses,
    p_message: d.message,
  });

  if (error) {
    const known = ["22023", "P0001", "P0002"].includes(error.code ?? "");
    return NextResponse.json(
      { error: known ? error.message : "We could not save your reply" },
      { status: known ? 400 : 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
