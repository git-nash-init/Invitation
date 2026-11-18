import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSameOrigin, rateLimit, sniffFile } from "@/lib/security";

const LIMITS = { image: 10 * 1024 * 1024, audio: 8 * 1024 * 1024 } as const;

/** Shared handler for the photo and audio uploads the template editors make. */
export async function handleUpload(
  request: Request,
  invitationId: string,
  kind: "image" | "audio",
) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!z.string().uuid().safeParse(invitationId).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub as string | undefined;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`upload:${uid}`, 40, 60_000)) {
    return NextResponse.json({ error: "Too many uploads, try again shortly" }, { status: 429 });
  }

  // The invitation must belong to the caller (row level security enforces it).
  const { data: inv } = await supabase
    .from("invitations")
    .select("id")
    .eq("id", invitationId)
    .maybeSingle();
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get(kind);
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (file.size === 0 || file.size > LIMITS[kind]) {
    return NextResponse.json({ error: "That file is too large" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffFile(bytes, kind);
  if (!type) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const path = `${uid}/${invitationId}/${crypto.randomUUID()}.${type.ext}`;
  const { error } = await supabase.storage
    .from("invite-media")
    .upload(path, bytes, { contentType: type.mime, cacheControl: "31536000", upsert: false });
  if (error) return NextResponse.json({ error: "Upload failed" }, { status: 500 });

  const { data: pub } = supabase.storage.from("invite-media").getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl });
}
