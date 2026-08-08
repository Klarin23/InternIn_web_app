"use client";

import { useState } from "react";
import { FiCheck, FiX, FiFlag, FiLoader, FiInbox } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useModererEntreeJournal } from "@/lib/queries/useSuperviseur";

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

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function LigneEntree({ idStage, entree }) {
  const [commentaire, setCommentaire] = useState(
    entree.commentaireSuperviseur || "",
  );
  const [zoneCommentaireOuverte, setZoneCommentaireOuverte] = useState(false);
  const moderer = useModererEntreeJournal(idStage);

  function handleAction(statutValidation) {
    moderer.mutate(
      {
        idEntree: entree.idEntree,
        payload: {
          statutValidation,
          commentaireSuperviseur: commentaire || undefined,
        },
      },
      { onSuccess: () => setZoneCommentaireOuverte(false) },
    );
  }

  return (
    <div className="rounded-md border border-border/60 p-4">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-foreground">{entree.titre}</span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_COLORS[entree.statutValidation]}`}
        >
          {STATUT_LABELS[entree.statutValidation]}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{entree.description}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {formatDate(entree.dateActivite)}
      </p>

      {entree.commentaireSuperviseur && !zoneCommentaireOuverte && (
        <p className="mt-2 rounded-sm border-l-2 border-primary/40 bg-primary/5 px-3 py-2 text-xs text-foreground">
          <span className="font-semibold">Votre commentaire : </span>
          {entree.commentaireSuperviseur}
        </p>
      )}

      {zoneCommentaireOuverte && (
        <Textarea
          placeholder="Commentaire (optionnel)..."
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          className="mt-2 min-h-[70px] rounded-sm"
        />
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {entree.statutValidation !== "validee" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-sm px-2.5 text-xs"
            disabled={moderer.isPending}
            onClick={() => handleAction("validee")}
          >
            <FiCheck className="h-3.5 w-3.5" />
            Valider
          </Button>
        )}
        {entree.statutValidation !== "terminee" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-sm px-2.5 text-xs"
            disabled={moderer.isPending}
            onClick={() => handleAction("terminee")}
          >
            <FiFlag className="h-3.5 w-3.5" />
            Marquer terminée
          </Button>
        )}
        {entree.statutValidation !== "correction_demandee" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-sm px-2.5 text-xs text-destructive hover:text-destructive"
            disabled={moderer.isPending}
            onClick={() => {
              if (!zoneCommentaireOuverte) {
                setZoneCommentaireOuverte(true);
                return;
              }
              handleAction("correction_demandee");
            }}
          >
            {moderer.isPending ? (
              <FiLoader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FiX className="h-3.5 w-3.5" />
            )}
            Demander une correction
          </Button>
        )}
      </div>
    </div>
  );
}

export default function JournalModerationPanel({ idStage, entrees }) {
  if (!entrees || entrees.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Journal de stage
        </h2>
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <FiInbox className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Le stagiaire n&apos;a encore enregistré aucune activité.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Journal de stage
      </h2>
      <div className="space-y-3">
        {entrees.map((e) => (
          <LigneEntree key={e.idEntree} idStage={idStage} entree={e} />
        ))}
      </div>
    </div>
  );
}
