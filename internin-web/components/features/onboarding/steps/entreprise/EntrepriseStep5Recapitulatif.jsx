"use client";
// Étape 5 : récapitulatif final entreprise. Même pattern que
// Step11Recapitulatif (stagiaire) — résumé + liens "Modifier" + soumission finale.
// Icônes : react-icons/fi (Feather), convention retenue pour la suite du projet.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiCheckCircle,
  FiArrowLeft,
  FiLoader,
  FiAlertCircle,
  FiEdit2,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useOnboardingEntrepriseStore } from "@/lib/store/useOnboardingEntrepriseStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { completeOnboardingEntrepriseRequest } from "@/lib/api/entreprises";

const TAILLE_LABELS = {
  "1-10": "1 à 10 employés",
  "11-50": "11 à 50 employés",
  "51-200": "51 à 200 employés",
  "201-500": "201 à 500 employés",
  "500+": "Plus de 500 employés",
};

function RecapSection({ title, editHref, children }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h5 className="text-sm font-semibold text-foreground">{title}</h5>
        <Link
          href={editHref}
          className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:underline"
        >
          <FiEdit2 className="h-3 w-3" />
          Modifier
        </Link>
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export default function EntrepriseStep5Recapitulatif() {
  const router = useRouter();
  const { data, resetOnboarding } = useOnboardingEntrepriseStore();
  const { token, user, setSession } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleFinalSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      await completeOnboardingEntrepriseRequest(data, token);
      setSession({ ...user, statutCompte: "actif" }, token);
      resetOnboarding();
      router.push("/tableau-de-bord");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-secondary/10 text-blue-400">
          <FiCheckCircle className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Vérifiez votre profil
        </h1>
        <p className="text-sm text-muted-foreground">
          Dernière étape — relisez vos informations avant de finaliser votre
          inscription.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <RecapSection
        title="Informations de l'entreprise"
        editHref="/onboarding/1"
      >
        <p>{data.nomEntreprise}</p>
        <p>
          {data.secteurActivite} · {TAILLE_LABELS[data.tailleEntreprise] || "—"}
        </p>
        <p>
          {data.ville}, {data.pays}
        </p>
      </RecapSection>

      <RecapSection title="Présence en ligne" editHref="/onboarding/2">
        <p>{data.siteWeb || "Aucun site web renseigné"}</p>
        <p>{data.linkedinUrl || "Aucun LinkedIn renseigné"}</p>
        <p>{data.logoUrl ? "Logo ajouté" : "Aucun logo"}</p>
      </RecapSection>

      <RecapSection title="À propos" editHref="/onboarding/3">
        <p className="line-clamp-2">{data.aPropos}</p>
      </RecapSection>

      <RecapSection title="Contact principal" editHref="/onboarding/4">
        <p>
          {data.contactNom} — {data.contactFonction}
        </p>
        <p>{data.contactEmail}</p>
        <p>{data.contactTelephone}</p>
      </RecapSection>

      <div className="rounded-sm border border-accent/40 bg-accent/10 px-4 py-3 text-xs text-amber-800">
        Votre entreprise sera vérifiée par notre équipe avant de pouvoir publier
        des offres de stage.
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/4")}
          disabled={isSubmitting}
        >
          <FiArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={handleFinalSubmit}
          disabled={isSubmitting}
          className="h-12 flex-1 rounded-sm"
        >
          {isSubmitting ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin" />
              Création du profil...
            </>
          ) : (
            "Confirmer et finaliser mon profil"
          )}
        </Button>
      </div>
    </div>
  );
}
