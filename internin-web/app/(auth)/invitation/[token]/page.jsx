import InvitationForm from "@/components/features/auth/InvitationForm";

export const metadata = {
  title: "InternIn — Rejoindre l'équipe",
  description:
    "Activez votre compte InternIn pour rejoindre l'équipe de votre entreprise.",
};

export default async function InvitationPage({ params }) {
  const { token } = await params;
  return <InvitationForm token={token} />;
}
