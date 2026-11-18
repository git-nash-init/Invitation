import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getCurrentUser } from "@/lib/invitations/queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  return (
    <div className="paper-bg flex min-h-screen flex-col lg:flex-row">
      <Sidebar name={user.name} email={user.email} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-12">
        <div className="mx-auto max-w-[1100px]">{children}</div>
      </main>
    </div>
  );
}
