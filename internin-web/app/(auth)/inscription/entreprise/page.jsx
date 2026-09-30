import { Suspense } from "react";
import SignupForm from "@/components/features/auth/SignupForm";

export const metadata = {
  title: "InternIn — Créer un compte entreprise",
};

export default function InscriptionEntreprisePage() {
  return (
    <Suspense fallback={null}>
      <SignupForm role="entreprise" />
    </Suspense>
  );
}
