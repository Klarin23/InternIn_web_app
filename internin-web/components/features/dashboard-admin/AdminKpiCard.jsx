"use client";

import Link from "next/link";
import { useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import AnimatedCard from "@/components/motion/AnimatedCard";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { cn } from "@/lib/utils";

/**
 * Carte KPI admin : valeur animée, libellé, contexte, lien d'action optionnel.
 * Données 100 % issues des stats API (pas de valeurs inventées).
 */
export default function AdminKpiCard({
  icon: Icon,
  value = 0,
  label,
  sublabel,
  href,
  actionLabel = "Voir",
  tone = "default", // default | warning | danger | success | info
  urgent = false,
}) {
  const [hasEntered, setHasEntered] = useState(false);
  const animatedValue = useCountUp(Number(value) || 0, { start: hasEntered });

  const toneStyles = {
    default: "bg-muted text-foreground",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    danger: "bg-red-500/15 text-red-600 dark:text-red-400",
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    info: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    teal: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
    purple: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  };

  const content = (
    <AnimatedCard
      className={cn(
        "group flex h-full flex-col border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md hover:border-border",
        urgent && Number(value) > 0 && "ring-1 ring-destructive/30",
      )}
      viewport={{ once: true, amount: 0.5 }}
      onViewportEnter={() => setHasEntered(true)}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            toneStyles[tone] || toneStyles.default,
          )}
        >
          {Icon && <Icon className="h-5 w-5" aria-hidden />}
        </div>
        {urgent && Number(value) > 0 && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
            Urgent
          </span>
        )}
      </div>

      <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
        {hasEntered ? animatedValue : 0}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
      )}

      {href && (
        <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-primary opacity-90 transition group-hover:gap-1.5 group-hover:opacity-100">
          {actionLabel}
          <FiArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
    </AnimatedCard>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={`${label} : ${value}. ${actionLabel}`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
