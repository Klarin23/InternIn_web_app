import SignupForm from "@/components/features/auth/SignupForm";

export const metadata = {
  title: "InternIn — Créer un compte université",
};

export default function InscriptionUniversitePage() {
  return <SignupForm role="universite" />;
}
