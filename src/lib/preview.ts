"use server";

import { headers } from "next/headers";
import { mintAssetToken } from "@/lib/asset-token";
import { rateLimit } from "@/lib/security";
import { getTemplate } from "@/lib/templates";

const SECONDS = 10 * 60;

export type LivePreview = { ok: true; src: string; expiresAtMs: number } | { ok: false; error: string };

/**
 * Starts a live, ten-minute preview of a template with its own sample names, for the phone on the home
 * page. It opens nothing that belongs to anyone: no account data is read, and the signed link expires.
 * Each visitor address may start a limited number of them.
 */
export async function startLivePreview(slug: string): Promise<LivePreview> {
  if (typeof slug !== "string" || !/^[a-z0-9-]{2,40}$/.test(slug)) return { ok: false, error: "That design is not available." };
  const template = await getTemplate(slug);
  if (!template) return { ok: false, error: "That design is not available." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`hero:${ip}`, 24, 10 * 60_000)) return { ok: false, error: "Take a short break and try again in a few minutes." };

  return {
    ok: true,
    src: `/t/${mintAssetToken(template.slug, SECONDS)}/${template.slug}/`,
    expiresAtMs: Date.now() + SECONDS * 1000,
  };
}
