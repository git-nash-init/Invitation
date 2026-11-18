import { NextResponse } from "next/server";
import { getTemplate } from "@/lib/templates";

/**
 * The templates' toolbar asks for a little metadata about the template it is
 * running. Only public catalogue fields are returned.
 */
export async function GET(_req: Request, ctx: RouteContext<"/try/[slug]/meta">) {
  const { slug } = await ctx.params;
  const t = /^[a-z0-9-]{2,40}$/.test(slug) ? await getTemplate(slug) : null;
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    name: t.name,
    category: t.category,
    checkoutUrl: "/signup",
    dashboardUrl: "/dashboard",
    priceLabel: "₹699",
    includes: [],
    addOns: [],
  });
}
