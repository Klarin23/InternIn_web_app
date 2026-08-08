"use client";

import { motion } from "framer-motion";

export default function OffreSection({
  icon: Icon,
  title,
  delay = 0,
  children,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      className="rounded-md border border-border bg-card p-6 sm:p-7"
    >
      <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {title}
      </h5>
      <div className="space-y-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
        {children}
      </div>
    </motion.div>
  );
}
