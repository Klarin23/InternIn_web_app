"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ClipboardCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  formatRelativeDate,
  formatDate,
  formatRelativeDateParts,
} from "./apercuUtils";

export default function OverviewActivity({ events }) {
  const { t, locale } = useTranslation();
  const localeTag = locale === "en" ? "en-GB" : "fr-FR";
  const reduceMotion = useReducedMotion();
  const list = Array.isArray(events) ? events : [];

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
    >
      <div>
        <h4 className="text-sm font-semibold text-foreground">
          {t("suivi.overview.recentActivity")}
        </h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("suivi.overview.activityHint")}
        </p>
      </div>

      {list.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border/80 px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            {t("suivi.overview.noActivity")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("suivi.overview.noActivityHint")}
          </p>
        </div>
      ) : (
        <ul className="relative mt-5 space-y-0 pl-1">
          <div
            className="absolute bottom-2 left-[11px] top-2 w-px bg-border"
            aria-hidden
          />
          {list.map((ev, index) => {
            const title = ev.titleKey
              ? t(ev.titleKey, ev.titleParams || {})
              : ev.title || "";
            const description = ev.description
              ? ev.description
              : ev.descriptionKey
                ? t(ev.descriptionKey)
                : null;
            const rel = formatRelativeDateParts(ev.date);
            const dateLabel = rel
              ? t(rel.key, rel.params)
              : formatDate(ev.date, localeTag) ||
                (ev.numeroSemaine
                  ? t("suivi.eval.weekN", { n: ev.numeroSemaine })
                  : null);

            return (
              <motion.li
                key={ev.id || index}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.25,
                  delay: reduceMotion ? 0 : Math.min(index * 0.05, 0.25),
                }}
                className="relative flex gap-3 pb-5 last:pb-0"
              >
                <span className="relative z-10 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary">
                  <ClipboardCheck className="size-3" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  {description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {description}
                    </p>
                  )}
                  {dateLabel && (
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                      {dateLabel}
                    </p>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}
