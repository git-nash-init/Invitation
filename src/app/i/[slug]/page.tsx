import { InvitationView, invitationMetadata } from "@/components/invitation/invitation-view";

export async function generateMetadata({ params }: PageProps<"/i/[slug]">) {
  const { slug } = await params;
  return invitationMetadata(slug, null);
}

export default async function InvitationPage({ params }: PageProps<"/i/[slug]">) {
  const { slug } = await params;
  return <InvitationView slug={slug} code={null} />;
}
