"use client";

import { motion } from "framer-motion";

// Couleurs d'avatar réparties par index pour varier visuellement, comme
// dans la maquette (chaque candidat a une couleur d'initiales différente).

const AVATAR_COLORS = [
  "#14B8A6",
  "#5B3DF5",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#10B981",
  "#F97316",
  "#8B5CF6",
];

const STATUT_LABELS = {
  soumise: "Nouveau",
  consultee: "En cours",
  preselectionnee: "Entretien",
  rejetee: "Refusé",
  retiree: "Retiré",
  acceptee: "Accepté",
};
const STATUT_COLORS = {
  soumise: "bg-primary/10 text-primary",
  consultee: "bg-accent/40 text-amber-700",
  preselectionnee: "bg-[#EDE9FE] text-[#6D28D9]",
  rejetee: "bg-destructive/10 text-destructive",
  retiree: "bg-muted text-muted-foreground",
  acceptee: "bg-success/10 text-green-700",
};

// Repère prioritaire sur l'entretien en cours, affiché à la place du statut
// de candidature classique quand une action/attention entreprise est requise.
const ENTRETIEN_LABELS = {
  planifie: "En attente",
  reprogramme: "Reprogrammation demandée",
  valide: "En attente de confirmation",
};
const ENTRETIEN_COLORS = {
  planifie: "bg-[#FEF3C7] text-[#B45309]",
  reprogramme: "bg-[#FFEDD5] text-[#C2410C]",
  valide: "bg-[#CFFAFE] text-[#0E7490]",
};

export default function CandidatureRow({
  candidature,
  index,
  onOpen,
  entretienASignaler,
  estNouvelle = false,
}) {
  const couleur = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const score = candidature.scoreCompletudeProfil ?? 0;
  const date = new Date(candidature.dateCandidature).toLocaleDateString(
    "fr-FR",
    { day: "2-digit", month: "short", year: "numeric" },
  );

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ scale: 1.01 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        delay: Math.min(index, 8) * 0.03,
      }}
      type="button"
      onClick={() => onOpen(candidature)}
      className="grid w-full grid-cols-[1.6fr_1.2fr_1fr_0.8fr_0.9fr_0.9fr] items-center gap-3 border-b border-border px-2 py-3.5 text-left text-sm transition-colors hover:bg-muted/50"
    >
      <span className="flex items-center gap-2.5">
        <span
          className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: couleur }}
        >
          {candidature.prenom?.charAt(0)}
          {candidature.nom?.charAt(0)}
          {estNouvelle && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.25,
                type: "spring",
                stiffness: 500,
                damping: 15,
              }}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[8px] font-bold text-white shadow"
            >
              Nouveau
            </motion.span>
          )}
        </span>
        <span className="truncate font-semibold text-foreground">
          {candidature.prenom} {candidature.nom}
        </span>
      </span>

      <span className="truncate text-muted-foreground">
        {candidature.nomUniversite || "-"}
      </span>

      <span className="truncate text-muted-foreground">
        {candidature.titreOffre}
      </span>

      <span>
        {entretienASignaler ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ENTRETIEN_COLORS[entretienASignaler.statut]}`}
          >
            {ENTRETIEN_LABELS[entretienASignaler.statut]}
          </span>
        ) : (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_COLORS[candidature.statut]}`}
          >
            {STATUT_LABELS[candidature.statut]}
          </span>
        )}
      </span>

      <span className="flex items-center gap-2">
        <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${score}%` }}
          />
        </span>
        <span className="text-xs font-semibold text-foreground">{score}</span>
      </span>

      <span className="text-xs text-muted-foreground">{date}</span>
    </motion.button>
  );
}
