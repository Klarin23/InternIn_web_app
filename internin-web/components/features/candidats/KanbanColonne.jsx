"use client";

import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence } from "framer-motion";
import KanbanCard from "./KanbanCard";

export default function KanbanColonne({ colonne, candidatures, candidaturesFraiches, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: colonne.id });

  return (
    <div className="flex w-72 flex-shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h5 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span>{colonne.emoji}</span>
          {colonne.titre}
        </h5>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
          {candidatures.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-40 flex-1 flex-col gap-2.5 rounded-md border-2 border-dashed p-2.5 transition-colors ${
          isOver
            ? "border-primary bg-primary/5"
            : "border-border/60 bg-muted/20"
        }`}
      >
        {candidatures.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Aucun candidat
          </p>
        )}
        <AnimatePresence>
          {candidatures.map((c) => (
            <KanbanCard
              key={c.idCandidature}
              candidature={c}
              onOpen={onOpen}
              estNouvelle={candidaturesFraiches?.has(c.idCandidature)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
