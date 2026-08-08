"use client";

import { useState } from "react";
import { FiLoader, FiAlertCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateEvaluation } from "@/lib/queries/useEvaluations";

const CRITERES = [
  ["noteAssiduite", "Assiduité"],
  ["noteCommunication", "Communication"],
  ["noteInitiative", "Initiative"],
  ["noteProfessionnalisme", "Professionnalisme"],
  ["noteTravailEquipe", "Travail d'équipe"],
  ["notePerformanceTechnique", "Performance technique"],
];

export default function SoumettreEvaluationDialog({ idStage, stagiaireNom }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(
    Object.fromEntries(CRITERES.map(([key]) => [key, 3])),
  );
  const [commentaires, setCommentaires] = useState("");
  const mutation = useCreateEvaluation();

  function handleSubmit() {
    mutation.mutate(
      { idStage, ...notes, commentaires },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="rounded-sm">
          Soumettre l&apos;évaluation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-md sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Évaluation hebdomadaire — {stagiaireNom}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {CRITERES.map(([key, label]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {notes[key]}/5
                </span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[notes[key]]}
                onValueChange={([v]) => setNotes((n) => ({ ...n, [key]: v }))}
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Commentaires{" "}
              <span className="text-muted-foreground">(facultatif)</span>
            </label>
            <textarea
              rows={3}
              className="w-full resize-y rounded-sm border border-border bg-background px-3.5 py-3 text-sm focus:border-primary focus:outline-none"
              value={commentaires}
              onChange={(e) => setCommentaires(e.target.value)}
            />
          </div>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <FiAlertCircle className="h-4 w-4 shrink-0" />
              {mutation.error.message}
            </div>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="h-11 w-full rounded-sm"
          >
            {mutation.isPending ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : (
              "Envoyer l'évaluation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
