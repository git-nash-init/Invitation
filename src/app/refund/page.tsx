import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Refunds and cancellation" };

/**
 * DRAFT POLICY: the owner must confirm or edit this before going live. Razorpay reads it
 * when it reviews a live account.
 */
export default function RefundPage() {
  return (
    <LegalPage title="Refunds and cancellation" updated="19 November 2026">
      <section>
        <h2>Free to try</h2>
        <p>
          Designing an invitation is free, so you can see exactly how it looks with your own names
          before you pay anything.
        </p>
      </section>
      <section>
        <h2>When you can get a refund</h2>
        <ul>
          <li>You were charged but your invitation could not be published because of a problem on our side.</li>
          <li>You were charged more than once for the same invitation.</li>
          <li>The invitation does not work as described and we cannot fix it within a reasonable time.</li>
        </ul>
        <p className="mt-3">
          Write to us within 7 days of the payment. Because an invitation is a digital product that is
          delivered as soon as it is published, we cannot refund a change of mind after it has been
          published and shared.
        </p>
      </section>
      <section>
        <h2>Cancelling</h2>
        <p>
          You can stop at any time before paying, at no cost. After you have paid, you can unpublish or
          delete your invitation whenever you like. There is no subscription, so there is nothing to
          cancel and no further charge.
        </p>
      </section>
      <section>
        <h2>How refunds are paid</h2>
        <p>
          Approved refunds go back to the original payment method through Razorpay. Banks usually
          take 5 to 7 working days to show it.
        </p>
      </section>
      <section>
        <h2>How to ask</h2>
        <p>
          Use the <Link href="/contact">contact page</Link>
          {BUSINESS.email ? (
            <>
              {" "}
              or write to <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            </>
          ) : null}
          , and include the email you signed up with and the date of the payment.
        </p>
      </section>
    </LegalPage>
  );
}
