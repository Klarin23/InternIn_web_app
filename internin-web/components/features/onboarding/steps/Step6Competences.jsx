"use client";
// Étape 6 : compétences suggérées + saisie libre + option "aucune".

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, Check, Plus, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function slugCustom(nom) {
  return `custom:${nom.trim().toLowerCase()}`;
}

export default function Step6Competences() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingStore();
  const { data: competencesResponse, isLoading, isError } = useCompetences();
  const [customInput, setCustomInput] = useState("");
  const [customType, setCustomType] = useState("technique");

  const competencesList = Array.isArray(competencesResponse)
    ? competencesResponse
    : Array.isArray(competencesResponse?.competences)
      ? competencesResponse.competences
      : [];

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step6Schema),
    defaultValues: { competences: data.competences || [] },
  });

  const selected = watch("competences") || [];

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

  const grouped = competencesList.reduce((acc, comp) => {
    (acc[comp.typeCompetence] ??= []).push(comp);
    return acc;
  }, {});

  function isSelected(id) {
    return selected.some((c) => c.idCompetence === id);
  }

  function toggle(comp) {
    if (isSelected(comp.idCompetence)) {
      setValue(
        "competences",
        selected.filter((c) => c.idCompetence !== comp.idCompetence),
        { shouldValidate: true },
      );
    } else {
      setValue(
        "competences",
        [
          ...selected,
          {
            idCompetence: comp.idCompetence,
            nom: comp.nom,
            niveau: "intermediaire",
            isCustom: false,
          },
        ],
        { shouldValidate: true },
      );
    }
  }

  function setNiveau(id, niveau) {
    setValue(
      "competences",
      selected.map((c) => (c.idCompetence === id ? { ...c, niveau } : c)),
      { shouldValidate: true },
    );
  }

  function clearAll() {
    setValue("competences", [], { shouldValidate: true });
  }

  function addCustom() {
    const nom = customInput.trim();
    if (!nom) return;

    const id = slugCustom(nom);
    // déjà présente (liste ou custom) ?
    const exists =
      selected.some(
        (c) =>
          c.idCompetence === id || c.nom?.toLowerCase() === nom.toLowerCase(),
      ) ||
      competencesList.some((c) => c.nom.toLowerCase() === nom.toLowerCase());

    if (exists) {
      // si dans la liste officielle, sélectionne-la
      const fromList = competencesList.find(
        (c) => c.nom.toLowerCase() === nom.toLowerCase(),
      );
      if (fromList && !isSelected(fromList.idCompetence)) {
        toggle(fromList);
      }
      setCustomInput("");
      return;
    }

    setValue(
      "competences",
      [
        ...selected,
        {
          idCompetence: id,
          nom,
          typeCompetence: customType,
          niveau: "intermediaire",
          isCustom: true,
        },
      ],
      { shouldValidate: true },
    );
    setCustomInput("");
  }

  function removeSelected(id) {
    setValue(
      "competences",
      selected.filter((c) => c.idCompetence !== id),
      { shouldValidate: true },
    );
  }

  const aucuneSelectionnee = selected.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Vos compétences
        </h1>
        <p className="text-sm text-muted-foreground">
          Choisissez parmi les suggestions, ajoutez les vôtres, ou passez cette
          étape si vous n&apos;en avez pas encore.
        </p>
      </div>

      {/* Option aucune */}
      <button
        type="button"
        onClick={clearAll}
        className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition ${
          aucuneSelectionnee
            ? "border-[#14b8a6] bg-[#14b8a6]/10 ring-1 ring-[#14b8a6]/30"
            : "border-border bg-card hover:border-muted-foreground/30"
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            aucuneSelectionnee
              ? "bg-[#14b8a6] text-white"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {aucuneSelectionnee ? (
            <Check className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">
            Aucune compétence pour le moment
          </span>
          <span className="block text-xs text-muted-foreground">
            Vous pourrez en ajouter plus tard depuis votre profil
          </span>
        </span>
      </button>

      {/* Saisie libre */}
      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-2 text-sm font-semibold text-foreground">
          Ajouter une compétence absente de la liste
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            className="h-11 rounded-sm border border-border bg-background px-3 text-sm text-foreground sm:w-44"
          >
            <option value="technique">Technique</option>
            <option value="professionnelle">Professionnelle</option>
            <option value="langue">Langue</option>
          </select>
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Ex. Figma, Comptabilité, Wolof…"
            className="h-11 flex-1 rounded-sm"
          />
          <Button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="h-11 rounded-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Sélectionnées */}
      {selected.length > 0 && (
        <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Sélectionnées ({selected.length})
          </p>
          <div className="space-y-2">
            {selected.map((c) => (
              <div
                key={c.idCompetence}
                className="flex flex-col gap-2 rounded-sm border border-border bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {c.nom ||
                      competencesList.find(
                        (x) => x.idCompetence === c.idCompetence,
                      )?.nom ||
                      "Compétence"}
                  </span>
                  {c.isCustom && (
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                      Personnalisée
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-full border border-border p-0.5">
                    {NIVEAUX.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNiveau(c.idCompetence, n)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                          c.niveau === n
                            ? "bg-[#14b8a6] text-white"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {NIVEAU_LABELS[n]}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelected(c.idCompetence)}
                    className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Retirer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions groupées */}
      <Controller
        name="competences"
        control={control}
        render={() => (
          <div className="space-y-7">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <h5 className="mb-3 text-sm font-semibold text-foreground">
                  {TYPE_LABELS[type] || type}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {items.map((comp) => {
                    const active = isSelected(comp.idCompetence);
                    return (
                      <button
                        type="button"
                        key={comp.idCompetence}
                        onClick={() => toggle(comp)}
                        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                          active
                            ? "border-[#14b8a6] bg-[#14b8a6] text-white"
                            : "border-border bg-card text-foreground hover:border-[#14b8a6]/50"
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
          </div>
        )}
      />

      {errors.competences && (
        <p className="text-xs text-destructive">{errors.competences.message}</p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-sm"
          onClick={() => router.push("/onboarding/5")}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 rounded-sm"
        >
          Continuer
        </Button>
      </div>
    </form>
  );
}
