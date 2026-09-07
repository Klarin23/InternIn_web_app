"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import AnimatedCard from "@/components/motion/AnimatedCard";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { cn } from "@/lib/utils";

export default function StatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  color,
  highlight = false,
}) {
  const reduce = useReducedMotion();
  const [hasEntered, setHasEntered] = useState(false);
  const animatedValue = useCountUp(value, { start: hasEntered });

  return (
    <AnimatedCard
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md",
        highlight &&
          "bg-linear-to-br from-primary/[0.06] via-transparent to-primary/[0.02]",
      )}
      viewport={{ once: true, amount: 0.5 }}
      onViewportEnter={() => setHasEntered(true)}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={hasEntered ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: reduce ? 0 : 0.25 }}
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-xl ring-4 ring-inset ring-background/40",
          color,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={hasEntered ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.08 }}
        className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl"
      >
        {hasEntered ? animatedValue : 0}
      </motion.div>

      <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
      )}

      <div className="mt-auto pt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary/40"
            initial={{ width: 0 }}
            animate={
              hasEntered
                ? { width: `${Math.min(100, Math.max(8, Number(value) || 0))}%` }
                : { width: 0 }
            }
            transition={{ duration: reduce ? 0 : 0.7, ease: "easeOut" }}
          />
        </div>
      </div>
    </AnimatedCard>
  );
}
