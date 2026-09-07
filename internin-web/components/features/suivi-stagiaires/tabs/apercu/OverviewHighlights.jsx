"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function OverviewHighlights({ items }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const list = Array.isArray(items) ? items : [];

  if (list.length === 0) return null;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
    >
      <h4 className="text-sm font-semibold text-foreground">
        {t("suivi.overview.remember")}
      </h4>
      <ul className="mt-3 space-y-2">
        {list.map((item, index) => {
          const isWarn = item.type === "warn";
          const text = item.key
            ? t(item.key, item.params || {})
            : item.text || "";
          return (
            <li
              key={`${item.key || item.text || index}-${index}`}
              className="flex items-start gap-2.5 text-sm text-foreground"
            >
              {isWarn ? (
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-amber-500"
                  aria-hidden
                />
              ) : (
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-500"
                  aria-hidden
                />
              )}
              <span>{text}</span>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
