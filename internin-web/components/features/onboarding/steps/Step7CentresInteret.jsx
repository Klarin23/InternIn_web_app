"use client";
// Étape 7 : centres d'intérêt (catégories de stage). Même pattern de tags
// cliquables que l'étape 6, mais sans notion de niveau — juste une sélection
// multiple simple (stagiaire_centres_interet n'a pas de colonne "niveau").

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCentresInteret } from "@/lib/queries/useCentresInteret";
import { step7Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";

export default function Step7CentresInteret() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingStore();
  const { data: centresList, isLoading, isError } = useCentresInteret();

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step7Schema),
    defaultValues: { centresInteret: data.centresInteret || [] },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/8");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement des centres d&apos;intérêt...
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Impossible de charger les centres d&apos;intérêt. Vérifiez que
        l&apos;API backend tourne bien.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Vos centres d&apos;intérêt
        </h1>
        <p className="text-sm text-muted-foreground">
          Choisissez les domaines qui vous intéressent — ça nous aide à vous
          proposer les bonnes offres de stage.
        </p>
      </div>

      <Controller
        name="centresInteret"
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap gap-2">
            {centresList.map((centre) => {
              const active = field.value.includes(centre.idCentreInteret);
              return (
                <button
                  type="button"
                  key={centre.idCentreInteret}
                  onClick={() => {
                    field.onChange(
                      active
                        ? field.value.filter(
                            (id) => id !== centre.idCentreInteret,
                          )
                        : [...field.value, centre.idCentreInteret],
                    );
                  }}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/50"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  {centre.nom}
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.centresInteret && (
        <p className="text-xs text-destructive">
          {errors.centresInteret.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/6")}
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
