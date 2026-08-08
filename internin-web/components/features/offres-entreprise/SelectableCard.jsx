"use client";

import { motion } from "framer-motion";
import { FiCheck } from "react-icons/fi";
import { cn } from "@/lib/utils";

// Carte sélectionnable générique, utilisée pour le mode de travail et la
// rémunération (point 5 et 7 du cahier des charges). Se comporte comme un
// input radio : rôle "radio", navigation clavier (Enter/Espace), état
// aria-checked — donc utilisable au clavier comme le Select qu'elle remplace.
export default function SelectableCard({
  selected,
  onSelect,
  icon: Icon,
  label,
  description,
  className,
}) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "relative flex flex-col items-start gap-2 rounded-md border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40",
        className,
      )}
    >
      {selected && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <FiCheck className="h-3 w-3" />
        </motion.span>
      )}
      {Icon && (
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg text-lg",
            selected
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </motion.button>
  );
}
