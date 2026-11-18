import { handleUpload } from "@/lib/invitations/upload";

export async function POST(request: Request, ctx: RouteContext<"/api/invitations/[id]/media">) {
  const { id } = await ctx.params;
  return handleUpload(request, id, "image");
}
