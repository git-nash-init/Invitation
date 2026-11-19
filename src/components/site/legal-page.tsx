import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="paper-bg px-5 pb-24 pt-6 sm:px-6">
        <article className="glass-strong mx-auto max-w-3xl rounded-[32px] p-7 sm:p-12">
          <h1 className="display text-[40px] leading-[1.08] sm:text-[52px]">{title}</h1>
          {updated && <p className="num mt-3 text-[14px] text-muted">Last updated {updated}</p>}
          <div className="mt-10 grid gap-9 text-[16px] leading-[27px] text-text-2 [&_a]:text-maroon [&_a]:underline [&_h2]:display [&_h2]:mb-2 [&_h2]:text-[26px] [&_h2]:leading-[1.15] [&_li]:ml-5 [&_li]:list-disc">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
