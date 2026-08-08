"use client";

import { useState } from "react";
import { FiTrash2, FiLoader, FiAward } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompetences } from "@/lib/queries/useCompetences";
import {
  useAjouterCompetenceAcquise,
  useSupprimerCompetenceAcquise,
} from "@/lib/queries/useSuperviseur";

export default function CompetencesAcquisesPanel({
  idStage,
  competencesAcquises,
}) {
  const [selection, setSelection] = useState("");
  const { data: catalogue } = useCompetences();
  const ajouter = useAjouterCompetenceAcquise(idStage);
  const supprimer = useSupprimerCompetenceAcquise(idStage);

  const idsDejaAcquises = new Set(
    competencesAcquises.map((c) => c.idCompetence),
  );
  const optionsDisponibles = (catalogue || []).filter(
    (c) => !idsDejaAcquises.has(c.idCompetence),
  );

  function handleSelection(idCompetence) {
    setSelection("");
    ajouter.mutate(idCompetence);
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Compétences acquises
      </h2>

      <Select
        value={selection}
        onValueChange={handleSelection}
        disabled={ajouter.isPending}
      >
        <SelectTrigger className="mb-4 h-10 w-full rounded-sm">
          <SelectValue placeholder="Marquer une compétence comme acquise..." />
        </SelectTrigger>
        <SelectContent>
          {optionsDisponibles.map((c) => (
            <SelectItem key={c.idCompetence} value={c.idCompetence}>
              {c.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {competencesAcquises.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune compétence marquée comme acquise pour l&apos;instant.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {competencesAcquises.map((c) => (
            <span
              key={c.idAcquisition}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 py-1.5 pl-3 pr-2 text-xs font-medium text-primary"
            >
              <FiAward className="h-3.5 w-3.5" />
              {c.nomCompetence}
              <button
                type="button"
                onClick={() => supprimer.mutate(c.idAcquisition)}
                className="rounded-full p-0.5 hover:bg-primary/20"
                aria-label="Retirer la compétence"
              >
                <FiTrash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {ajouter.isPending && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <FiLoader className="h-3 w-3 animate-spin" />
          Ajout en cours...
        </p>
      )}
    </div>
  );
}
