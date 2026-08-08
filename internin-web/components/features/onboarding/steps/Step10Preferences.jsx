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

const DUREES = [
  { value: "1_mois", label: "1 mois" },
  { value: "2_mois", label: "2 mois" },
  { value: "3_mois", label: "3 mois" },
];

export default function Step10Preferences() {
  const router = useRouter();
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
          Vos préférences de stage
        </h1>
        <p className="text-sm text-muted-foreground">
          Ces critères nous aident à vous proposer des offres qui correspondent
          à votre emploi du temps.
        </p>
      </div>

      {/* Durée souhaitée : 3 cartes cliquables */}
      <div className="space-y-1.5">
        <Label>Durée souhaitée</Label>
        <Controller
          name="dureeStageSouhaitee"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-3">
              {DUREES.map((d) => (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => field.onChange(d.value)}
                  className={`rounded-md border p-3.5 text-center text-sm font-semibold transition ${
                    field.value === d.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        />
        {errors.dureeStageSouhaitee && (
          <p className="text-xs text-destructive">
            {errors.dureeStageSouhaitee.message}
          </p>
        )}
      </div>

      {/* Volume horaire hebdomadaire : slider de 15 à 40, pas de 5 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Heures par semaine</Label>
          <Controller
            name="heuresHebdoSouhaitees"
            control={control}
            render={({ field }) => (
              <span className="text-sm font-semibold text-primary">
                {field.value}h / semaine
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
            {errors.heuresHebdoSouhaitees.message}
          </p>
        )}
      </div>

      {/* Date de début souhaitée */}
      <div className="space-y-1.5">
        <Label htmlFor="dateDebutSouhaitee">Date de début souhaitée</Label>
        <Input
          id="dateDebutSouhaitee"
          type="date"
          className="h-12 rounded-sm"
          {...register("dateDebutSouhaitee")}
        />
        {errors.dateDebutSouhaitee && (
          <p className="text-xs text-destructive">
            {errors.dateDebutSouhaitee.message}
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
          Continuer
        </Button>
      </div>
    </form>
  );
}
