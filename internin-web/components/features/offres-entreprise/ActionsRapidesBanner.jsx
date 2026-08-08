"use client";

import { motion, AnimatePresence } from "framer-motion";

function estAujourdhui(date) {
  return new Date(date).toDateString() === new Date().toDateString();
}

export default function ActionsRapidesBanner({ offres, candidatures, entretiens }) {
  const offresExpirentBientot = (offres || []).filter((o) => {
    if (o.statut !== "publie" || !o.dateLimiteCandidature) return false;
    const jours = Math.ceil((new Date(o.dateLimiteCandidature) - new Date()) / 86400000);
    return jours >= 0 && jours <= 7;
  }).length;

  const nouvellesCandidatures = (candidatures || []).filter((c) => c.statut === "soumise").length;

  const entretiensAujourdhui = (entretiens || []).filter(
    (e) => e.statut === "planifie" && estAujourdhui(e.dateHeure),
  ).length;

  const alertes = [
    offresExpirentBientot > 0 && {
      key: "expire",
      emoji: "⚠️",
      texte: `${offresExpirentBientot} offre${offresExpirentBientot > 1 ? "s" : ""} expire${offresExpirentBientot > 1 ? "nt" : ""} cette semaine`,
    },
    nouvellesCandidatures > 0 && {
      key: "candidatures",
      emoji: "📨",
      texte: `${nouvellesCandidatures} nouvelle${nouvellesCandidatures > 1 ? "s" : ""} candidature${nouvellesCandidatures > 1 ? "s" : ""} à examiner`,
    },
    entretiensAujourdhui > 0 && {
      key: "entretiens",
      emoji: "📅",
      texte: `${entretiensAujourdhui} entretien${entretiensAujourdhui > 1 ? "s" : ""} prévu${entretiensAujourdhui > 1 ? "s" : ""} aujourd'hui`,
    },
  ].filter(Boolean);

  if (alertes.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-6 flex flex-wrap gap-3 overflow-hidden"
      >
        {alertes.map((a) => (
          <div
            key={a.key}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm"
          >
            <span>{a.emoji}</span>
            {a.texte}
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}