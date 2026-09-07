"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiAlertTriangle,
  FiCalendar,
  FiClipboard,
  FiArrowRight,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

/**
 * Centre d'attention — uniquement des métriques dérivées des données réelles.
 */
export default function AttentionCenter({ items = [] }) {
  const { t, locale } = useTranslation();
  const reduce = useReducedMotion();
  const visible = items.filter((i) => i.count > 0);

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">
          {t("entrepriseSpace.dashboard.attentionTitle")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("entrepriseSpace.dashboard.attentionEmpty")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-card p-5 shadow-sm ring-1 ring-amber-500/10">
      <div className="mb-3 flex items-center gap-2">
        <FiAlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <h3 className="text-sm font-semibold text-foreground">
          {t("entrepriseSpace.dashboard.attentionTitle")}
        </h3>
      </div>
      <ul className="space-y-2">
        {visible.map((item, i) => {
          const Icon = item.icon || FiClipboard;
          return (
            <motion.li
              key={item.key}
              initial={reduce ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: reduce ? 0 : i * 0.06, duration: 0.25 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border/80 bg-muted/30 px-3 py-2.5 transition hover:border-primary/25 hover:bg-muted/60",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {item.labelKey
                      ? t(item.labelKey, { count: item.count })
                      : `${item.count} ${item.label || ""}`}
                  </span>
                  {item.hint && (
                    <span className="text-xs text-muted-foreground">
                      {item.hint}
                    </span>
                  )}
                </span>
                <FiArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

export { FiCalendar, FiClipboard };
