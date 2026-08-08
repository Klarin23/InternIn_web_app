"use client";

import { useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiLoader,
  FiEdit2,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useMonJournal,
  useAjouterEntreeJournal,
  useUpdateEntreeJournal,
  useSupprimerEntreeJournal,
} from "@/lib/queries/useStages";

const STATUT_LABELS = {
  en_attente: "En attente de validation",
  validee: "Validée",
  correction_demandee: "Correction demandée",
  terminee: "Terminée",
};

const STATUT_COLORS = {
  en_attente: "bg-accent/40 text-amber-700",
  validee: "bg-success/10 text-green-700",
  correction_demandee: "bg-destructive/10 text-destructive",
  terminee: "bg-primary/10 text-primary",
};

const MODIFIABLE = new Set(["en_attente", "correction_demandee"]);

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function FormulaireEntree({ idStage, entree, onTerminer }) {
  const [titre, setTitre] = useState(entree?.titre || "");
  const [description, setDescription] = useState(entree?.description || "");
  const [dateActivite, setDateActivite] = useState(
    entree?.dateActivite || new Date().toISOString().slice(0, 10),
  );
  const ajouter = useAjouterEntreeJournal(idStage);
  const update = useUpdateEntreeJournal(idStage);
  const pending = ajouter.isPending || update.isPending;

  function handleValider() {
    if (!titre.trim() || !description.trim()) return;
    const payload = {
      titre: titre.trim(),
      description: description.trim(),
      dateActivite,
    };
    if (entree) {
      update.mutate(
        { idEntree: entree.idEntree, payload },
        { onSuccess: onTerminer },
      );
    } else {
      ajouter.mutate(payload, { onSuccess: onTerminer });
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
      <Input
        placeholder="Titre de l'activité"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        className="h-10 rounded-sm"
      />
      <Textarea
        placeholder="Décrivez ce que vous avez réalisé..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-[80px] rounded-sm"
      />
      <Input
        type="date"
        value={dateActivite}
        onChange={(e) => setDateActivite(e.target.value)}
        className="h-10 w-48 rounded-sm"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="h-9 rounded-sm px-3 text-xs"
          disabled={!titre.trim() || !description.trim() || pending}
          onClick={handleValider}
        >
          {pending ? (
            <FiLoader className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <FiCheck className="h-3.5 w-3.5" />
              {entree ? "Enregistrer" : "Publier"}
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 rounded-sm px-3 text-xs"
          onClick={onTerminer}
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}

export default function JournalStageSection({ idStage }) {
  const { data: entrees, isLoading } = useMonJournal(idStage);
  const supprimer = useSupprimerEntreeJournal(idStage);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [idEnEdition, setIdEnEdition] = useState(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
        <FiLoader className="h-4 w-4 animate-spin" />
        Chargement...
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Journal de stage
        </h2>
        {!ajoutOuvert && (
          <Button
            type="button"
            size="sm"
            className="h-9 rounded-sm px-3 text-xs"
            onClick={() => setAjoutOuvert(true)}
          >
            <FiPlus className="h-3.5 w-3.5" />
            Nouvelle activité
          </Button>
        )}
      </div>

      {ajoutOuvert && (
        <div className="mb-4">
          <FormulaireEntree
            idStage={idStage}
            onTerminer={() => setAjoutOuvert(false)}
          />
        </div>
      )}

      {(!entrees || entrees.length === 0) && !ajoutOuvert ? (
        <p className="text-sm text-muted-foreground">
          Aucune activité enregistrée pour l&apos;instant.
        </p>
      ) : (
        <ul className="space-y-3">
          {(entrees || []).map((e) =>
            idEnEdition === e.idEntree ? (
              <li key={e.idEntree}>
                <FormulaireEntree
                  idStage={idStage}
                  entree={e}
                  onTerminer={() => setIdEnEdition(null)}
                />
              </li>
            ) : (
              <li
                key={e.idEntree}
                className="rounded-md border border-border/60 p-4"
              >
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {e.titre}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_COLORS[e.statutValidation]}`}
                  >
                    {STATUT_LABELS[e.statutValidation]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{e.description}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {formatDate(e.dateActivite)}
                </p>

                {e.commentaireSuperviseur && (
                  <p className="mt-2 rounded-sm border-l-2 border-primary/40 bg-primary/5 px-3 py-2 text-xs text-foreground">
                    <span className="font-semibold">
                      Commentaire du superviseur :{" "}
                    </span>
                    {e.commentaireSuperviseur}
                  </p>
                )}

                {MODIFIABLE.has(e.statutValidation) && (
                  <div className="mt-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setIdEnEdition(e.idEntree)}
                      className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      <FiEdit2 className="h-3 w-3" />
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => supprimer.mutate(e.idEntree)}
                      className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      <FiTrash2 className="h-3 w-3" />
                      Supprimer
                    </button>
                  </div>
                )}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
