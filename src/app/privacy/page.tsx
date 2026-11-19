import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="19 November 2026">
      <section>
        <h2>What we collect</h2>
        <p className="mt-2">
          From hosts: your name, email address and the content you put into an invitation, such as
          names, dates, venues, photos and music. From guests: the name, contact number, answers
          and message a guest submits when replying, and the guest names a host adds for personal
          links. We record how many times an invitation was opened and when a personal link was
          first opened.
        </p>
      </section>
      <section>
        <h2>How we use it</h2>
        <p className="mt-2">
          We use this information to run the service: to show an invitation to the people it was
          shared with, and to give the host their replies. We collect guest details on behalf of
          the host who created the invitation.
        </p>
      </section>
      <section>
        <h2>Payments</h2>
        <p>
          Payments are processed by Razorpay. We receive confirmation that a payment succeeded, its
          amount, method type and reference number. We never see or store your full card number, UPI
          PIN or bank login.
        </p>
      </section>
      <section>
        <h2>What we do not do</h2>
        <p className="mt-2">
          We do not sell, rent or trade guest data or invitation photos to advertisers or data
          brokers.
        </p>
      </section>
      <section>
        <h2>Security</h2>
        <p className="mt-2">
          Data is sent over encrypted connections. Access to each host&apos;s invitations, guests
          and replies is limited to that host&apos;s account. Invitation links are long and cannot
          be guessed, and invitations are hidden from search engines.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p className="mt-2">
          Hosts can unpublish or delete an invitation at any time, which removes its guests and
          replies. To ask about your data, contact the host of the invitation you replied to.
        </p>
      </section>
    </LegalPage>
  );
}
