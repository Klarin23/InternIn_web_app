"use client";
// Le compteur ne démarre qu'au moment où la carte entre réellement dans le
// viewport (onViewportEnter, fourni nativement par framer-motion sur
// AnimatedCard puisque c'est un motion.div) — pas seulement au montage React.
// Ça garantit un 0 -> total à chaque affichage, même si les données étaient
// déjà en cache (retour sur la page, navigation rapide, etc.).

import { useState } from "react";
import AnimatedCard from "@/components/motion/AnimatedCard";
import { useCountUp } from "@/lib/hooks/useCountUp";

export default function StatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  color,
  highlight = false,
}) {
  const [hasEntered, setHasEntered] = useState(false);
  const animatedValue = useCountUp(value, { start: hasEntered });

  return (
    <AnimatedCard
      className={`flex h-full flex-col ${highlight ? "bg-linear-to-br from-primary/[0.06] via-transparent to-primary/[0.02]" : ""}`}
      viewport={{ once: true, amount: 0.6 }}
      onViewportEnter={() => setHasEntered(true)}
    >
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ring-4 ring-inset ring-white/40 ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold tabular-nums text-foreground">
        {hasEntered ? animatedValue : 0}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{label}</div>
      {sublabel && (
        <div className="text-xs text-muted-foreground">{sublabel}</div>
      )}
    </AnimatedCard>
  );
}