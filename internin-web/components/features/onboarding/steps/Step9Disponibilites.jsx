"use client";
// Étape 9 : jours + créneau horaire de disponibilité hebdomadaire. Correspond
// à jour_semaine + heure_debut/heure_fin de la table disponibilites_stagiaire
// — une ligne par jour coché sera créée lors de la soumission de l'onboarding.

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ArrowLeft, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { step9Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";

// Valeurs alignées sur l'ENUM jour_semaine de la base (lundi...dimanche)
const JOURS = [
  { value: "lundi", label: "Lundi" },
  { value: "mardi", label: "Mardi" },
  { value: "mercredi", label: "Mercredi" },
  { value: "jeudi", label: "Jeudi" },
  { value: "vendredi", label: "Vendredi" },
  { value: "samedi", label: "Samedi" },
  { value: "dimanche", label: "Dimanche" },
];

export default function Step9Disponibilites() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingStore();

  const {
    handleSubmit,
    control,
    register,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step9Schema),
    defaultValues: {
      joursDisponibles: data.joursDisponibles || [],
      heureDebutDisponible: data.heureDebutDisponible || "08:00",
      heureFinDisponible: data.heureFinDisponible || "17:00",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/10");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-primary/10 text-primary">
          <CalendarDays className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Vos disponibilités
        </h1>
        <p className="text-sm text-muted-foreground">
          Quels jours de la semaine êtes-vous disponible pour effectuer votre
          stage ?
        </p>
      </div>

      <Controller
        name="joursDisponibles"
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {JOURS.map((jour) => {
              const active = field.value.includes(jour.value);
              return (
                <button
                  type="button"
                  key={jour.value}
                  onClick={() => {
                    field.onChange(
                      active
                        ? field.value.filter((j) => j !== jour.value)
                        : [...field.value, jour.value],
                    );
                  }}
                  className={`flex items-center justify-between rounded-md border p-4 text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {jour.label}
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-border"
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.joursDisponibles && (
        <p className="text-xs text-destructive">
          {errors.joursDisponibles.message}
        </p>
      )}

      <div className="space-y-1.5">
        <Label>Créneau horaire habituel (appliqué aux jours choisis)</Label>
        <div className="flex items-center gap-3">
          <Input
            type="time"
            className="h-11 rounded-sm"
            {...register("heureDebutDisponible")}
          />
          <span className="text-sm text-muted-foreground">à</span>
          <Input
            type="time"
            className="h-11 rounded-sm"
            {...register("heureFinDisponible")}
          />
        </div>
        {(errors.heureDebutDisponible || errors.heureFinDisponible) && (
          <p className="text-xs text-destructive">
            {errors.heureDebutDisponible?.message ||
              errors.heureFinDisponible?.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/8")}
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
