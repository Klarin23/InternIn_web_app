import { Suspense } from "react";
import SignupForm from "@/components/features/auth/SignupForm";

export const metadata = {
  title: "InternIn — Créer un compte étudiant",
};

export default function InscriptionStagiairePage() {
  return (
    <Suspense fallback={null}>
      <SignupForm role="stagiaire" />
    </Suspense>
  );
}
