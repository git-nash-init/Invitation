import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="paper-bg px-6 pb-24 pt-16">
        <article className="glass mx-auto max-w-3xl rounded-[20px] p-8 sm:p-12">
          <h1 className="display text-[40px] leading-[1.1]">{title}</h1>
          <p className="num mt-3 text-[12px] text-muted">Last updated {updated}</p>
          <div className="mt-10 grid gap-8 text-[15px] leading-[24px] text-text-2 [&_h2]:text-[18px] [&_h2]:font-medium [&_h2]:leading-6 [&_h2]:text-text">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
