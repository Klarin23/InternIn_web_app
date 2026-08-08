"use client";

import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";

export default function CreerOffreCard({ onClick, disabled = false }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      transition={{ duration: 0.18, ease: "easeOut" }}
      title={
        disabled
          ? "Disponible après vérification de votre entreprise par l'administration"
          : undefined
      }
      className={
        disabled
          ? "group relative flex min-h-[220px] cursor-not-allowed flex-col items-center justify-center gap-4 overflow-hidden rounded-md border-2 border-dashed border-border bg-card p-5 text-center opacity-60"
          : "group relative flex min-h-[220px] flex-col items-center justify-center gap-4 overflow-hidden rounded-md border-2 border-dashed border-border bg-card p-5 text-center transition-colors hover:border-blue-500"
      }
    >
      {!disabled && (
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/[0.06] via-transparent to-secondary/[0.08] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}

      <div
        className={
          disabled
            ? "relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-300 text-white"
            : "relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-300 text-white shadow-lg shadow-secondary/25 transition duration-300 ease-in-out group-hover:bg-blue-500"
        }
      >
        <FiPlus className="h-6 w-6" />
      </div>

      <div className="relative">
        <span
          className={
            disabled
              ? "block text-sm font-semibold text-foreground"
              : "block text-sm font-semibold text-foreground transition-colors group-hover:text-blue-500"
          }
        >
          Créer une offre
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {disabled
            ? "Vérification admin requise"
            : "Publiez un poste et recevez des candidatures"}
        </span>
      </div>
    </motion.button>
  );
}
