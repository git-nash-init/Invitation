import Link from "next/link";
import { adminRpc } from "@/lib/admin";
import { ago, inr } from "@/lib/format";

type Money = { count: number; paise: number };
type Overview = {
  period: string;
  total: Money;
  by_template: Array<{ slug: string; name: string; count: number; paise: number }>;
  by_source: Array<{ source: string; count: number; paise: number }>;
  new_users: number;
  qrs: number;
  in_review: number;
  all_time: Money;
  invitations: { total: number; published: number; views: number };
  replies: number;
  last_cron: number;
};

// Server-rendered on every request, so reading the clock here is correct.
const nowSeconds = () => Math.floor(Date.now() / 1000);

const PERIODS = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["all", "All time"],
] as const;

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: raw } = await searchParams;
  const period = PERIODS.some(([k]) => k === raw) ? (raw as string) : "today";
  const d = await adminRpc<Overview>("admin_overview", { p_period: period });

  if (!d) {
    return <p role="alert" className="text-[14px] text-negative">Could not load the overview. Check that the database migrations are applied.</p>;
  }

  const nowUnix = nowSeconds();
  const cronAge = d.last_cron ? nowUnix - d.last_cron : null;
  const cronOk = cronAge !== null && cronAge < 180;
  const conversion = d.qrs > 0 ? Math.round((d.total.count / d.qrs) * 100) : 0;

  return (
    <>
      <h1 className="display text-[32px] leading-[1.15] sm:text-[36px]">Overview</h1>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Period">
        {PERIODS.map(([k, label]) => (
          <Link key={k} href={`/admin?period=${k}`} className={`btn btn-sm !h-9 ${k === period ? "btn-primary" : "btn-glass"}`}>
            {label}
          </Link>
        ))}
      </div>

      {d.in_review > 0 && (
        <Link href="/admin/orders?status=review" className="glass mt-5 flex items-center justify-between gap-4 rounded-[12px] border-accent p-4 text-[14px]">
          <span>
            <b>{d.in_review}</b> payment{d.in_review === 1 ? "" : "s"} waiting for your check
          </span>
          <span className="text-accent">Open orders</span>
        </Link>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Revenue", inr(d.total.paise)],
          ["Sales", String(d.total.count)],
          ["New users", String(d.new_users)],
          ["Paid of QRs", `${conversion}%`],
        ].map(([label, value]) => (
          <div key={label} className="glass rounded-[16px] p-4 sm:p-5">
            <dt className="text-[13px] leading-5 text-text-2">{label}</dt>
            <dd className="num mt-3 text-[26px] leading-none sm:text-[32px]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="glass rounded-[16px] p-5">
          <h2 className="text-[16px] font-medium leading-6">By template</h2>
          {d.by_template.length === 0 ? (
            <p className="mt-3 text-[14px] text-text-2">No sales in this period.</p>
          ) : (
            <ul className="mt-3 divide-y divide-(--hairline) text-[14px]">
              {d.by_template.map((r) => (
                <li key={r.slug} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate">{r.name}</span>
                  <span className="num shrink-0 text-text-2">
                    {r.count} · {inr(r.paise)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass rounded-[16px] p-5">
          <h2 className="text-[16px] font-medium leading-6">Ad vs bot</h2>
          {d.by_source.length === 0 ? (
            <p className="mt-3 text-[14px] text-text-2">No sales in this period.</p>
          ) : (
            <ul className="mt-3 divide-y divide-(--hairline) text-[14px]">
              {d.by_source.map((r) => (
                <li key={r.source} className="flex items-center justify-between gap-3 py-2.5">
                  <span>{r.source === "ad" ? "From ads" : "From the bot"}</span>
                  <span className="num text-text-2">
                    {r.count} · {inr(r.paise)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass rounded-[16px] p-5">
          <h2 className="text-[16px] font-medium leading-6">All time</h2>
          <p className="num mt-3 text-[26px] leading-none">{inr(d.all_time.paise)}</p>
          <p className="mt-2 text-[13px] text-text-2">{d.all_time.count} sales</p>
        </section>

        <section className="glass rounded-[16px] p-5">
          <h2 className="text-[16px] font-medium leading-6">Invitations on the site</h2>
          <dl className="num mt-3 grid grid-cols-3 gap-3 text-center">
            {[
              ["Created", d.invitations.total],
              ["Published", d.invitations.published],
              ["Views", d.invitations.views],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dd className="text-[22px] leading-none">{value}</dd>
                <dt className="mt-1 text-[12px] text-muted">{label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[13px] text-text-2">{d.replies} guest replies in total</p>
        </section>
      </div>

      <p className="mt-6 flex items-center gap-2 text-[13px] text-text-2">
        <span className={`seal ${cronOk ? "" : "seal-draft"}`} aria-hidden="true" />
        {cronAge === null
          ? "The every-minute worker has not run yet. See Setup."
          : cronOk
            ? `Worker running · last ran ${ago(d.last_cron, nowUnix)}`
            : `Worker looks stopped · last ran ${ago(d.last_cron, nowUnix)}. See Setup.`}
      </p>
    </>
  );
}
