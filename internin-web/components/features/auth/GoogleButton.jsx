"use client";
// Bouton "Continuer avec Google" — purement présentationnel pour l'instant.
// Le branchement réel à Auth.js (provider Google) se fera à l'Étape backend Auth.

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function GoogleButton() {
  const { t } = useTranslation();
  return (
    <Button type="button" variant="outline" className="h-12 w-full rounded-sm">
      <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2">
        <path
          fill="#4285F4"
          d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.56-5.17 3.56-8.82z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.1A12 12 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.61l3.99 3.1C6.22 6.86 8.87 4.75 12 4.75z"
        />
      </svg>
      {t("auth.shared.continueWithGoogle")}
    </Button>
  );
}
