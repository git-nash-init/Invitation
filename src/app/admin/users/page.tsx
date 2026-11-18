import type { Metadata } from "next";
import { adminRpc } from "@/lib/admin";
import { inr, istTime } from "@/lib/format";

export const metadata: Metadata = { title: "Users" };

type BotUser = {
  id: number;
  first_name: string;
  username: string;
  started_at: number;
  blocked: number;
  bot_blocked: number;
  fake_count: number;
  click: string;
  purchases: number;
  paise: number;
};

export default async function UsersPage() {
  const users = (await adminRpc<BotUser[]>("admin_users", { p_limit: 200 })) ?? [];

  return (
    <>
      <h1 className="display text-[32px] leading-[1.15] sm:text-[36px]">Users</h1>
      <p className="mt-2 text-[14px] leading-5 text-text-2">
        People who started the bot. Block or unblock someone from the bot with <code className="num rounded bg-[rgba(239,233,222,0.08)] px-1.5 py-0.5">/block ID</code> and{" "}
        <code className="num rounded bg-[rgba(239,233,222,0.08)] px-1.5 py-0.5">/unblock ID</code>.
      </p>

      {users.length === 0 ? (
        <p className="mt-6 text-[14px] text-text-2">Nobody has started the bot yet.</p>
      ) : (
        <div className="glass mt-6 overflow-x-auto rounded-[16px]">
          <table className="w-full min-w-[680px] border-collapse text-left text-[14px] leading-5">
            <thead>
              <tr className="border-b border-(--hairline) text-[13px] text-text-2">
                <th scope="col" className="px-4 py-3 font-normal">User</th>
                <th scope="col" className="px-4 py-3 font-normal">Joined</th>
                <th scope="col" className="px-4 py-3 text-right font-normal">Bought</th>
                <th scope="col" className="px-4 py-3 text-right font-normal">Spent</th>
                <th scope="col" className="px-4 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-(--hairline) last:border-0">
                  <td className="px-4 py-3">
                    {u.first_name || "User"}
                    <span className="num block text-[12px] text-muted">
                      {u.username ? `@${u.username} · ` : ""}
                      {u.id}
                    </span>
                  </td>
                  <td className="num px-4 py-3 text-[13px] text-text-2">{istTime(u.started_at)}</td>
                  <td className="num px-4 py-3 text-right">{u.purchases}</td>
                  <td className="num px-4 py-3 text-right">{u.paise ? inr(u.paise) : "-"}</td>
                  <td className="px-4 py-3 text-[13px]">
                    {u.blocked ? <span className="text-negative">Blocked</span> : u.bot_blocked ? <span className="text-text-2">Left the bot</span> : u.fake_count ? <span className="text-accent">{u.fake_count} warning{u.fake_count === 1 ? "" : "s"}</span> : <span className="text-text-2">Active</span>}
                    {u.click && <span className="ml-2 text-muted">ad</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
