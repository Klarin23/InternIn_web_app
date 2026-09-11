"use client";
// Étape 10 : préférences de stage. Le slider force naturellement les valeurs
// à respecter la contrainte métier (15 à 40h, par pas de 5) sans qu'on ait
// besoin de la revalider manuellement à la saisie.

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { step10Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

const DUREES = ["oneMonth", "twoMonths", "threeMonths"];

export default function Step10Preferences() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data, saveStepData } = useOnboardingStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step10Schema),
    defaultValues: {
      dureeStageSouhaitee: data.dureeStageSouhaitee || undefined,
      heuresHebdoSouhaitees: data.heuresHebdoSouhaitees || 20,
      dateDebutSouhaitee: data.dateDebutSouhaitee || "",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/11");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-primary/10 text-primary">
          <Clock className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          {t("auditUi.onboarding.preferencesTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auditUi.onboarding.preferencesDescription")}
        </p>
      </div>

      {/* Durée souhaitée : 3 cartes cliquables */}
      <div className="space-y-1.5">
        <Label>{t("auditUi.onboarding.desiredDuration")}</Label>
        <Controller
          name="dureeStageSouhaitee"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-3">
              {DUREES.map((d, index) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => field.onChange(`${index + 1}_mois`)}
                  className={`rounded-md border p-3.5 text-center text-sm font-semibold transition ${
                    field.value === d.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {t(`auditUi.common.${d}`)}
                </button>
              ))}
            </div>
          )}
        />
        {errors.dureeStageSouhaitee && (
          <p className="text-xs text-destructive">
            {t(errors.dureeStageSouhaitee.message)}
          </p>
        )}
      </div>

      {/* Volume horaire hebdomadaire : slider de 15 à 40, pas de 5 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("auditUi.onboarding.hoursPerWeek")}</Label>
          <Controller
            name="heuresHebdoSouhaitees"
            control={control}
            render={({ field }) => (
              <span className="text-sm font-semibold text-primary">
                {t("auditUi.onboarding.hoursPerWeekValue", { n: field.value })}
              </span>
            )}
          />
        </div>
        <Controller
          name="heuresHebdoSouhaitees"
          control={control}
          render={({ field }) => (
            <Slider
              min={15}
              max={40}
              step={5}
              value={[field.value]}
              onValueChange={([val]) => field.onChange(val)}
            />
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>15h</span>
          <span>40h</span>
        </div>
        {errors.heuresHebdoSouhaitees && (
          <p className="text-xs text-destructive">
            {t(errors.heuresHebdoSouhaitees.message)}
          </p>
        )}
      </div>

      {/* Date de début souhaitée */}
      <div className="space-y-1.5">
        <Label htmlFor="dateDebutSouhaitee">
          {t("auditUi.onboarding.desiredStartDate")}
        </Label>
        <Input
          id="dateDebutSouhaitee"
          type="date"
          className="h-12 rounded-sm"
          {...register("dateDebutSouhaitee")}
        />
        {errors.dateDebutSouhaitee && (
          <p className="text-xs text-destructive">
            {t(errors.dateDebutSouhaitee.message)}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/9")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 flex-1 rounded-sm"
        >
          {t("auditUi.common.continue")}
        </Button>
      </div>
    </form>
  );
}
