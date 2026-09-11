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
import { useTranslation } from "@/lib/i18n/useTranslation";
import { SECTEUR_OPTIONS } from "@/components/features/offres-entreprise/offreForm.constants";

function RecapSection({ title, editHref, editLabel, children }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h5 className="text-sm font-semibold text-foreground">{title}</h5>
        <Link
          href={editHref}
          className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:underline"
        >
          <FiEdit2 className="h-3 w-3" />
          {editLabel}
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
  const { t } = useTranslation();

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

  const secteurOption = SECTEUR_OPTIONS.find(
    (option) => option.value === data.secteurActivite,
  );
  const secteurLabel = secteurOption
    ? t(secteurOption.labelKey)
    : data.secteurActivite || "—";
  const tailleLabel =
    t(`onboardingEntreprise.step5.companySize.${data.tailleEntreprise}`) || "—";
  const paysLabel =
    data.pays === "Cameroun"
      ? t("auditUi.onboarding.entrepriseOnboarding.step1.countryCameroon")
      : data.pays || "—";

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-secondary/10 text-blue-400">
          <FiCheckCircle className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          {t("onboardingEntreprise.step5.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("onboardingEntreprise.step5.description")}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <RecapSection
        title={t("onboardingEntreprise.step5.companyInfo")}
        editHref="/onboarding/1"
        editLabel={t("onboardingEntreprise.step5.edit")}
      >
        <p>{data.nomEntreprise}</p>
        <p>
          {secteurLabel} · {tailleLabel}
        </p>
        <p>
          {data.ville}, {paysLabel}
        </p>
      </RecapSection>

      <RecapSection
        title={t("onboardingEntreprise.step5.onlinePresence")}
        editHref="/onboarding/2"
        editLabel={t("onboardingEntreprise.step5.edit")}
      >
        <p>{data.siteWeb || t("onboardingEntreprise.step5.noWebsite")}</p>
        <p>{data.linkedinUrl || t("onboardingEntreprise.step5.noLinkedin")}</p>
        <p>
          {data.logoUrl
            ? t("onboardingEntreprise.step5.logoAdded")
            : t("onboardingEntreprise.step5.noLogo")}
        </p>
      </RecapSection>

      <RecapSection
        title={t("onboardingEntreprise.step5.about")}
        editHref="/onboarding/3"
        editLabel={t("onboardingEntreprise.step5.edit")}
      >
        <p className="line-clamp-2">{data.aPropos}</p>
      </RecapSection>

      <RecapSection
        title={t("onboardingEntreprise.step5.primaryContact")}
        editHref="/onboarding/4"
        editLabel={t("onboardingEntreprise.step5.edit")}
      >
        <p>
          {data.contactNom} — {data.contactFonction}
        </p>
        <p>{data.contactEmail}</p>
        <p>{data.contactTelephone}</p>
      </RecapSection>

      <div className="rounded-sm border border-accent/40 bg-accent/10 px-4 py-3 text-xs text-amber-800">
        {t("onboardingEntreprise.step5.verificationNotice")}
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
          <span className="sr-only">{t("onboardingEntreprise.step5.back")}</span>
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
              {t("onboardingEntreprise.step5.creatingProfile")}
            </>
          ) : (
            t("onboardingEntreprise.step5.confirm")
          )}
        </Button>
      </div>
    </div>
  );
}
