import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="18 November 2026">
      <section>
        <h2>The service</h2>
        <p className="mt-2">
          SutraLuxe lets you customize an interactive invitation template, publish it, and share
          it by link, with optional personal links and RSVP replies.
        </p>
      </section>
      <section>
        <h2>Your content</h2>
        <p className="mt-2">
          You are responsible for what you add to an invitation and for having the right to use
          the photos and music you upload. Do not upload anything unlawful, harmful or that
          belongs to someone else.
        </p>
      </section>
      <section>
        <h2>Licence to use templates</h2>
        <p className="mt-2">
          Each invitation you create gives you a personal, non-transferable licence to use that
          template for your own celebration. You may not copy, resell or redistribute the
          templates, artwork or code.
        </p>
      </section>
      <section>
        <h2>Accounts</h2>
        <p className="mt-2">
          Keep your login details private. You are responsible for activity under your account.
        </p>
      </section>
      <section>
        <h2>Availability</h2>
        <p className="mt-2">
          We work to keep the service available, but we do not promise it will always be
          uninterrupted or error free.
        </p>
      </section>
    </LegalPage>
  );
}
