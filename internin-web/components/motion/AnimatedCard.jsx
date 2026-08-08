"use client";
// Carte réutilisable avec micro-interaction au survol : légère élévation,
// ombre plus marquée, zoom 1.02. Pensé pour remplacer les <div className="rounded-md border...">
// statiques du dashboard entreprise, sans toucher aux cartes des autres espaces.

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AnimatedCard({
  children,
  className = "",
  as: Component = motion.div,
  ...props
}) {
  return (
    <Component
      className={cn(
        "rounded-md border border-border bg-card p-5 will-change-transform",
        className,
      )}
      whileHover={{
        y: -3,
        scale: 1.02,
        boxShadow: "0 12px 28px -8px rgba(17, 24, 39, 0.16)",
      }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      {...props}
    >
      {children}
    </Component>
  );
}
