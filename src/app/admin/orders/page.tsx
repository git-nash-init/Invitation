import type { Metadata } from "next";
import Link from "next/link";
import { adminRpc } from "@/lib/admin";
import { inr } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

type Order = {
  id: string;
  email: string | null;
  template_slug: string;
  amount_paise: number;
  status: "created" | "paid" | "failed" | "refunded";
  method: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  failure_reason: string | null;
  created_at: string;
  paid_at: string | null;
};

const FILTERS = [
  ["", "All"],
  ["paid", "Paid"],
  ["created", "Waiting"],
  ["failed", "Failed"],
  ["refunded", "Refunded"],
] as const;

const LABEL: Record<Order["status"], string> = { created: "Waiting", paid: "Paid", failed: "Failed", refunded: "Refunded" };
const TONE: Record<Order["status"], string> = {
  created: "bg-[rgba(245,163,0,0.18)] text-[#8a5200]",
  paid: "bg-[rgba(14,138,95,0.14)] text-positive",
  failed: "bg-[rgba(198,40,57,0.1)] text-negative",
  refunded: "bg-[rgba(107,15,43,0.1)] text-maroon",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = FILTERS.some(([k]) => k === raw) ? (raw ?? "") : "";
  const orders = (await adminRpc<Order[]>("admin_orders", { p_status: status, p_limit: 200 })) ?? [];

  return (
    <>
      <h1 className="display text-[36px] leading-[1.1]">Orders</h1>
      <p className="mt-2 max-w-[42rem] text-[15px] leading-6 text-text-2">
        Every checkout, newest first. Refunds are made in the Razorpay dashboard; they show here as soon as Razorpay confirms them.
      </p>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter">
        {FILTERS.map(([k, label]) => (
          <Link key={k} href={k ? `/admin/orders?status=${k}` : "/admin/orders"} className={`btn btn-sm ${k === status ? "btn-primary" : "btn-glass"}`}>
            {label}
          </Link>
        ))}
      </div>

      <div className="glass mt-6 overflow-x-auto rounded-[20px]">
        <table className="w-full min-w-[820px] border-collapse text-left text-[14px] leading-5">
          <thead>
            <tr className="border-b border-(--hairline) text-text-2">
              {["When", "Customer", "Design", "Amount", "Status", "Razorpay payment"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-2">
                  No orders here yet.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-(--hairline) last:border-0">
                <td className="num px-4 py-3 text-text-2">{when(o.paid_at ?? o.created_at)}</td>
                <td className="px-4 py-3">{o.email ?? "Deleted user"}</td>
                <td className="px-4 py-3">{o.template_slug}</td>
                <td className="num px-4 py-3 font-semibold">{inr(o.amount_paise)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-3 py-1 text-[12px] font-semibold ${TONE[o.status]}`}>{LABEL[o.status]}</span>
                  {o.failure_reason && <span className="mt-1 block max-w-[220px] text-[12px] text-muted">{o.failure_reason}</span>}
                </td>
                <td className="num px-4 py-3 text-[12px] text-text-2">
                  {o.razorpay_payment_id ?? "—"}
                  {o.method && <span className="block">{o.method}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
