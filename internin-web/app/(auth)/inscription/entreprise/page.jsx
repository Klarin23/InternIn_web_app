import SignupForm from "@/components/features/auth/SignupForm";

export const metadata = {
  title: "InternIn — Créer un compte entreprise",
};

export default function InscriptionEntreprisePage() {
  return <SignupForm role="entreprise" />;
}
