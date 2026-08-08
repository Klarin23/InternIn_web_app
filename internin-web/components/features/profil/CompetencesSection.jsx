"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { FiAward } from "react-icons/fi";
import { Button } from "@/components/ui/button";
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

export default function CompetencesSection({ profil }) {
  const [open, setOpen] = useState(false);
  const { data: competencesList, isLoading } = useCompetences();
  const updateProfile = useUpdateStagiaireProfile();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm({
    values: {
      competences: (profil.competences || []).map((c) => ({
        idCompetence: c.idCompetence,
        niveau: c.niveau || "intermediaire",
      })),
    },
  });

  function onSubmit(values) {
    updateProfile.mutate(values, { onSuccess: () => setOpen(false) });
  }

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
        <DialogContent className="max-h-[85vh] overflow-y-auto">
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
              <Controller
                name="competences"
                control={control}
                render={({ field }) => {
                  const selected = field.value;
                  const isSelected = (id) =>
                    selected.some((c) => c.idCompetence === id);

                  function toggle(id) {
                    if (isSelected(id)) {
                      field.onChange(
                        selected.filter((c) => c.idCompetence !== id),
                      );
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

                  const grouped = (competencesList || []).reduce(
                    (acc, comp) => {
                      (acc[comp.typeCompetence] ??= []).push(comp);
                      return acc;
                    },
                    {},
                  );

                  return (
                    <div className="space-y-6">
                      {Object.entries(grouped).map(([type, items]) => (
                        <div key={type}>
                          <h5 className="mb-2.5 text-sm font-semibold text-foreground capitalize">
                            {type}
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {items.map((comp) => {
                              const active = isSelected(comp.idCompetence);
                              return (
                                <button
                                  type="button"
                                  key={comp.idCompetence}
                                  onClick={() => toggle(comp.idCompetence)}
                                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
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

                      {selected.length > 0 && (
                        <div className="rounded-md border border-border bg-muted/40 p-3.5">
                          <h5 className="mb-3 text-sm font-semibold text-foreground">
                            Niveau ({selected.length} sélectionnée
                            {selected.length > 1 ? "s" : ""})
                          </h5>
                          <div className="space-y-2.5">
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
                                        onClick={() =>
                                          setNiveau(sel.idCompetence, niv)
                                        }
                                        className={`rounded-sm px-2 py-1 text-xs font-medium ${
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
              <Button type="submit" disabled={isSubmitting} className="w-full">
                Enregistrer
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
