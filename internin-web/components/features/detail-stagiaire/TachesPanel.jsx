"use client";

import { useState } from "react";
import { FiPlus, FiTrash2, FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useAjouterTache,
  useUpdateTache,
  useSupprimerTache,
} from "@/lib/queries/useSuperviseur";

export default function TachesPanel({ idStage, taches }) {
  const [nouvelle, setNouvelle] = useState("");
  const ajouter = useAjouterTache(idStage);
  const update = useUpdateTache(idStage);
  const supprimer = useSupprimerTache(idStage);

  function handleAjouter() {
    if (!nouvelle.trim()) return;
    ajouter.mutate(nouvelle.trim(), { onSuccess: () => setNouvelle("") });
  }

  const terminees = taches.filter((t) => t.statut === "terminee").length;

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Tâches effectuées
        </h2>
        <span className="text-xs text-muted-foreground">
          {terminees} / {taches.length} terminées
        </span>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Ajouter une tâche..."
          value={nouvelle}
          onChange={(e) => setNouvelle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAjouter()}
          className="h-10 rounded-sm"
        />
        <Button
          type="button"
          className="h-10 rounded-sm px-3"
          disabled={!nouvelle.trim() || ajouter.isPending}
          onClick={handleAjouter}
        >
          {ajouter.isPending ? (
            <FiLoader className="h-4 w-4 animate-spin" />
          ) : (
            <FiPlus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {taches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune tâche enregistrée pour l&apos;instant.
        </p>
      ) : (
        <ul className="space-y-2">
          {taches.map((t) => (
            <li key={t.idTache} className="flex items-center gap-2.5">
              <Checkbox
                checked={t.statut === "terminee"}
                onCheckedChange={(v) =>
                  update.mutate({
                    idTache: t.idTache,
                    payload: { statut: v ? "terminee" : "a_faire" },
                  })
                }
              />
              <span
                className={`flex-1 text-sm ${
                  t.statut === "terminee"
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {t.description}
              </span>
              <button
                type="button"
                onClick={() => supprimer.mutate(t.idTache)}
                className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Supprimer la tâche"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
