import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { Button } from "@/components/ui/button";
import { adminRpc } from "@/lib/admin";
import { ago, istTime } from "@/lib/format";
import { connectBot } from "../actions";

export const metadata: Metadata = { title: "Setup" };

type Status = {
  last_cron: number;
  server_now: number;
  upi_active: number;
  templates_live: number;
  tracks_active: number;
  preview_media: number;
  in_review: number;
};

type PreviewRow = {
  template_slug: string;
  tg_user_id: number;
  tg_name: string;
  views: number;
  max_views: number;
  created_at: string;
  last_seen_at: string | null;
};

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ ok?: string; e?: string }> }) {
  const { ok, e } = await searchParams;
  const [s, log] = await Promise.all([
    adminRpc<Status>("admin_setup_status"),
    adminRpc<PreviewRow[]>("admin_preview_log", { p_limit: 50 }),
  ]);

  if (!s) return <p role="alert" className="text-[14px] text-negative">Could not load the setup status.</p>;

  const cronAge = s.last_cron ? s.server_now - s.last_cron : null;
  const checks: Array<[string, boolean, string]> = [
    ["Every-minute worker is running", cronAge !== null && cronAge < 180, cronAge === null ? "Never ran. Schedule it (step in the guide)." : `Last ran ${ago(s.last_cron, s.server_now)}`],
    ["A UPI ID is on", s.upi_active > 0, "Add one on the Payments tab."],
    ["At least one template is live", s.templates_live > 0, "Turn one on in Templates."],
    ["Preview images or videos uploaded", s.preview_media > 0, "Run the preview script and upload (see the guide)."],
    ["Music tracks are on", s.tracks_active > 0, "Optional: add tracks in Music."],
  ];

  return (
    <>
      <h1 className="display text-[32px] leading-[1.15] sm:text-[36px]">Setup</h1>
      <Flash ok={ok} e={e} />

      <section className="glass mt-6 rounded-[16px] p-5">
        <h2 className="text-[16px] font-medium leading-6">Telegram bot</h2>
        <p className="mt-2 text-[14px] leading-5 text-text-2">
          After you set the secrets in Supabase (see the guide), press this once. It connects Telegram to the bot and
          sets the bot&apos;s menu. Press it again any time you change the bot token.
        </p>
        <form action={connectBot} className="mt-4">
          <Button type="submit" className="w-full sm:w-auto">Connect Telegram bot</Button>
        </form>
      </section>

      <section className="glass mt-6 rounded-[16px] p-5">
        <h2 className="text-[16px] font-medium leading-6">Checks</h2>
        <ul className="mt-3 divide-y divide-(--hairline) text-[14px]">
          {checks.map(([label, ok, hint]) => (
            <li key={label} className="flex items-start gap-3 py-3">
              <span className={`seal mt-1.5 ${ok ? "" : "seal-draft"}`} aria-hidden="true" />
              <div>
                <p>{label}</p>
                {!ok || label.startsWith("Every") ? <p className="text-[13px] text-text-2">{hint}</p> : null}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] leading-5 text-text-2">
          The bot token, webhook and AI key are secrets, so they cannot be shown here. To confirm the bot is connected, send
          <code className="num mx-1 rounded bg-[rgba(239,233,222,0.08)] px-1.5 py-0.5">/id</code>
          to it: it answers with your Telegram ID.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-[16px] font-medium leading-6">Demo links (who opened what)</h2>
        <p className="mt-1 text-[13px] leading-5 text-text-2">Each private demo is tied to one Telegram account, so a leak can be traced.</p>
        {(log ?? []).length === 0 ? (
          <p className="mt-4 text-[14px] text-text-2">No demos opened yet.</p>
        ) : (
          <div className="glass mt-4 overflow-x-auto rounded-[16px]">
            <table className="w-full min-w-[560px] border-collapse text-left text-[14px] leading-5">
              <thead>
                <tr className="border-b border-(--hairline) text-[13px] text-text-2">
                  <th scope="col" className="px-4 py-3 font-normal">Template</th>
                  <th scope="col" className="px-4 py-3 font-normal">Telegram user</th>
                  <th scope="col" className="px-4 py-3 text-right font-normal">Views</th>
                  <th scope="col" className="px-4 py-3 font-normal">Created</th>
                </tr>
              </thead>
              <tbody>
                {(log ?? []).map((r, i) => (
                  <tr key={i} className="border-b border-(--hairline) last:border-0">
                    <td className="px-4 py-3">{r.template_slug}</td>
                    <td className="px-4 py-3">
                      {r.tg_name}
                      <span className="num block text-[12px] text-muted">{r.tg_user_id}</span>
                    </td>
                    <td className="num px-4 py-3 text-right">{r.views} / {r.max_views}</td>
                    <td className="num px-4 py-3 text-[13px] text-text-2">{istTime(Math.floor(new Date(r.created_at).getTime() / 1000))}</td>
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
