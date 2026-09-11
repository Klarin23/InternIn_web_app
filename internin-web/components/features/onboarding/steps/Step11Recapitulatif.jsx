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
import { useTranslation } from "@/lib/i18n/useTranslation";

const DUREE_LABELS = {
  "1_mois": "oneMonth",
  "2_mois": "twoMonths",
  "3_mois": "threeMonths",
};
const STATUT_LABELS = {
  etudiant: "student",
  jeune_diplome: "graduate",
};
const JOUR_LABELS = {
  lundi: "monday",
  mardi: "tuesday",
  mercredi: "wednesday",
  jeudi: "thursday",
  vendredi: "friday",
  samedi: "saturday",
  dimanche: "sunday",
};

function RecapSection({ title, editHref, editLabel, children }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h5 className="text-sm font-semibold text-foreground">{title}</h5>
        <Link
          href={editHref}
          className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:underline"
        >
          <Pencil className="h-3 w-3" />
          {editLabel}
        </Link>
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export default function Step11Recapitulatif() {
  const router = useRouter();
  const { t } = useTranslation();
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
          {t("auditUi.onboarding.reviewTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auditUi.onboarding.reviewDescription")}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <RecapSection
        title={t("auditUi.onboarding.availabilityTitle")}
        editLabel={t("auditUi.onboarding.edit")}
        editHref="/onboarding/9"
      >
        <p>
          {data.joursDisponibles
            ?.map((j) => t(`auditUi.onboarding.days.${JOUR_LABELS[j]}`))
            .join(", ") || "—"}
          {data.heureDebutDisponible && data.heureFinDisponible && (
            <>
              {" "}
              · {data.heureDebutDisponible} à {data.heureFinDisponible}
            </>
          )}
        </p>
      </RecapSection>

      <RecapSection
        title={t("auditUi.onboarding.academicStatus")}
        editLabel={t("auditUi.onboarding.edit")}
        editHref="/onboarding/2"
      >
        <p>
          {STATUT_LABELS[data.statutAcademique]
            ? t(`auditUi.onboarding.${STATUT_LABELS[data.statutAcademique]}`)
            : "—"}
        </p>
      </RecapSection>

      <RecapSection
        title={t("auditUi.onboarding.education")}
        editLabel={t("auditUi.onboarding.edit")}
        editHref="/onboarding/3"
      >
        {data.formations?.map((f, i) => (
          <p key={i}>
            {f.diplome} — {f.nomUniversite}
          </p>
        ))}
      </RecapSection>

      <RecapSection
        title={t("auditUi.onboarding.cv")}
        editLabel={t("auditUi.onboarding.edit")}
        editHref="/onboarding/4"
      >
        <p>{data.cvNomFichier || t("auditUi.onboarding.noFile")}</p>
      </RecapSection>

      <RecapSection
        title={t("auditUi.onboarding.professionalLinks")}
        editLabel={t("auditUi.onboarding.edit")}
        editHref="/onboarding/5"
      >
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
            {t("auditUi.onboarding.linksCount", {
              count: [
                data.linkedinUrl,
                data.githubUrl,
                data.portfolioUrl,
                data.siteWebUrl,
                data.behanceUrl,
              ].filter(Boolean).length,
            })}
          </p>
        ) : (
          <p>{t("auditUi.onboarding.noLinks")}</p>
        )}
      </RecapSection>

      <RecapSection
        title={t("auditUi.onboarding.skillsTitle")}
        editLabel={t("auditUi.onboarding.edit")}
        editHref="/onboarding/6"
      >
        <p>
          {t("auditUi.onboarding.skillsCount", {
            count: data.competences?.length || 0,
          })}
        </p>
      </RecapSection>

      <RecapSection
        title={t("auditUi.onboarding.interestsTitle")}
        editLabel={t("auditUi.onboarding.edit")}
        editHref="/onboarding/7"
      >
        <p>
          {t("auditUi.onboarding.interestsCount", {
            count: data.centresInteret?.length || 0,
          })}
        </p>
      </RecapSection>

      <RecapSection
        title={t("auditUi.onboarding.objectivesTitle")}
        editLabel={t("auditUi.onboarding.edit")}
        editHref="/onboarding/8"
      >
        <p>
          {t("auditUi.onboarding.objectivesCount", {
            count: data.objectifsDeveloppement?.length || 0,
          })}
        </p>
      </RecapSection>

      <RecapSection
        title={t("auditUi.onboarding.availabilityTitle")}
        editLabel={t("auditUi.onboarding.edit")}
        editHref="/onboarding/9"
      >
        <p>
          {data.joursDisponibles
            ?.map((j) => t(`auditUi.onboarding.days.${JOUR_LABELS[j]}`))
            .join(", ") || "—"}
        </p>
      </RecapSection>

      <RecapSection
        title={t("auditUi.onboarding.preferencesTitle")}
        editLabel={t("auditUi.onboarding.edit")}
        editHref="/onboarding/10"
      >
        <p>
          {DUREE_LABELS[data.dureeStageSouhaitee]
            ? t(`auditUi.common.${DUREE_LABELS[data.dureeStageSouhaitee]}`)
            : "—"}{" "}
          ·{" "}
          {t("auditUi.onboarding.hoursPerWeekValue", {
            n: data.heuresHebdoSouhaitees,
          })}
        </p>
        <p>
          {t("auditUi.onboarding.desiredStartDateValue", {
            date: data.dateDebutSouhaitee || "—",
          })}
        </p>
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
              {t("auditUi.onboarding.creatingProfile")}
            </>
          ) : (
            t("auditUi.onboarding.confirmProfile")
          )}
        </Button>
      </div>
    </div>
  );
}
