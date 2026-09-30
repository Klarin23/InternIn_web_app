"use client";
// Étape 3 : informations sur la coordination des stages au sein de l'établissement.
// Tous les champs sont facultatifs (cf. schéma BDD, aucun NOT NULL sur ces colonnes).

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiArrowLeft, FiCalendar } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { universiteStep3Schema } from "@/lib/schemas/onboardingUniversite.schema";
import { useOnboardingUniversiteStore } from "@/lib/store/useOnboardingUniversiteStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function UniversiteStep3Coordination() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data, saveStepData } = useOnboardingUniversiteStore();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(universiteStep3Schema),
    defaultValues: {
      contactServiceCarriere: data.contactServiceCarriere || "",
      periodeStageHabituelle: data.periodeStageHabituelle || "",
      nomCoordinateurStage: data.nomCoordinateurStage || "",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/4");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-muted text-foreground">
          <FiCalendar className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          {t("onboardingUniversite.step3.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("onboardingUniversite.step3.description")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactServiceCarriere">
          {t("onboardingUniversite.step3.careerServiceContact")}
        </Label>
        <Input
          id="contactServiceCarriere"
          className="h-12 rounded-sm"
          {...register("contactServiceCarriere")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nomCoordinateurStage">
          {t("onboardingUniversite.step3.internshipCoordinator")}
        </Label>
        <Input
          id="nomCoordinateurStage"
          className="h-12 rounded-sm"
          {...register("nomCoordinateurStage")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="periodeStageHabituelle">
          {t("onboardingUniversite.step3.usualInternshipPeriod")}
        </Label>
        <Input
          id="periodeStageHabituelle"
          placeholder={t(
            "onboardingUniversite.step3.usualInternshipPeriodPlaceholder",
          )}
          className="h-12 rounded-sm"
          {...register("periodeStageHabituelle")}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/2")}
          aria-label={t("onboardingUniversite.step3.back")}
        >
          <FiArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 flex-1 rounded-sm"
        >
          {t("onboardingUniversite.step3.continue")}
        </Button>
      </div>
    </form>
  );
}
