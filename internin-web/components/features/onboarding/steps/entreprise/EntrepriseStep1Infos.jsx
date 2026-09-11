"use client";
// Étape 1 de l'onboarding entreprise : informations de base.
// Même structure que Step1InfosPersonnelles (stagiaire), adaptée aux champs
// de la table `entreprises`.

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { entrepriseStep1Schema } from "@/lib/schemas/onboardingEntreprise.schema";
import { useOnboardingEntrepriseStore } from "@/lib/store/useOnboardingEntrepriseStore";
import { SECTEUR_OPTIONS } from "@/components/features/offres-entreprise/offreForm.constants";

const SECTEUR_PERSONNALISE = "__custom__";

const SECTEURS_PREDEFINIS = SECTEUR_OPTIONS.filter(
  (option) => option.value !== "Autre",
);

const TAILLES = [
  { value: "1-10", labelKey: "size1to10" },
  { value: "11-50", labelKey: "size11to50" },
  { value: "51-200", labelKey: "size51to200" },
  { value: "201-500", labelKey: "size201to500" },
  { value: "500+", labelKey: "size500plus" },
];

export default function EntrepriseStep1Infos() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingEntrepriseStore();
  const { t } = useTranslation();

  const secteurInitial = data.secteurActivite || SECTEURS_PREDEFINIS[0].value;
  const secteurInitialPredefini = SECTEURS_PREDEFINIS.some(
    (option) => option.value === secteurInitial,
  );
  const [secteurMode, setSecteurMode] = useState(
    secteurInitialPredefini ? secteurInitial : SECTEUR_PERSONNALISE,
  );
  const [secteurPersonnalise, setSecteurPersonnalise] = useState(
    secteurInitialPredefini ? "" : data.secteurActivite || "",
  );

  const secteurOptions = useMemo(
    () => [
      ...SECTEURS_PREDEFINIS,
      { value: SECTEUR_PERSONNALISE, labelKey: "customSectorOption" },
    ],
    [],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(entrepriseStep1Schema),
    defaultValues: {
      nomEntreprise: data.nomEntreprise || "",
      secteurActivite: secteurInitial,
      tailleEntreprise: data.tailleEntreprise || undefined,
      pays: "Cameroun",
      ville: data.ville || "",
    },
  });

  const onSubmit = (values) => {
    const secteurActivite =
      secteurMode === SECTEUR_PERSONNALISE
        ? secteurPersonnalise.trim()
        : values.secteurActivite.trim();

    saveStepData({ ...values, secteurActivite });
    router.push("/onboarding/2");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-secondary/10 text-blue-400">
          <Building2 className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          {t("auditUi.onboarding.entrepriseOnboarding.step1.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auditUi.onboarding.entrepriseOnboarding.step1.description")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nomEntreprise">{t("auditUi.onboarding.entrepriseOnboarding.step1.companyName")}</Label>
        <Input
          id="nomEntreprise"
          className="h-12 rounded-sm"
          {...register("nomEntreprise")}
        />
        {errors.nomEntreprise && (
          <p className="text-xs text-destructive">
            {t(errors.nomEntreprise.message)}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="secteurActivite">{t("auditUi.onboarding.entrepriseOnboarding.step1.sector")}</Label>
          <Controller
            name="secteurActivite"
            control={control}
            render={({ field }) => (
              <Select
                value={
                  secteurMode === SECTEUR_PERSONNALISE
                    ? SECTEUR_PERSONNALISE
                    : field.value
                }
                onValueChange={(value) => {
                  setSecteurMode(value);
                  if (value !== SECTEUR_PERSONNALISE) {
                    field.onChange(value);
                  } else {
                    field.onChange(secteurPersonnalise);
                  }
                }}
              >
                <SelectTrigger id="secteurActivite" className="h-12 w-full rounded-sm">
                  <SelectValue placeholder={t("auditUi.onboarding.entrepriseOnboarding.step1.sectorPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {secteurOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.labelKey.startsWith("entrepriseSpace.") ? t(option.labelKey) : t(`auditUi.onboarding.entrepriseOnboarding.step1.${option.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="secteurPersonnalise">
            {t("auditUi.onboarding.entrepriseOnboarding.step1.customSector")}
          </Label>
          <Input
            id="secteurPersonnalise"
            value={secteurPersonnalise}
            onChange={(event) => {
              const value = event.target.value;
              setSecteurPersonnalise(value);
              if (secteurMode === SECTEUR_PERSONNALISE) {
                setValue("secteurActivite", value, { shouldValidate: true });
              }
            }}
            placeholder={t("auditUi.onboarding.entrepriseOnboarding.step1.customSectorPlaceholder")}
            maxLength={150}
            disabled={secteurMode !== SECTEUR_PERSONNALISE}
            aria-disabled={secteurMode !== SECTEUR_PERSONNALISE}
            className="h-12 rounded-sm disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="text-xs text-muted-foreground">
            {t("auditUi.onboarding.entrepriseOnboarding.step1.customSectorHelp")}
          </p>
        </div>

        {errors.secteurActivite && (
          <p className="text-xs text-destructive">
            {t(errors.secteurActivite.message)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tailleEntreprise">{t("auditUi.onboarding.entrepriseOnboarding.step1.companySize")}</Label>
        <Controller
          name="tailleEntreprise"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}
            >
              <SelectTrigger
                id="tailleEntreprise"
                className="h-12 w-full rounded-sm"
              >
                <SelectValue placeholder={t("auditUi.onboarding.entrepriseOnboarding.step1.sizePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {TAILLES.map((taille) => (
                  <SelectItem key={taille.value} value={taille.value}>
                    {t(`auditUi.onboarding.entrepriseOnboarding.step1.${taille.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.tailleEntreprise && (
          <p className="text-xs text-destructive">
            {t(errors.tailleEntreprise.message)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="pays">{t("auditUi.onboarding.entrepriseOnboarding.step1.country")}</Label>
          <Controller 
            name="pays"
            control={control}
            render={({ field }) => (
              <Select value="Cameroun" onValueChange={field.onChange}
              >
                <SelectTrigger id="pays" className="h-12 rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cameroun">
                    {t("auditUi.onboarding.entrepriseOnboarding.step1.countryCameroon")}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.pays && (
            <p className="text-xs text-destructive">{t(errors.pays.message)}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ville">{t("auditUi.onboarding.entrepriseOnboarding.step1.city")}</Label>
          <Input
            id="ville"
            className="h-12 rounded-sm"
            {...register("ville")}
          />
          {errors.ville && (
            <p className="text-xs text-destructive">{t(errors.ville.message)}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-sm"
      >
        {t("auditUi.common.continue")}
      </Button>
    </form>
  );
}
