import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { BRAND } from "@/lib/brand";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Refunds and cancellation",
  description: `When ${BRAND.name} refunds a payment, how to ask, and how long it takes.`,
};

export default function RefundPage() {
  const contact = (
    <>
      the <Link href="/contact">contact page</Link>
      {BUSINESS.email ? (
        <>
          {" "}
          or <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        </>
      ) : null}
    </>
  );

  return (
    <LegalPage title="Refunds and cancellation" updated="19 November 2026">
      <section>
        <h2>How buying works here</h2>
        <p>
          Designing an invitation on {BRAND.name} is free. You choose a design, add your names,
          dates, venues and photos, and see exactly how it looks. You only pay when you decide to
          publish it to get a shareable link. Because you see the finished invitation before you
          pay, and because it is a digital product that is delivered the moment it is published,
          our refund rules are different from those for a physical item.
        </p>
      </section>

      <section>
        <h2>When we refund in full</h2>
        <ul>
          <li>You were charged but the invitation could not be published because of a problem on our side.</li>
          <li>You were charged more than once for the same invitation.</li>
          <li>
            The invitation does not work as described on the site (for example the link does not open
            or replies are not recorded) and we cannot fix it within 3 working days of your report.
          </li>
          <li>The payment was taken but you never received access to publish, and we cannot restore it.</li>
        </ul>
      </section>

      <section>
        <h2>When we cannot refund</h2>
        <ul>
          <li>You changed your mind after the invitation was published and shared.</li>
          <li>
            You wanted a different design or different wording. You can edit your invitation as many
            times as you like after publishing, on the same link, at no extra cost.
          </li>
          <li>The invitation was removed because it broke our terms (for example unlawful content).</li>
          <li>A guest did not see or reply to the invitation. We cannot control whether a link is opened.</li>
        </ul>
      </section>

      <section>
        <h2>Cancelling</h2>
        <p>
          You can stop at any time before paying, at no cost. There is no subscription and nothing
          renews, so after you have paid there is no later charge to cancel. You can unpublish or
          delete your invitation whenever you like from your dashboard; this does not by itself
          create a refund.
        </p>
      </section>

      <section>
        <h2>How to ask</h2>
        <p>
          Write to us through {contact} within 7 days of the payment. Please include the email you
          signed up with, the date of the payment and, if you have it, the payment ID or reference
          number from your receipt. We reply within 2 working
          days.
        </p>
      </section>

      <section>
        <h2>How long a refund takes</h2>
        <p>
          Once we approve a refund we start it straight away, to the same account, card or UPI ID
          you paid with, through our payment partner, Cashfree Payments. Banks and card networks usually show it within 5 to 7
          working days; some take up to 10. We cannot speed up the bank&apos;s part.
        </p>
      </section>

      <section>
        <h2>Payment failed but money was deducted</h2>
        <p>
          If your bank took the money but the payment did not complete, it is normally returned
          automatically to your account within 5 to 7 working days. If it has not arrived after
          that, contact us with the payment reference and we will check it with the payment partner.
        </p>
      </section>
    </LegalPage>
  );
}
