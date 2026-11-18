import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { Button } from "@/components/ui/button";
import { adminRpc } from "@/lib/admin";
import { deleteUpi, saveUpi } from "../actions";

export const metadata: Metadata = { title: "Payments" };

type Upi = { id: number; label: string; vpa: string; payee_name: string; active: number; daily_limit: number; today_count: number };

function UpiForm({ u }: { u?: Upi }) {
  return (
    <form action={saveUpi} className="grid gap-3 sm:grid-cols-2">
      {u && <input type="hidden" name="id" value={u.id} />}
      <div>
        <label className="label" htmlFor={`vpa-${u?.id ?? "new"}`}>UPI ID</label>
        <input id={`vpa-${u?.id ?? "new"}`} name="vpa" className="field" defaultValue={u?.vpa} placeholder="name@okhdfcbank" autoCapitalize="off" required />
      </div>
      <div>
        <label className="label" htmlFor={`pn-${u?.id ?? "new"}`}>Receiver name, exactly as payers see it</label>
        <input id={`pn-${u?.id ?? "new"}`} name="payee_name" className="field" defaultValue={u?.payee_name} required />
      </div>
      <div>
        <label className="label" htmlFor={`lb-${u?.id ?? "new"}`}>Label (only you see this)</label>
        <input id={`lb-${u?.id ?? "new"}`} name="label" className="field" defaultValue={u?.label} />
      </div>
      <div>
        <label className="label" htmlFor={`dl-${u?.id ?? "new"}`}>Payments a day (0 = no limit)</label>
        <input id={`dl-${u?.id ?? "new"}`} name="daily_limit" type="number" min={0} className="field" defaultValue={u?.daily_limit ?? 0} />
      </div>
      <label className="flex items-center gap-3 text-[14px] sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked={u ? u.active === 1 : true} className="size-5 accent-[#e8a93b]" />
        On (new QR codes may use this ID)
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" className="w-full sm:w-auto">{u ? "Save" : "Add UPI ID"}</Button>
      </div>
    </form>
  );
}

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ ok?: string; e?: string }> }) {
  const { ok, e } = await searchParams;
  const upis = (await adminRpc<Upi[]>("admin_upi_list")) ?? [];

  return (
    <>
      <h1 className="display text-[32px] leading-[1.15] sm:text-[36px]">Payments</h1>
      <p className="mt-2 max-w-[40rem] text-[14px] leading-5 text-text-2">
        New QR codes use the first UPI ID that is on and under its daily limit. The receiver name must match what your
        UPI app shows to people paying you, because the payment check compares it.
      </p>
      <Flash ok={ok} e={e} />

      <div className="mt-6 grid gap-4">
        {upis.map((u) => (
          <section key={u.id} className="glass rounded-[16px] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[15px]">
                <span className={`seal ${u.active ? "" : "seal-draft"}`} aria-hidden="true" />
                <span className="num">{u.vpa}</span>
                <span className="text-[13px] text-muted">{u.today_count} paid today</span>
              </p>
              <form action={deleteUpi}>
                <input type="hidden" name="id" value={u.id} />
                <Button type="submit" variant="danger" size="sm">Delete</Button>
              </form>
            </div>
            <UpiForm u={u} />
          </section>
        ))}

        <section className="glass rounded-[16px] p-5">
          <h2 className="mb-4 text-[16px] font-medium leading-6">Add a UPI ID</h2>
          <UpiForm />
        </section>
      </div>
    </>
  );
}
