import { Suspense } from "react";
import ResetPasswordForm from "@/components/features/auth/ResetPasswordForm";

export const metadata = {
  title: "InternIn — Réinitialiser le mot de passe",
};

export default function ReinitialiserMotDePassePage() {
  // Suspense est requis ici : useSearchParams() (utilisé dans ResetPasswordForm)
  // oblige Next.js à envelopper le composant dans une limite de Suspense,
  // sans quoi le build de production échoue.
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
