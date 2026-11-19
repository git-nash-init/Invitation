import Link from "next/link";
import { adminRpc } from "@/lib/admin";
import { inr } from "@/lib/format";

type Overview = {
  revenue_paise: number;
  paid: number;
  pending: number;
  failed: number;
  refunded: number;
  users: number;
  invitations: number;
  published: number;
  by_template: Array<{ template_slug: string; n: number; revenue_paise: number }>;
  daily: Array<{ day: string; n: number; revenue_paise: number }>;
};

const PERIODS = [
  ["today", "Today"],
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["all", "All time"],
] as const;

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="glass rounded-[20px] p-5">
      <p className="text-[13px] font-medium text-text-2">{label}</p>
      <p className="num mt-2 text-[32px] font-semibold leading-none text-maroon">{value}</p>
      {hint && <p className="mt-2 text-[13px] text-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: raw } = await searchParams;
  const period = PERIODS.some(([k]) => k === raw) ? (raw as string) : "30d";
  const d = await adminRpc<Overview>("admin_overview", { p_period: period });

  if (!d) {
    return (
      <p role="alert" className="text-[15px] text-negative">
        Could not load the overview. Check that the database migrations are applied.
      </p>
    );
  }

  const peak = Math.max(1, ...d.daily.map((x) => x.revenue_paise));

  return (
    <>
      <h1 className="display text-[36px] leading-[1.1]">Overview</h1>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Period">
        {PERIODS.map(([k, label]) => (
          <Link key={k} href={`/admin?period=${k}`} className={`btn btn-sm ${k === period ? "btn-primary" : "btn-glass"}`}>
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={inr(d.revenue_paise)} hint={`${d.paid} paid order${d.paid === 1 ? "" : "s"}`} />
        <Stat label="Waiting to pay" value={d.pending} hint="Checkout opened, not paid" />
        <Stat label="Failed or refunded" value={`${d.failed} / ${d.refunded}`} hint="In this period" />
        <Stat label="Published" value={d.published} hint={`of ${d.invitations} invitations`} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Stat label="People signed up" value={d.users} />
        <Stat label="Invitations made" value={d.invitations} />
      </div>

      <section className="glass mt-8 rounded-[20px] p-6">
        <h2 className="display text-[24px] leading-[1.2]">Revenue by day</h2>
        {d.daily.length === 0 ? (
          <p className="mt-3 text-[15px] text-text-2">No paid orders in this period yet.</p>
        ) : (
          <ol className="mt-5 grid gap-2">
            {d.daily.map((x) => (
              <li key={x.day} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 text-[14px]">
                <span className="num text-text-2">{x.day.slice(5)}</span>
                <span className="h-3 rounded-full bg-[rgba(107,15,43,0.08)]">
                  <span
                    className="block h-3 rounded-full bg-gradient-to-r from-[#ffd66b] to-[#f5a300]"
                    style={{ width: `${Math.max(4, (x.revenue_paise / peak) * 100)}%` }}
                  />
                </span>
                <span className="num font-medium">{inr(x.revenue_paise)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="glass mt-6 rounded-[20px] p-6">
        <h2 className="display text-[24px] leading-[1.2]">By design</h2>
        {d.by_template.length === 0 ? (
          <p className="mt-3 text-[15px] text-text-2">Nothing sold in this period yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {d.by_template.map((t) => (
              <li key={t.template_slug} className="flex items-center justify-between text-[15px]">
                <span className="font-medium">{t.template_slug}</span>
                <span className="num text-text-2">
                  {t.n} sold · {inr(t.revenue_paise)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
