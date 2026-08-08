import { Suspense } from "react";
import VerifyEmailStatus from "@/components/features/auth/VerifyEmailStatus";

export const metadata = {
  title: "InternIn — Vérification de l'e-mail",
};

export default function VerificationEmailPage() {
  // Suspense est requis ici : useSearchParams() (utilisé dans VerifyEmailStatus)
  // oblige Next.js à envelopper le composant dans une limite de Suspense,
  // sans quoi le build de production échoue.
  return (
    <Suspense fallback={null}>
      <VerifyEmailStatus />
    </Suspense>
  );
}
