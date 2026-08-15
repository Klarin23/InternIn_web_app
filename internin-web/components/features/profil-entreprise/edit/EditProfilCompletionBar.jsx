"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FiTrendingUp } from "react-icons/fi";

// Barre de progression affichée en haut du formulaire d'édition. Le score
// est recalculé en direct à partir des valeurs du formulaire (voir
// lib/utils/profilCompletion.js) pour donner un retour immédiat pendant la
// saisie, avant même la sauvegarde.
export default function EditProfilCompletionBar({ pourcentage, complet }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <FiTrendingUp className="h-4 w-4 text-primary" />
          Profil complété à {pourcentage}%
        </span>
        {!complet && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Ajoutez les informations manquantes pour améliorer sa visibilité.
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
        <motion.div
          initial={shouldReduceMotion ? false : { width: 0 }}
          animate={{ width: `${pourcentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
        />
      </div>
      {!complet && (
        <p className="mt-1.5 text-xs text-muted-foreground sm:hidden">
          Votre profil est presque complet. Ajoutez les informations
          manquantes pour améliorer sa visibilité.
        </p>
      )}
    </div>
  );
}
