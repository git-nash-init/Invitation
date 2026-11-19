/** Shows the result of the last admin action, passed in the address as ?ok= or ?e=. */
export function Flash({ ok, e }: { ok?: string; e?: string }) {
  if (!ok && !e) return null;
  return (
    <p role={e ? "alert" : "status"} className={`mt-4 rounded-[10px] border px-4 py-3 text-[14px] ${e ? "border-[rgba(198,40,57,0.3)] text-negative" : "border-[rgba(14,138,95,0.3)] text-positive"}`}>
      {e ?? ok}
    </p>
  );
}
