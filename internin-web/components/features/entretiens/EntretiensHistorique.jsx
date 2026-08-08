"use client";
// Section "Entretiens précédents" — réutilise directement le rendu
// compact déjà existant dans EntretienCardStagiaire.jsx (prop compact),
// aucune logique dupliquée. Affiche seulement les entretiens réellement
// terminés/annulés/absents, triés du plus récent au plus ancien.

import { useState } from "react";
import { motion } from "framer-motion";
import EntretienCardStagiaire from "./EntretienCardStagiaire";
import { STATUTS_PASSES } from "@/lib/entretiens/statut";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function EntretiensHistorique({ entretiens }) {
  const { t } = useTranslation();
  const [voirTout, setVoirTout] = useState(false);

  const passes = [...(entretiens || [])]
    .filter((e) => STATUTS_PASSES.includes(e.statut))
    .sort((a, b) => new Date(b.dateHeure) - new Date(a.dateHeure));

  if (passes.length === 0) return null;

  const affiches = voirTout ? passes : passes.slice(0, 4);

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-foreground">
        {t("interviews.history.title")}
      </h3>
      <div className="space-y-2">
        {affiches.map((e, i) => (
          <motion.div
            key={e.idEntretien}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
          >
            <EntretienCardStagiaire entretien={e} compact />
          </motion.div>
        ))}
      </div>

      {!voirTout && passes.length > 4 && (
        <button
          type="button"
          onClick={() => setVoirTout(true)}
          className="mt-3 text-xs font-semibold text-[#14b8a6] hover:underline"
        >
          {t("interviews.history.viewAll", {
            n: passes.length,
          })}
        </button>
      )}
    </div>
  );
}
