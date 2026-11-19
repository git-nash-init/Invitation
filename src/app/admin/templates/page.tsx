import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { saveCategory, saveTemplate } from "../actions";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesAdminPage({ searchParams }: { searchParams: Promise<{ ok?: string; e?: string }> }) {
  const { ok, e } = await searchParams;
  const supabase = await createClient();
  const [{ data: templates }, { data: categories }] = await Promise.all([
    supabase.from("templates").select("slug, name, price, list_price, is_active, category_slug, bullets").order("sort"),
    supabase.from("categories").select("slug, name, emoji, blurb, sort, is_active").order("sort"),
  ]);

  return (
    <>
      <h1 className="display text-[32px] leading-[1.15] sm:text-[36px]">Templates</h1>
      <p className="mt-2 max-w-[40rem] text-[14px] leading-5 text-text-2">
        Price, name and the short lines shown on each design. The price appears only on the publish page, when someone is ready to share. Changes show at once.
      </p>
      <Flash ok={ok} e={e} />

      <div className="mt-6 grid gap-4">
        {(templates ?? []).map((t) => (
          <form key={t.slug} action={saveTemplate} className="glass grid gap-3 rounded-[16px] p-5 sm:grid-cols-2">
            <input type="hidden" name="slug" value={t.slug} />
            <div>
              <label className="label" htmlFor={`n-${t.slug}`}>Name</label>
              <input id={`n-${t.slug}`} name="name" className="field" defaultValue={t.name} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor={`p-${t.slug}`}>Price in ₹</label>
                <input id={`p-${t.slug}`} name="price" type="number" min={1} className="field num" defaultValue={t.price} required />
                <p className="mt-1 text-[12px] text-muted">
                  Struck-through price (optional)
                </p>
                <input aria-label={`Struck-through price for ${t.name}`} name="list_price" type="number" min={0} className="field num mt-1" defaultValue={t.list_price ?? ""} placeholder="e.g. 999" />
              </div>
              <div>
                <label className="label" htmlFor={`c-${t.slug}`}>Category</label>
                <select id={`c-${t.slug}`} name="category_slug" className="field" defaultValue={t.category_slug ?? ""}>
                  <option value="">None</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor={`b-${t.slug}`}>Short lines shown on the design (one per line, up to three)</label>
              <textarea id={`b-${t.slug}`} name="bullets" rows={3} className="field" defaultValue={(t.bullets as string[]).join("\n")} />
            </div>
            <label className="flex items-center gap-3 text-[14px]">
              <input type="checkbox" name="is_active" defaultChecked={t.is_active} className="size-5 accent-[#f5a300]" />
              Shown on the website
            </label>
            <div className="sm:text-right">
              <Button type="submit" className="w-full sm:w-auto">Save {t.name}</Button>
            </div>
          </form>
        ))}
      </div>

      <h2 className="display mt-12 text-[24px] leading-[1.2]">Categories</h2>
      <p className="mt-2 text-[14px] leading-5 text-text-2">Groups for the designs. Add one any time, no deploy needed.</p>
      <div className="mt-4 grid gap-4">
        {[...(categories ?? []), null].map((c) => (
          <form key={c?.slug ?? "new"} action={saveCategory} className="glass grid gap-3 rounded-[16px] p-5 sm:grid-cols-[1fr_1fr_80px_80px]">
            <div>
              <label className="label" htmlFor={`cs-${c?.slug ?? "new"}`}>Code</label>
              <input id={`cs-${c?.slug ?? "new"}`} name="slug" className="field" defaultValue={c?.slug} readOnly={!!c} placeholder="birthday" required />
            </div>
            <div>
              <label className="label" htmlFor={`cn-${c?.slug ?? "new"}`}>Name</label>
              <input id={`cn-${c?.slug ?? "new"}`} name="name" className="field" defaultValue={c?.name} placeholder="Birthday" required />
            </div>
            <div>
              <label className="label" htmlFor={`ce-${c?.slug ?? "new"}`}>Emoji</label>
              <input id={`ce-${c?.slug ?? "new"}`} name="emoji" className="field" defaultValue={c?.emoji} placeholder="🎂" />
            </div>
            <div>
              <label className="label" htmlFor={`co-${c?.slug ?? "new"}`}>Order</label>
              <input id={`co-${c?.slug ?? "new"}`} name="sort" type="number" min={0} className="field num" defaultValue={c?.sort ?? 0} />
            </div>
            <div className="sm:col-span-4">
              <label className="label" htmlFor={`cb-${c?.slug ?? "new"}`}>One line shown under the name</label>
              <input id={`cb-${c?.slug ?? "new"}`} name="blurb" className="field" defaultValue={c?.blurb} />
            </div>
            <label className="flex items-center gap-3 text-[14px] sm:col-span-2">
              <input type="checkbox" name="is_active" defaultChecked={c ? c.is_active : true} className="size-5 accent-[#f5a300]" />
              Shown on the website
            </label>
            <div className="sm:col-span-2 sm:text-right">
              <Button type="submit" className="w-full sm:w-auto">{c ? "Save" : "Add category"}</Button>
            </div>
          </form>
        ))}
      </div>
    </>
  );
}
