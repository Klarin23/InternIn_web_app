"use client";

import { useState } from "react";
import { FiPlus, FiTrash2, FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useAjouterObjectif,
  useUpdateObjectif,
  useSupprimerObjectif,
} from "@/lib/queries/useSuperviseur";

export default function ObjectifsPanel({ idStage, objectifs }) {
  const [nouveau, setNouveau] = useState("");
  const ajouter = useAjouterObjectif(idStage);
  const update = useUpdateObjectif(idStage);
  const supprimer = useSupprimerObjectif(idStage);

  function handleAjouter() {
    if (!nouveau.trim()) return;
    ajouter.mutate(nouveau.trim(), { onSuccess: () => setNouveau("") });
  }

  const realises = objectifs.filter((o) => o.statut === "realise").length;

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Objectifs du stage
        </h2>
        <span className="text-xs text-muted-foreground">
          {realises} / {objectifs.length} réalisés
        </span>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Ajouter un objectif..."
          value={nouveau}
          onChange={(e) => setNouveau(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAjouter()}
          className="h-10 rounded-sm"
        />
        <Button
          type="button"
          className="h-10 rounded-sm px-3"
          disabled={!nouveau.trim() || ajouter.isPending}
          onClick={handleAjouter}
        >
          {ajouter.isPending ? (
            <FiLoader className="h-4 w-4 animate-spin" />
          ) : (
            <FiPlus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {objectifs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun objectif défini pour l&apos;instant.
        </p>
      ) : (
        <ul className="space-y-2">
          {objectifs.map((o) => (
            <li key={o.idObjectif} className="flex items-center gap-2.5">
              <Checkbox
                checked={o.statut === "realise"}
                onCheckedChange={(v) =>
                  update.mutate({
                    idObjectif: o.idObjectif,
                    payload: { statut: v ? "realise" : "defini" },
                  })
                }
              />
              <span
                className={`flex-1 text-sm ${
                  o.statut === "realise"
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {o.description}
              </span>
              <button
                type="button"
                onClick={() => supprimer.mutate(o.idObjectif)}
                className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Supprimer l'objectif"
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
