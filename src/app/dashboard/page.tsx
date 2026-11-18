import type { Metadata } from "next";
import Image from "next/image";
import { Eye, Users } from "lucide-react";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { LinkButton } from "@/components/ui/button";
import { getMyInvitations, getStats } from "@/lib/invitations/queries";
import { getTemplates } from "@/lib/templates";

export const metadata: Metadata = { title: "Invitations", robots: { index: false } };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [invitations, stats, templates] = await Promise.all([
    getMyInvitations(),
    getStats(),
    getTemplates(),
  ]);
  const byTemplate = Object.fromEntries(templates.map((t) => [t.slug, t]));

  const published = invitations.filter((i) => i.status === "published").length;
  const views = invitations.reduce((n, i) => n + Number(i.view_count), 0);
  const replies = Object.values(stats).reduce((n, s) => n + s.replies, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[32px] leading-[1.15] sm:text-[36px]">Invitations</h1>
        <LinkButton href="/templates">New invitation</LinkButton>
      </div>

      {error === "create" && (
        <p role="alert" className="mt-4 text-[14px] text-negative">
          We could not create that invitation. Try again.
        </p>
      )}

      <dl className="mt-8 grid grid-cols-3 gap-3">
        {[
          ["Invitations", invitations.length],
          ["Published", published],
          ["Replies", replies],
        ].map(([label, value]) => (
          <div key={label as string} className="glass rounded-[16px] p-5">
            <dt className="text-[13px] leading-5 text-text-2">{label}</dt>
            <dd className="num mt-3 text-[32px] leading-none">{value}</dd>
          </div>
        ))}
      </dl>
      {views > 0 && (
        <p className="num mt-3 text-[12px] text-muted">{views} total views</p>
      )}

      <section className="mt-10" aria-label="Your invitations">
        {invitations.length === 0 ? (
          <div className="glass rounded-[20px] px-8 py-16 text-center">
            <h2 className="display text-[24px] leading-[1.2]">No invitations yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-5 text-text-2">
              Pick a template, make it yours, and publish it to get a link you can share.
            </p>
            <LinkButton href="/templates" className="mt-8">
              Choose a template
            </LinkButton>
          </div>
        ) : (
          <ul className="grid gap-3">
            {invitations.map((inv) => {
              const t = byTemplate[inv.template_slug];
              const s = stats[inv.id];
              const live = inv.status === "published";
              return (
                <li key={inv.id} className="glass rounded-[16px] p-3">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-[96px] w-full shrink-0 overflow-hidden rounded-[8px] sm:w-[144px]">
                      {t && (
                        <Image
                          src={t.cover_path}
                          alt=""
                          fill
                          sizes="144px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[12px] leading-4 text-text-2">
                        <span className={`seal ${live ? "" : "seal-draft"}`} />
                        {live ? "Published" : "Draft"}
                        <span className="text-muted">{t?.name}</span>
                      </p>
                      <h2 className="mt-1 truncate text-[18px] font-medium leading-6">
                        {inv.title}
                      </h2>
                      <p className="num mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Eye size={14} strokeWidth={1.5} aria-hidden="true" />
                          {inv.view_count} views
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users size={14} strokeWidth={1.5} aria-hidden="true" />
                          {s?.guests ?? 0} guests
                        </span>
                        <span>{s?.replies ?? 0} replies</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                      <LinkButton href={`/studio/${inv.id}`} size="sm">
                        Edit
                      </LinkButton>
                      <LinkButton href={`/dashboard/${inv.id}/guests`} variant="glass" size="sm">
                        Guests and replies
                      </LinkButton>
                      {live && inv.guest_mode === "common" && (
                        <LinkButton
                          href={`/i/${inv.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="ghost"
                          size="sm"
                        >
                          Open
                        </LinkButton>
                      )}
                      <DeleteButton id={inv.id} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
