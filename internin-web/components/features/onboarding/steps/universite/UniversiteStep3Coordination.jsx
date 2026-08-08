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

export default function UniversiteStep3Coordination() {
  const router = useRouter();
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
      heuresRecommandeesSemaine: data.heuresRecommandeesSemaine || "",
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
          Coordination des stages
        </h1>
        <p className="text-sm text-muted-foreground">
          Facultatif — aide les entreprises à mieux comprendre vos attentes.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactServiceCarriere">
          Contact du service carrière
        </Label>
        <Input
          id="contactServiceCarriere"
          className="h-12 rounded-sm"
          {...register("contactServiceCarriere")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nomCoordinateurStage">
          Nom du coordinateur de stage
        </Label>
        <Input
          id="nomCoordinateurStage"
          className="h-12 rounded-sm"
          {...register("nomCoordinateurStage")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="periodeStageHabituelle">
          Période de stage habituelle
        </Label>
        <Input
          id="periodeStageHabituelle"
          placeholder="Ex : Juin - Août"
          className="h-12 rounded-sm"
          {...register("periodeStageHabituelle")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="heuresRecommandeesSemaine">
          Heures recommandées / semaine
        </Label>
        <Input
          id="heuresRecommandeesSemaine"
          type="number"
          className="h-12 rounded-sm"
          {...register("heuresRecommandeesSemaine")}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/2")}
        >
          <FiArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 flex-1 rounded-sm"
        >
          Continuer
        </Button>
      </div>
    </form>
  );
}
