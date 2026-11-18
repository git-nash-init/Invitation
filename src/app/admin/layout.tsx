import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/site/logo";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="paper-bg flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-(--hairline) bg-bg-deep lg:sticky lg:top-0 lg:h-screen lg:w-[240px] lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:flex-col lg:items-stretch lg:gap-6 lg:p-4">
          <Logo />
          <p className="num hidden truncate px-2 text-[12px] text-muted lg:block">{user.email}</p>
          <Link href="/dashboard" className="btn btn-ghost btn-sm lg:hidden">
            Exit
          </Link>
        </div>
        <div className="lg:px-4">
          <AdminNav />
        </div>
        <div className="hidden px-4 pb-4 lg:absolute lg:bottom-0 lg:block lg:w-full">
          <Link href="/dashboard" className="btn btn-ghost btn-sm w-full !justify-start">
            Exit admin
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
