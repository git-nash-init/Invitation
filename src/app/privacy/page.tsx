import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { BRAND } from "@/lib/brand";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `What ${BRAND.name} collects, why, who it is shared with, and your choices.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="28 November 2026">
      <section>
        <h2>Who we are</h2>
        <p>
          {BRAND.name} is owned and operated by {BUSINESS.owner}
          {BUSINESS.address ? <> ({BUSINESS.address})</> : null}. We make interactive digital wedding
          invitations that hosts customize, publish and share by link. This policy explains what
          personal information that involves and how we handle it. It is written to follow
          India&apos;s Digital Personal Data Protection Act, 2023.
        </p>
      </section>

      <section>
        <h2>Two kinds of people, two kinds of data</h2>
        <p>
          <b>Hosts</b> are the people who create an invitation. <b>Guests</b> are the people the
          invitation is shared with. For the information a host puts into an invitation and the
          replies guests send, the host decides what is collected and why, and we handle it on the
          host&apos;s behalf to run the service. For a host&apos;s own account and payments, we are
          responsible for it directly.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <b>Your account:</b> your name, email address and a password (stored only in a protected,
            one-way form), or, if you use Google sign-in, the name and email Google shares with us.
          </li>
          <li>
            <b>Your invitation:</b> everything you add: names of the couple and families, ceremony
            dates, times and venues, photos you upload, your note, and music you choose or upload.
          </li>
          <li>
            <b>Your guest list:</b> the guest names you add so each person gets a personal link.
          </li>
          <li>
            <b>Guest replies:</b> what a guest types when they reply: their name, whether they are
            coming, how many people, and any message.
          </li>
          <li>
            <b>Payments:</b> when you publish, our payment partner (Cashfree Payments or Razorpay)
            processes your payment. Cashfree needs a mobile number for each payment, so we ask for
            yours and pass it to them with your name and email. We receive the confirmation, the amount, the payment method type and the payment reference. We never
            see or store your full card number, UPI PIN, OTP or net-banking login.
          </li>
          <li>
            <b>Usage and security:</b> how many times an invitation was opened, when a personal link
            was first opened, and technical details such as your IP address and browser type, which
            we use to keep the service secure and to limit abuse.
          </li>
        </ul>
      </section>

      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>To create, store and show your invitation to the people you share it with.</li>
          <li>To give you the replies and guest counts for your invitation.</li>
          <li>To take payment, publish your invitation and send you receipts and service messages.</li>
          <li>To prevent fraud and misuse, fix problems and keep the service working.</li>
          <li>To meet legal and tax obligations.</li>
        </ul>
        <p className="mt-3">
          We use your information with your consent, which you give when you sign up and when you add
          information to an invitation, and where the law allows us to use it for these purposes. We
          do not use invitation photos or guest details for advertising.
        </p>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>We do not sell, rent or trade personal information. We use these providers to run the service:</p>
        <ul className="mt-3">
          <li><b>Supabase:</b> our database, sign-in and file storage, where your account, invitations, photos and replies are kept.</li>
          <li><b>Vercel:</b> hosts the website.</li>
          <li><b>Cashfree Payments and Razorpay:</b> process payments and refunds.</li>
          <li><b>Google:</b> only if you choose Google sign-in.</li>
        </ul>
        <p className="mt-3">
          These providers handle data only to provide their service to us. Your invitation can be
          opened by anyone who has its link, which is how sharing works, so share links only with the
          people you intend. We may also disclose information if the law or a court requires it.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We use only the cookies needed to keep you signed in and to keep the service secure. We do
          not use advertising or cross-site tracking cookies.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep your account and invitations until you delete them. Deleting an invitation removes
          its photos, guest list and replies. Payment and tax records are kept for as long as the law
          requires, even if the account is closed. Backups are overwritten on a regular cycle.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Data travels over encrypted connections. Each host can reach only their own invitations,
          guests and replies, enforced in the database itself. Invitation links are long and cannot be
          guessed, invitations are hidden from search engines, and our design files are not publicly
          downloadable. No system is perfectly secure, so please use a strong password and keep it
          private.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You can ask to see the personal information we hold about you, to correct it, to delete it,
          or to withdraw your consent. Hosts can edit, unpublish or delete any invitation at any time
          from the dashboard. Guests who want their reply changed or removed should ask the host who
          invited them; you can also write to us and we will help. We answer requests within 30 days.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          {BRAND.name} is for adults planning a celebration. We do not knowingly collect information
          from anyone under 18 for their own account.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          If we change this policy we will update the date at the top. If the change is significant
          we will tell hosts by email.
        </p>
      </section>

      <section>
        <h2>Contact and complaints</h2>
        <p>
          For any question or complaint about your information, use the{" "}
          <Link href="/contact">contact page</Link>
          {BUSINESS.email ? (
            <>
              {" "}
              or write to <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            </>
          ) : null}
          . If we do not resolve it, you may complain to the Data Protection Board of India.
        </p>
      </section>
    </LegalPage>
  );
}
