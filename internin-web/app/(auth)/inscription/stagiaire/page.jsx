import SignupForm from "@/components/features/auth/SignupForm";

export const metadata = {
  title: "InternIn — Créer un compte étudiant",
};

export default function InscriptionStagiairePage() {
  return <SignupForm role="stagiaire" />;
}
