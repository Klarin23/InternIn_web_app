"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence } from "framer-motion";
import {
  Inbox,
  Eye,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  Undo2,
} from "lucide-react";
import KanbanCard from "./KanbanCard";
import {
  COLONNES_SANS_DND,
  isCandidatureVerrouillee,
} from "@/lib/utils/kanbanColonnes";

const ICONS = {
  Inbox,
  Eye,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  Undo2,
};

const ICON_COLORS = {
  nouvelles: "text-sky-600",
  consultees: "text-violet-600",
  preselectionnees: "text-amber-500",
  entretien: "text-primary",
  acceptees: "text-emerald-600",
  refusees: "text-destructive",
  retirees: "text-slate-500",
};

export default function KanbanColonne({
  colonne,
  candidatures,
  candidaturesFraiches,
  onOpen,
  entretienASignalerParCandidature,
}) {
  const { t } = useTranslation();
  const sansDrop = COLONNES_SANS_DND.has(colonne.id);
  const { setNodeRef, isOver } = useDroppable({
    id: colonne.id,
    disabled: sansDrop,
  });
  const Icon = ICONS[colonne.icon] || Inbox;
  const iconColor = ICON_COLORS[colonne.id] || "text-muted-foreground";

  return (
    <div className="flex w-72 flex-shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h5 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} aria-hidden />
          {colonne.titreKey ? t(colonne.titreKey) : colonne.titre}
        </h5>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
          {candidatures.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-40 flex-1 flex-col gap-2.5 rounded-md border-2 border-dashed p-2.5 transition-colors ${
          sansDrop
            ? "border-border/40 bg-muted/10"
            : isOver
              ? "border-primary bg-primary/5"
              : "border-border/60 bg-muted/20"
        }`}
      >
        {candidatures.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {t("entrepriseSpace.candidatures.kanbanEmpty")}
          </p>
        )}
        <AnimatePresence>
          {candidatures.map((c) => (
            <KanbanCard
              key={c.idCandidature}
              candidature={c}
              onOpen={onOpen}
              estNouvelle={candidaturesFraiches?.has(c.idCandidature)}
              entretienASignaler={
                entretienASignalerParCandidature?.[c.idCandidature] || null
              }
              dragDisabled={isCandidatureVerrouillee(c)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
