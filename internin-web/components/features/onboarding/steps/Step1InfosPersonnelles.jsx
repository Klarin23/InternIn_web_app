"use client";
// Étape 1 : informations personnelles de base. Sert de modèle pour les
// 10 étapes suivantes (même structure : formulaire -> sauvegarde dans le
// store -> navigation vers l'étape suivante).

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { step1Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function Step1InfosPersonnelles() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data, saveStepData } = useOnboardingStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step1Schema),
    // Pré-remplit avec les données déjà saisies si l'utilisateur revient en arrière
    defaultValues: {
      prenom: data.prenom || "",
      nom: data.nom || "",
      telephone: data.telephone || "",
      pays: data.pays || "",
      ville: data.ville || "",
      dateNaissance: data.dateNaissance || "",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/2");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          {t("auditUi.onboarding.aboutYou")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auditUi.onboarding.aboutYouDescription")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="prenom">{t("auditUi.onboarding.firstName")}</Label>
          <Input
            id="prenom"
            className="h-12 rounded-sm"
            {...register("prenom")}
          />
          {errors.prenom && (
            <p className="text-xs text-destructive">
              {t(errors.prenom.message)}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nom">{t("auditUi.onboarding.lastName")}</Label>
          <Input id="nom" className="h-12 rounded-sm" {...register("nom")} />
          {errors.nom && (
            <p className="text-xs text-destructive">{t(errors.nom.message)}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="telephone">{t("auditUi.onboarding.phone")}</Label>
        <Input
          id="telephone"
          type="tel"
          placeholder={t("auditUi.onboarding.phonePlaceholder")}
          className="h-12 rounded-sm"
          {...register("telephone")}
        />
        {errors.telephone && (
          <p className="text-xs text-destructive">
            {t(errors.telephone.message)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="pays">{t("auditUi.onboarding.country")}</Label>
          <Input id="pays" className="h-12 rounded-sm" {...register("pays")} />
          {errors.pays && (
            <p className="text-xs text-destructive">{t(errors.pays.message)}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ville">{t("auditUi.onboarding.city")}</Label>
          <Input
            id="ville"
            className="h-12 rounded-sm"
            {...register("ville")}
          />
          {errors.ville && (
            <p className="text-xs text-destructive">
              {t(errors.ville.message)}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dateNaissance">
          {t("auditUi.onboarding.birthDate")}{" "}
          <span className="text-muted-foreground">
            ({t("auditUi.common.optional")})
          </span>
        </Label>
        <Input
          id="dateNaissance"
          type="date"
          className="h-12 rounded-sm"
          {...register("dateNaissance")}
        />
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
