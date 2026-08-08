"use client";

import { useState } from "react";
import { FiLock, FiSend, FiLoader } from "react-icons/fi";
import {
  useNotesCandidature,
  useAjouterNote,
} from "@/lib/queries/useCandidaturesEntreprise";

function formatDate(date) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotesPrivees({ idCandidature }) {
  const { data: notes, isLoading } = useNotesCandidature(idCandidature);
  const ajouterNote = useAjouterNote(idCandidature);
  const [contenu, setContenu] = useState("");

  function handleEnvoyer() {
    if (!contenu.trim()) return;
    ajouterNote.mutate(contenu.trim(), { onSuccess: () => setContenu("") });
  }

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <FiLock className="h-3 w-3" />
        Visibles uniquement par votre équipe — jamais par le candidat
      </p>

      <div className="mb-3 flex gap-2">
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleEnvoyer();
          }}
          placeholder="Écrire une note interne... (Ctrl+Entrée pour envoyer)"
          rows={2}
          className="flex-1 resize-none rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleEnvoyer}
          disabled={!contenu.trim() || ajouterNote.isPending}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center self-end rounded-sm bg-primary text-primary-foreground disabled:opacity-40"
        >
          {ajouterNote.isPending ? (
            <FiLoader className="h-4 w-4 animate-spin" />
          ) : (
            <FiSend className="h-4 w-4" />
          )}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : !notes || notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune note pour le moment.
        </p>
      ) : (
        <div className="space-y-2.5">
          {notes.map((n) => (
            <div
              key={n.idNote}
              className="rounded-md border border-border/60 bg-muted/20 p-3"
            >
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {n.contenu}
              </p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {n.nomMembre || "Membre de l'équipe"} ·{" "}
                {formatDate(n.dateCreation)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
