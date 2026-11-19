import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { LegalPage } from "@/components/site/legal-page";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  const rows = [
    BUSINESS.email && { icon: Mail, label: "Email", value: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
    BUSINESS.phone && { icon: Phone, label: "Phone and WhatsApp", value: BUSINESS.phone, href: `tel:${BUSINESS.phone.replace(/\s/g, "")}` },
    BUSINESS.address && { icon: MapPin, label: "Address", value: BUSINESS.address, href: undefined },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <LegalPage title="Contact us">
      <section>
        <p>
          Questions about your invitation, a payment or a refund? We are happy to help. Please include the email you signed up with.
        </p>
      </section>
      {rows.length > 0 ? (
        <section className="grid gap-4">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-4 rounded-2xl bg-[rgba(245,163,0,0.1)] p-5">
              <r.icon size={22} strokeWidth={1.9} className="mt-1 shrink-0 text-maroon" aria-hidden="true" />
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-crimson">{r.label}</p>
                {r.href ? (
                  <a href={r.href} className="mt-1 block text-[18px] font-medium">
                    {r.value}
                  </a>
                ) : (
                  <p className="mt-1 text-[18px] font-medium text-text">{r.value}</p>
                )}
              </div>
            </div>
          ))}
          <p className="text-[15px]">Trading as {BUSINESS.name}.</p>
        </section>
      ) : (
        <section>
          <p className="rounded-2xl bg-[rgba(245,163,0,0.1)] p-5 text-text">Our contact details are being added. Please check back shortly.</p>
        </section>
      )}
    </LegalPage>
  );
}
