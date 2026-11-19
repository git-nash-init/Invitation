import type { Metadata } from "next";
import { adminRpc } from "@/lib/admin";
import { inr } from "@/lib/format";

export const metadata: Metadata = { title: "People" };

type Person = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  invitations: number;
  published: number;
  paid_paise: number;
};

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—";

export default async function UsersPage() {
  const people = (await adminRpc<Person[]>("admin_users", { p_limit: 200 })) ?? [];

  return (
    <>
      <h1 className="display text-[36px] leading-[1.1]">People</h1>
      <p className="mt-2 max-w-[42rem] text-[15px] leading-6 text-text-2">Everyone who has signed up, newest first.</p>

      <div className="glass mt-6 overflow-x-auto rounded-[20px]">
        <table className="w-full min-w-[720px] border-collapse text-left text-[14px] leading-5">
          <thead>
            <tr className="border-b border-(--hairline) text-text-2">
              {["Email", "Joined", "Last seen", "Invitations", "Published", "Paid"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-2">
                  No one has signed up yet.
                </td>
              </tr>
            )}
            {people.map((p) => (
              <tr key={p.id} className="border-b border-(--hairline) last:border-0">
                <td className="px-4 py-3 font-medium">{p.email}</td>
                <td className="num px-4 py-3 text-text-2">{day(p.created_at)}</td>
                <td className="num px-4 py-3 text-text-2">{day(p.last_sign_in_at)}</td>
                <td className="num px-4 py-3">{p.invitations}</td>
                <td className="num px-4 py-3">{p.published}</td>
                <td className="num px-4 py-3 font-semibold">{p.paid_paise ? inr(p.paid_paise) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
