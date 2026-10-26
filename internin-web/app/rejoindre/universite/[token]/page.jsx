import UniversiteInvitationClient from "@/components/features/rattachement/UniversiteInvitationClient";

export const metadata = {
  referrer: "no-referrer",
};

export default async function RejoindreUniversitePage({ params }) {
  const { token } = await params;
  return <UniversiteInvitationClient token={token} />;
}
