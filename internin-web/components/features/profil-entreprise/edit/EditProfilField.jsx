"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Enveloppe commune pour un champ du formulaire d'édition : label, contenu
// (Input / Select / Textarea déjà stylés dans components/ui), message
// d'erreur inline animé et compteur de caractères optionnel.
export default function EditProfilField({
  id,
  label,
  error,
  hint,
  charCount,
  className,
  children,
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {typeof charCount === "number" && (
          <span className="text-xs text-muted-foreground">{charCount} caractères</span>
        )}
      </div>
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs font-medium text-destructive"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
