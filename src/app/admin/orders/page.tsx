import type { Metadata } from "next";
import Link from "next/link";
import { adminRpc } from "@/lib/admin";
import { inr, istTime } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

type Order = {
  id: string;
  user_id: number;
  first_name: string | null;
  username: string | null;
  template_name: string;
  amount_paise: number;
  status: string;
  is_test: number;
  source: string;
  utr: string;
  created_at: number;
  paid_at: number;
};

const FILTERS = [
  [null, "All"],
  ["review", "Needs check"],
  ["pending", "Waiting to pay"],
  ["paid", "Paid"],
  ["rejected", "Rejected"],
  ["revoked", "Removed"],
] as const;

const BADGE: Record<string, string> = {
  paid: "text-positive",
  review: "text-accent",
  rejected: "text-negative",
  revoked: "text-negative",
  pending: "text-text-2",
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = FILTERS.some(([k]) => k === raw) ? (raw as string) : null;
  const orders = (await adminRpc<Order[]>("admin_orders", { p_status: status, p_limit: 200 })) ?? [];

  return (
    <>
      <h1 className="display text-[32px] leading-[1.15] sm:text-[36px]">Orders</h1>
      <p className="mt-2 text-[14px] leading-5 text-text-2">
        Payments that need a check arrive in your Telegram with Approve and Reject buttons. Remove a wrong sale with
        <code className="num mx-1 rounded bg-[rgba(239,233,222,0.08)] px-1.5 py-0.5">/revoke ORDER-ID</code>
        in the bot.
      </p>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Status">
        {FILTERS.map(([k, label]) => (
          <Link key={label} href={k ? `/admin/orders?status=${k}` : "/admin/orders"} className={`btn btn-sm !h-9 ${k === status ? "btn-primary" : "btn-glass"}`}>
            {label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-6 text-[14px] text-text-2">No orders here.</p>
      ) : (
        <div className="glass mt-6 overflow-x-auto rounded-[16px]">
          <table className="w-full min-w-[720px] border-collapse text-left text-[14px] leading-5">
            <thead>
              <tr className="border-b border-(--hairline) text-[13px] text-text-2">
                <th scope="col" className="px-4 py-3 font-normal">Order</th>
                <th scope="col" className="px-4 py-3 font-normal">Buyer</th>
                <th scope="col" className="px-4 py-3 font-normal">Template</th>
                <th scope="col" className="px-4 py-3 text-right font-normal">Amount</th>
                <th scope="col" className="px-4 py-3 font-normal">Status</th>
                <th scope="col" className="px-4 py-3 font-normal">When</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-(--hairline) align-top last:border-0">
                  <td className="num px-4 py-3 text-[13px]">
                    {o.id}
                    {o.is_test === 1 && <span className="ml-2 text-muted">test</span>}
                    {o.utr && <span className="block text-[12px] text-muted">UTR {o.utr}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {o.first_name || "User"}
                    <span className="num block text-[12px] text-muted">
                      {o.username ? `@${o.username} · ` : ""}
                      {o.user_id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-2">{o.template_name}</td>
                  <td className="num px-4 py-3 text-right">{inr(o.amount_paise)}</td>
                  <td className={`px-4 py-3 ${BADGE[o.status] ?? ""}`}>
                    {o.status}
                    {o.source === "ad" && <span className="ml-2 text-[12px] text-muted">ad</span>}
                  </td>
                  <td className="num px-4 py-3 text-[13px] text-text-2">{istTime(o.paid_at || o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
