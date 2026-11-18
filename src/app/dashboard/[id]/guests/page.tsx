import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { GuestManager } from "@/components/dashboard/guest-manager";
import { LinkButton } from "@/components/ui/button";
import { getGuests, getMyInvitation, getRsvps } from "@/lib/invitations/queries";

export const metadata: Metadata = { title: "Guests and replies", robots: { index: false } };

const STATUS: Record<string, string> = {
  attending: "Yes",
  maybe: "Maybe",
  "not-attending": "No",
};

export default async function GuestsPage({ params }: PageProps<"/dashboard/[id]/guests">) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const invitation = await getMyInvitation(id);
  if (!invitation) notFound();

  const [guests, rsvps] = await Promise.all([getGuests(id), getRsvps(id)]);
  const personalised = invitation.guest_mode === "personalised";
  const going = rsvps.filter((r) => r.attending).reduce((n, r) => n + r.headcount, 0);

  // RSVP answers are keyed by the ceremony's position in the template config.
  const ceremonies = (invitation.config.ceremonies ?? invitation.config.events ?? []) as Array<{
    name?: unknown;
  }>;
  const eventName = (key: string) => {
    const c = Array.isArray(ceremonies) ? ceremonies[Number(key)] : undefined;
    return typeof c?.name === "string" && c.name ? c.name : `Event ${Number(key) + 1}`;
  };

  return (
    <>
      <Link href="/dashboard" className="btn btn-ghost btn-sm -ml-3">
        <ArrowLeft size={16} strokeWidth={1.5} />
        Invitations
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[32px] leading-[1.15] sm:text-[36px]">Guests and replies</h1>
          <p className="mt-1 text-[14px] text-text-2">{invitation.title}</p>
        </div>
        <LinkButton href={`/studio/${id}`} variant="glass">
          Edit invitation
        </LinkButton>
      </div>

      <section className="mt-10" aria-labelledby="guests-h">
        <h2 id="guests-h" className="text-[18px] font-medium leading-6">
          Guest links
        </h2>
        {personalised ? (
          <div className="mt-4">
            <GuestManager
              invitationId={id}
              slug={invitation.slug}
              published={invitation.status === "published"}
              guests={guests}
            />
          </div>
        ) : (
          <div className="glass mt-4 rounded-[16px] p-5 text-[14px] leading-5 text-text-2">
            This invitation uses one link for everyone. To give each guest a personal link with
            their name on it, switch to a personal link per guest in the publish panel.
            <div className="mt-4">
              <LinkButton href={`/studio/${id}`} size="sm">
                Open publish panel
              </LinkButton>
            </div>
          </div>
        )}
      </section>

      <section className="mt-12" aria-labelledby="replies-h">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="replies-h" className="text-[18px] font-medium leading-6">
            Replies
          </h2>
          <p className="num text-[13px] text-text-2">
            {rsvps.length} replies, {going} people coming
          </p>
        </div>

        {rsvps.length === 0 ? (
          <p className="mt-4 text-[14px] text-text-2">No replies yet.</p>
        ) : (
          <div className="glass mt-4 overflow-x-auto rounded-[16px]">
            <table className="w-full min-w-[640px] border-collapse text-left text-[14px] leading-5">
              <thead>
                <tr className="border-b border-(--hairline) text-[13px] text-text-2">
                  <th scope="col" className="px-5 py-3 font-normal">Name</th>
                  <th scope="col" className="px-5 py-3 font-normal">Answers</th>
                  <th scope="col" className="px-5 py-3 text-right font-normal">People</th>
                  <th scope="col" className="px-5 py-3 font-normal">Note</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r) => (
                  <tr key={r.id} className="border-b border-(--hairline) align-top last:border-0">
                    <td className="px-5 py-3">
                      {r.name}
                      {r.contact && <span className="num block text-[12px] text-muted">{r.contact}</span>}
                    </td>
                    <td className="px-5 py-3 text-text-2">
                      {r.responses.length === 0
                        ? r.attending
                          ? "Coming"
                          : "Not coming"
                        : r.responses
                            .map((x) => `${eventName(x.event)}: ${STATUS[x.status] ?? x.status}`)
                            .join(", ")}
                    </td>
                    <td className="num px-5 py-3 text-right">{r.attending ? r.headcount : 0}</td>
                    <td className="px-5 py-3 text-text-2">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
