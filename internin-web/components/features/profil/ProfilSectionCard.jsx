"use client";
// Carte de section réutilisée par toutes les sections de "Mon profil".
// Refonte visuelle : légère animation d'entrée + micro-interaction au
// survol, icône de section optionnelle. API strictement compatible avec
// l'existant (title, onEdit, children) — un `icon` optionnel a été
// ajouté, les sections qui ne le passent pas continuent de fonctionner
// à l'identique.

import { motion, useReducedMotion } from "framer-motion";
import { FiEdit2 } from "react-icons/fi";

export default function ProfilSectionCard({
  title,
  icon: Icon,
  onEdit,
  children,
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      className="rounded-md border border-border bg-card p-5 transition-shadow duration-200 hover:shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </h2>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium text-primary transition-colors duration-150 hover:bg-primary/10"
          >
            <FiEdit2 className="h-3.5 w-3.5" />
            Modifier
          </button>
        )}
      </div>
      {children}
    </motion.div>
  );
}
