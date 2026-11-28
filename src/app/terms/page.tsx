import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="19 November 2026">
      <section>
        <h2>The service</h2>
        <p>
          {BRAND.name} lets you customize an interactive invitation design for free, and publish it
          to get a link you can share, with optional personal links for each guest and RSVP replies.
          Publishing an invitation is a paid, one-time purchase for that invitation.
        </p>
      </section>
      <section>
        <h2>Payment</h2>
        <p>
          The one-time charge is shown on the publish page before you pay, in Indian rupees. Payment is taken
          by our payment partner, Cashfree Payments (UPI, cards, netbanking and wallets); we do not see or store your card or bank
          details. Your invitation is published once the payment is confirmed. There is no
          subscription and nothing renews. See the <Link href="/refund">Refunds and cancellation</Link>{" "}
          page for what happens if something goes wrong.
        </p>
      </section>
      <section>
        <h2>Your content</h2>
        <p>
          You are responsible for what you add to an invitation and for having the right to use the
          photos and music you upload. Do not upload anything unlawful, harmful or that belongs to
          someone else.
        </p>
      </section>
      <section>
        <h2>Licence to use designs</h2>
        <p>
          Each published invitation gives you a personal, non-transferable licence to use that design
          for your own celebration. You may not copy, resell or redistribute the designs, artwork or
          code, or use the previews to build a competing product.
        </p>
      </section>
      <section>
        <h2>Accounts</h2>
        <p>Keep your login details private. You are responsible for activity under your account.</p>
      </section>
      <section>
        <h2>Availability</h2>
        <p>
          We work to keep the service available, but we do not promise it will always be
          uninterrupted or error free.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms? Use the <Link href="/contact">contact page</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
