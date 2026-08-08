"use client";

import { motion } from "framer-motion";
import { FiTrendingUp } from "react-icons/fi";

export default function CompletudeCard({ profil }) {
  const score = profil.scoreCompletude ?? 0;
  const manquants = profil.champsManquants || [];

  if (score >= 100) return null;

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h5 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FiTrendingUp className="h-4 w-4 text-primary" />
          Profil complété à {score}%
        </h5>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
        />
      </div>

      {manquants.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Ajoutez {manquants.slice(0, 2).join(" et ")}
          {manquants.length > 2
            ? `, et ${manquants.length - 2} autre${manquants.length - 2 > 1 ? "s" : ""} information${manquants.length - 2 > 1 ? "s" : ""}`
            : ""}{" "}
          pour compléter votre profil.
        </p>
      )}
    </div>
  );
}
