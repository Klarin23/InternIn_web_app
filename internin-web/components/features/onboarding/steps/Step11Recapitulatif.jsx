"use client";
// Étape 11 : récapitulatif final. Affiche un résumé de toutes les données
// saisies, avec des liens "Modifier" vers chaque étape, et déclenche la
// vraie soumission finale vers l'API à la validation.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { completeOnboardingRequest } from "@/lib/api/stagiaires";

const DUREE_LABELS = {
  "1_mois": "1 mois",
  "2_mois": "2 mois",
  "3_mois": "3 mois",
};
const STATUT_LABELS = {
  etudiant: "Étudiant(e)",
  jeune_diplome: "Jeune diplômé(e)",
};
const JOUR_LABELS = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
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
          <Pencil className="h-3 w-3" />
          Modifier
        </Link>
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export default function Step11Recapitulatif() {
  const router = useRouter();
  const { data, resetOnboarding } = useOnboardingStore();
  const { token, user, setSession } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleFinalSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await completeOnboardingRequest(data, token);

      const statutCompte = result?.stagiaire?.statutCompte || "inactif";

      setSession(
        {
          ...user,
          statutCompte,
        },
        token,
      );

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
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-primary/10 text-primary">
          <CheckCircle2 className="h-5 w-5" />
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
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <RecapSection title="Disponibilités" editHref="/onboarding/9">
        <p>
          {data.joursDisponibles?.map((j) => JOUR_LABELS[j]).join(", ") || "—"}
          {data.heureDebutDisponible && data.heureFinDisponible && (
            <>
              {" "}
              · {data.heureDebutDisponible} à {data.heureFinDisponible}
            </>
          )}
        </p>
      </RecapSection>

      <RecapSection title="Statut académique" editHref="/onboarding/2">
        <p>{STATUT_LABELS[data.statutAcademique] || "—"}</p>
      </RecapSection>

      <RecapSection title="Formation" editHref="/onboarding/3">
        {data.formations?.map((f, i) => (
          <p key={i}>
            {f.diplome} — {f.nomUniversite}
          </p>
        ))}
      </RecapSection>

      <RecapSection title="CV" editHref="/onboarding/4">
        <p>{data.cvNomFichier || "Aucun fichier"}</p>
      </RecapSection>

      <RecapSection title="Liens professionnels" editHref="/onboarding/5">
        {[
          data.linkedinUrl,
          data.githubUrl,
          data.portfolioUrl,
          data.siteWebUrl,
          data.behanceUrl,
        ].filter(Boolean).length > 0 ? (
          <p>
            {
              [
                data.linkedinUrl,
                data.githubUrl,
                data.portfolioUrl,
                data.siteWebUrl,
                data.behanceUrl,
              ].filter(Boolean).length
            }{" "}
            lien(s) renseigné(s)
          </p>
        ) : (
          <p>Aucun lien renseigné</p>
        )}
      </RecapSection>

      <RecapSection title="Compétences" editHref="/onboarding/6">
        <p>{data.competences?.length || 0} compétence(s) sélectionnée(s)</p>
      </RecapSection>

      <RecapSection title="Centres d'intérêt" editHref="/onboarding/7">
        <p>{data.centresInteret?.length || 0} domaine(s) sélectionné(s)</p>
      </RecapSection>

      <RecapSection title="Objectifs de développement" editHref="/onboarding/8">
        <p>
          {data.objectifsDeveloppement?.length || 0} objectif(s) sélectionné(s)
        </p>
      </RecapSection>

      <RecapSection title="Disponibilités" editHref="/onboarding/9">
        <p>
          {data.joursDisponibles?.map((j) => JOUR_LABELS[j]).join(", ") || "—"}
        </p>
      </RecapSection>

      <RecapSection title="Préférences de stage" editHref="/onboarding/10">
        <p>
          {DUREE_LABELS[data.dureeStageSouhaitee] || "—"} ·{" "}
          {data.heuresHebdoSouhaitees}h/semaine
        </p>
        <p>Début souhaité : {data.dateDebutSouhaitee || "—"}</p>
      </RecapSection>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/10")}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={handleFinalSubmit}
          disabled={isSubmitting}
          className="h-12 flex-1 rounded-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
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
