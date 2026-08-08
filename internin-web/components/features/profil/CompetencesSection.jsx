"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Loader2, Check, Plus, X, Sparkles } from "lucide-react";
import { FiAward } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfilSectionCard from "./ProfilSectionCard";
import { useCompetences } from "@/lib/queries/useCompetences";
import { useUpdateStagiaireProfile } from "@/lib/queries/useStagiaireProfile";

const NIVEAUX = ["debutant", "intermediaire", "avance"];
const NIVEAU_LABELS = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

const TYPE_LABELS = {
  technique: "Techniques",
  professionnelle: "Professionnelles",
  langue: "Langues",
};

function slugCustom(nom) {
  return `custom:${nom.trim().toLowerCase()}`;
}

export default function CompetencesSection({ profil }) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customType, setCustomType] = useState("technique");

  const { data: competencesResponse, isLoading } = useCompetences();
  const updateProfile = useUpdateStagiaireProfile();

  const competencesList = Array.isArray(competencesResponse)
    ? competencesResponse
    : Array.isArray(competencesResponse?.competences)
      ? competencesResponse.competences
      : [];

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm({
    values: {
      competences: (profil.competences || []).map((c) => ({
        idCompetence: c.idCompetence,
        nom: c.nom,
        niveau: c.niveau || "intermediaire",
        isCustom: false,
      })),
    },
  });

  const selected = watch("competences") || [];

  function isSelected(id) {
    return selected.some((c) => c.idCompetence === id);
  }

  function toggle(comp) {
    if (isSelected(comp.idCompetence)) {
      setValue(
        "competences",
        selected.filter((c) => c.idCompetence !== comp.idCompetence),
      );
    } else {
      setValue("competences", [
        ...selected,
        {
          idCompetence: comp.idCompetence,
          nom: comp.nom,
          niveau: "intermediaire",
          isCustom: false,
        },
      ]);
    }
  }

  function setNiveau(id, niveau) {
    setValue(
      "competences",
      selected.map((c) => (c.idCompetence === id ? { ...c, niveau } : c)),
    );
  }

  function clearAll() {
    setValue("competences", []);
  }

  function removeSelected(id) {
    setValue(
      "competences",
      selected.filter((c) => c.idCompetence !== id),
    );
  }

  function addCustom() {
    const nom = customInput.trim();
    if (!nom) return;

    const id = slugCustom(nom);
    const already =
      selected.some(
        (c) =>
          c.idCompetence === id || c.nom?.toLowerCase() === nom.toLowerCase(),
      ) ||
      competencesList.some((c) => c.nom.toLowerCase() === nom.toLowerCase());

    if (already) {
      const fromList = competencesList.find(
        (c) => c.nom.toLowerCase() === nom.toLowerCase(),
      );
      if (fromList && !isSelected(fromList.idCompetence)) {
        toggle(fromList);
      }
      setCustomInput("");
      return;
    }

    setValue("competences", [
      ...selected,
      {
        idCompetence: id,
        nom,
        typeCompetence: customType,
        niveau: "intermediaire",
        isCustom: true,
      },
    ]);
    setCustomInput("");
  }

  function onSubmit(values) {
    updateProfile.mutate(
      { competences: values.competences },
      { onSuccess: () => setOpen(false) },
    );
  }

  const grouped = (competencesList || []).reduce((acc, comp) => {
    (acc[comp.typeCompetence] ??= []).push(comp);
    return acc;
  }, {});

  const aucune = selected.length === 0;

  return (
    <>
      <ProfilSectionCard
        title="Compétences"
        icon={FiAward}
        onEdit={() => setOpen(true)}
      >
        {!profil.competences?.length ? (
          <p className="text-sm text-muted-foreground">
            Aucune compétence renseignée.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profil.competences.map((c) => (
              <motion.span
                key={c.idCompetence}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground transition-colors duration-150 hover:border-primary/50 hover:bg-primary/5"
              >
                {c.nom}
                <span className="text-xs text-muted-foreground">
                  · {NIVEAU_LABELS[c.niveau] || c.niveau}
                </span>
              </motion.span>
            ))}
          </div>
        )}
      </ProfilSectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compétences</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement...
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Aucune */}
              <button
                type="button"
                onClick={clearAll}
                className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition ${
                  aucune
                    ? "border-[#14b8a6] bg-[#14b8a6]/10 ring-1 ring-[#14b8a6]/30"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    aucune
                      ? "bg-[#14b8a6] text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {aucune ? (
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
                    Efface toute la sélection
                  </span>
                </span>
              </button>

              {/* Saisie libre */}
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold text-foreground">
                  Compétence absente de la liste
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="h-10 rounded-sm border border-border bg-background px-2 text-sm sm:w-40"
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
                    placeholder="Ex. Figma, Wolof…"
                    className="h-10 flex-1 rounded-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addCustom}
                    disabled={!customInput.trim()}
                    className="h-10 rounded-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
              </div>

              {/* Sélectionnées */}
              {selected.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Sélectionnées ({selected.length})
                  </p>
                  {selected.map((c) => (
                    <div
                      key={c.idCompetence}
                      className="flex flex-col gap-2 rounded-sm border border-border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {c.nom ||
                            competencesList.find(
                              (x) => x.idCompetence === c.idCompetence,
                            )?.nom ||
                            "Compétence"}
                        </span>
                        {c.isCustom && (
                          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                            Perso
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
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                c.niveau === n
                                  ? "bg-[#14b8a6] text-white"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {NIVEAU_LABELS[n]}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelected(c.idCompetence)}
                          className="rounded-sm p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-5">
                {Object.entries(grouped).map(([type, items]) => (
                  <div key={type}>
                    <h5 className="mb-2.5 text-sm font-semibold text-foreground">
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
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                              active
                                ? "border-[#14b8a6] bg-[#14b8a6] text-white"
                                : "border-border bg-card hover:border-[#14b8a6]/50"
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

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-sm"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || updateProfile.isPending}
                  className="rounded-sm"
                >
                  {isSubmitting || updateProfile.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
