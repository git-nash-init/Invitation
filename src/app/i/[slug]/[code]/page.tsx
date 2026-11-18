import { InvitationView, invitationMetadata } from "@/components/invitation/invitation-view";

export async function generateMetadata({ params }: PageProps<"/i/[slug]/[code]">) {
  const { slug, code } = await params;
  return invitationMetadata(slug, code);
}

export default async function PersonalInvitationPage({
  params,
}: PageProps<"/i/[slug]/[code]">) {
  const { slug, code } = await params;
  return <InvitationView slug={slug} code={code} />;
}
