"use client";
// Étape 6 : sélection de compétences par tags cliquables, groupées par type
// (technique / professionnelle / langue), avec choix de niveau une fois sélectionnées.

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompetences } from "@/lib/queries/useCompetences";
import { step6Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";

const TYPE_LABELS = {
  technique: "Compétences techniques",
  professionnelle: "Compétences professionnelles",
  langue: "Langues",
};

const NIVEAUX = ["debutant", "intermediaire", "avance"];
const NIVEAU_LABELS = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

export default function Step6Competences() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingStore();
  const { data: competencesResponse, isLoading, isError } = useCompetences();

  const competencesList = Array.isArray(competencesResponse)
    ? competencesResponse
    : Array.isArray(competencesResponse?.competences)
      ? competencesResponse.competences
      : [];

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step6Schema),
    defaultValues: { competences: data.competences || [] },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/7");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement des compétences...
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Impossible de charger les compétences. Vérifiez que l&apos;API backend
        tourne bien.
      </p>
    );
  }

  // Regroupe la liste plate reçue de l'API par type_competence
  const grouped = competencesList.reduce((acc, comp) => {
    (acc[comp.typeCompetence] ??= []).push(comp);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Vos compétences
        </h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez celles qui vous représentent — vous pourrez préciser
          votre niveau pour chacune.
        </p>
      </div>

      <Controller
        name="competences"
        control={control}
        render={({ field }) => {
          const selected = field.value; // [{ idCompetence, niveau }]

          function isSelected(id) {
            return selected.some((c) => c.idCompetence === id);
          }

          function toggle(id) {
            if (isSelected(id)) {
              field.onChange(selected.filter((c) => c.idCompetence !== id));
            } else {
              field.onChange([
                ...selected,
                { idCompetence: id, niveau: "intermediaire" },
              ]);
            }
          }

          function setNiveau(id, niveau) {
            field.onChange(
              selected.map((c) =>
                c.idCompetence === id ? { ...c, niveau } : c,
              ),
            );
          }

          return (
            <div className="space-y-7">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <h5 className="mb-3 text-sm font-semibold text-foreground">
                    {TYPE_LABELS[type]}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {items.map((comp) => {
                      const active = isSelected(comp.idCompetence);
                      return (
                        <button
                          type="button"
                          key={comp.idCompetence}
                          onClick={() => toggle(comp.idCompetence)}
                          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground hover:border-primary/50"
                          }`}
                        >
                          {active && <Check className="h-3.5 w-3.5" />}
                          {comp.nom}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Sélecteurs de niveau pour les compétences choisies */}
              {selected.length > 0 && (
                <div className="rounded-md border border-border bg-muted/40 p-4">
                  <h5 className="mb-3 text-sm font-semibold text-foreground">
                    Précisez votre niveau ({selected.length} sélectionnée
                    {selected.length > 1 ? "s" : ""})
                  </h5>
                  <div className="space-y-3">
                    {selected.map((sel) => {
                      const comp = competencesList.find(
                        (c) => c.idCompetence === sel.idCompetence,
                      );
                      return (
                        <div
                          key={sel.idCompetence}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="text-sm text-foreground">
                            {comp?.nom}
                          </span>
                          <div className="flex gap-1.5">
                            {NIVEAUX.map((niv) => (
                              <button
                                type="button"
                                key={niv}
                                onClick={() => setNiveau(sel.idCompetence, niv)}
                                className={`rounded-sm px-2.5 py-1 text-xs font-medium transition ${
                                  sel.niveau === niv
                                    ? "bg-primary text-white"
                                    : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {NIVEAU_LABELS[niv]}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        }}
      />
      {errors.competences && (
        <p className="text-xs text-destructive">{errors.competences.message}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/5")}
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
