"use client";
// Version animée : chaque candidature entre en glissant depuis la droite avec
// un léger rebond (spring). AnimatePresence gère aussi la sortie si une
// candidature disparaît de la liste (ex: retirée par le stagiaire).

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const STATUT_LABELS = {
  soumise: "Nouveau",
  consultee: "Consultée",
  preselectionnee: "Entretien",
  rejetee: "Refusée",
  retiree: "Retirée",
  acceptee: "Acceptée",
};
const STATUT_COLORS = {
  soumise: "bg-primary/10 text-primary",
  consultee: "bg-[#DBEAFE] text-[#1D4ED8]",
  preselectionnee: "bg-[#EDE9FE] text-[#6D28D9]",
  rejetee: "bg-destructive/10 text-destructive",
  retiree: "bg-muted text-muted-foreground",
  acceptee: "bg-success/10 text-green-700",
};

export default function RecentCandidaturesList({ candidatures }) {
  const dernieres = [...(candidatures || [])]
    .sort((a, b) => new Date(b.dateCandidature) - new Date(a.dateCandidature))
    .slice(0, 4);

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h5 className="text-sm font-semibold text-foreground">
          Dernières candidatures
        </h5>
        <Link
          href="/candidats"
          className="text-xs font-semibold text-secondary-foreground hover:underline"
        >
          Voir tout
        </Link>
      </div>

      {dernieres.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucune candidature pour l&apos;instant
        </p>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {dernieres.map((c) => (
              <motion.div
                key={c.idCandidature}
                layout
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary-foreground/10 text-xs font-bold text-secondary-foreground">
                  {c.prenom?.charAt(0)}
                  {c.nom?.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {c.prenom} {c.nom}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.titreOffre}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUT_COLORS[c.statut]}`}
                >
                  {STATUT_LABELS[c.statut]}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
