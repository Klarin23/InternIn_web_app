"use client";
// Étape 8 : objectifs de développement personnel — alimentera le Coach IA
// pour personnaliser ses recommandations pendant le stage.

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, Check, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useObjectifsDeveloppement } from "@/lib/queries/useObjectifsDeveloppement";
import { step8Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";

export default function Step8Objectifs() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingStore();
  const {
    data: objectifsList,
    isLoading,
    isError,
  } = useObjectifsDeveloppement();

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step8Schema),
    defaultValues: {
      objectifsDeveloppement: data.objectifsDeveloppement || [],
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/9");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement des objectifs...
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Impossible de charger les objectifs. Vérifiez que l&apos;API backend
        tourne bien.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-secondary/10 text-secondary">
          <Target className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Vos objectifs de développement
        </h1>
        <p className="text-sm text-muted-foreground">
          Le Coach IA s&apos;appuiera sur ces objectifs pour personnaliser son
          accompagnement durant votre stage.
        </p>
      </div>

      <Controller
        name="objectifsDeveloppement"
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap gap-2">
            {objectifsList.map((objectif) => {
              const active = field.value.includes(objectif.idObjectif);
              return (
                <button
                  type="button"
                  key={objectif.idObjectif}
                  onClick={() => {
                    field.onChange(
                      active
                        ? field.value.filter((id) => id !== objectif.idObjectif)
                        : [...field.value, objectif.idObjectif],
                    );
                  }}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? "border-secondary bg-secondary/10 text-blue-400"
                      : "border-border bg-card text-foreground hover:border-secondary/50"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  {objectif.nom}
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.objectifsDeveloppement && (
        <p className="text-xs text-destructive">
          {errors.objectifsDeveloppement.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/7")}
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
