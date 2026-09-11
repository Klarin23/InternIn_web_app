"use client";
// Étape 3 : présentation de l'entreprise en texte libre. `aPropos` est
// obligatoire (visible publiquement sur les offres de stage), les deux
// autres champs sont facultatifs.

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { entrepriseStep3Schema } from "@/lib/schemas/onboardingEntreprise.schema";
import { useOnboardingEntrepriseStore } from "@/lib/store/useOnboardingEntrepriseStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Petit composant réutilisable pour une zone de texte avec compteur de caractères
function TextareaField({
  id,
  label,
  placeholder,
  minRows = 4,
  registration,
  error,
  helper,
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        placeholder={placeholder}
        rows={minRows}
        className="w-full resize-y rounded-sm border border-border bg-background px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
        {...registration}
      />
      {helper && !error && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function EntrepriseStep3APropos() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingEntrepriseStore();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(entrepriseStep3Schema),
    defaultValues: {
      aPropos: data.aPropos || "",
      mission: data.mission || "",
      cultureEntreprise: data.cultureEntreprise || "",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/4");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-secondary/10 text-blue-400">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          {t("onboardingEntreprise.step3.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("onboardingEntreprise.step3.description")}
        </p>
      </div>

      <TextareaField
        id="aPropos"
        label={t("onboardingEntreprise.step3.about")}
        placeholder={t("onboardingEntreprise.step3.aboutPlaceholder")}
        registration={register("aPropos")}
        error={errors.aPropos?.message ? t(errors.aPropos.message) : undefined}
      />

      <TextareaField
        id="mission"
        label={
          <>
            {t("onboardingEntreprise.step3.mission")} <span className="text-muted-foreground">({t("onboardingEntreprise.step3.optional")})</span>
          </>
        }
        placeholder={t("onboardingEntreprise.step3.missionPlaceholder")}
        minRows={3}
        registration={register("mission")}
      />

      <TextareaField
        id="cultureEntreprise"
        label={
          <>
            {t("onboardingEntreprise.step3.culture")} <span className="text-muted-foreground">({t("onboardingEntreprise.step3.optional")})</span>
          </>
        }
        placeholder={t("onboardingEntreprise.step3.culturePlaceholder")}
        minRows={3}
        registration={register("cultureEntreprise")}
      />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/2")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">{t("onboardingEntreprise.step3.back")}</span>
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 flex-1 rounded-sm"
        >
          {t("onboardingEntreprise.step3.continue")}
        </Button>
      </div>
    </form>
  );
}
