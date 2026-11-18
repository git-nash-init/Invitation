import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip static assets, the gated template files (/t/) and image optimisation.
    "/((?!_next/static|_next/image|t/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|mp4|woff2)$).*)",
  ],
};
