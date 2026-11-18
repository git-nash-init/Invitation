import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Template } from "@/lib/templates";

export function TemplateCard({ template, priority }: { template: Template; priority?: boolean }) {
  return (
    <Link
      href={`/preview/${template.slug}`}
      className="glass glass-interactive group flex flex-col overflow-hidden rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      {/* Inner radius = outer 16 - padding 8 = 8 */}
      <div className="p-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[8px]">
          <Image
            src={template.cover_path}
            alt={`${template.name} invitation`}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-3">
        <div>
          <p className="text-[12px] leading-4 text-muted">{template.category}</p>
          <h3 className="display mt-1 text-[24px] leading-[1.2]">{template.name}</h3>
          <p className="mt-2 text-[14px] leading-5 text-text-2">{template.tagline}</p>
        </div>
        <div className="mt-auto flex items-center justify-between text-[13px] text-text-2">
          <span className="num text-[12px] text-muted">{template.highlights}</span>
          <span className="inline-flex items-center gap-1 text-text transition-transform duration-200 group-hover:translate-x-0.5">
            Preview
            <ArrowUpRight size={16} strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </Link>
  );
}
