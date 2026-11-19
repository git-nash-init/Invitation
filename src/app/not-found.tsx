import { LinkButton } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";

export default function NotFound() {
  return (
    <main className="paper-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <div className="glass mt-10 max-w-md rounded-[28px] p-10">
        <h1 className="display text-[32px] leading-[1.15]">We could not find that page</h1>
        <p className="mt-3 text-[16px] leading-6 text-text-2">
          If you were sent an invitation, ask the host to check the link, or whether it is still
          published.
        </p>
        <LinkButton href="/" className="mt-8">
          Back to home
        </LinkButton>
      </div>
    </main>
  );
}
