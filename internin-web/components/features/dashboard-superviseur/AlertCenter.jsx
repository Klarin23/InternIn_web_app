"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronRight,
  FiClipboard,
  FiBookOpen,
  FiFlag,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";


function localizeAlertText(item, t) {
  if (!item) return { titre: "", description: "" };
  let titre = item.titre || "";
  let description = item.description || "";
  const map = {
    "Évaluation à effectuer": "superviseurDashboard.alerts.items.evalTodo",
    "Évaluation en retard": "superviseurDashboard.alerts.items.evalLate",
    "Stage bientôt terminé": "superviseurDashboard.alerts.items.endingSoon",
    "Journal à vérifier": "superviseurDashboard.alerts.items.journalReview",
  };
  if (map[titre]) titre = t(map[titre]);
  // descriptions often include names - keep as-is from backend if mixed
  return { titre, description };
}

const TYPE_ICON = {
  evaluation: FiClipboard,
  journal: FiBookOpen,
  fin_stage: FiFlag,
};

export default function AlertCenter({ items = [], compact = false }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const STYLE = {
    urgent: {
      bar: "bg-destructive",
      badge: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
      label: t("superviseurDashboard.severity.urgent"),
      icon: FiAlertTriangle,
    },
    attention: {
      bar: "bg-amber-500",
      badge:
        "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400",
      label: t("superviseurDashboard.severity.attention"),
      icon: FiAlertTriangle,
    },
    info: {
      bar: "bg-primary/70",
      badge: "bg-primary/10 text-primary ring-1 ring-primary/20",
      label: t("superviseurDashboard.severity.info"),
      icon: FiFlag,
    },
    attente: {
      bar: "bg-primary/70",
      badge: "bg-primary/10 text-primary ring-1 ring-primary/20",
      label: t("superviseurDashboard.severity.info"),
      icon: FiFlag,
    },
  };

  const DEFAULT_ACTION = {
    evaluation: t("superviseurDashboard.actions.evaluateNow"),
    journal: t("superviseurDashboard.actions.verify"),
    fin_stage: t("superviseurDashboard.actions.viewInternship"),
  };

  const urgent = items.filter((i) => i.gravite === "urgent").length;
  const attention = items.filter(
    (i) => i.gravite === "attention" || i.gravite === "attente",
  ).length;
  const displayed = compact ? items.slice(0, 4) : items;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_6px_20px_-10px_rgba(17,24,39,0.10)]">
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <FiAlertTriangle className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-foreground">
                {t("superviseurDashboard.alerts.title")}
              </h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("superviseurDashboard.alerts.subtitle")}
            </p>
          </div>
          {items.length > 0 && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold tabular-nums text-foreground">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {urgent > 0 && (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 font-semibold text-destructive">
                {t("superviseurDashboard.alerts.urgentCount", {
                  count: urgent,
                })}
              </span>
            )}
            {attention > 0 && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-700 dark:text-amber-400">
                {t("superviseurDashboard.alerts.watchCount", {
                  count: attention,
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 px-4 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <FiCheckCircle className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {t("superviseurDashboard.alerts.emptyTitle")}
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            {t("superviseurDashboard.alerts.emptyDesc")}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/50">
          {displayed.map((item, idx) => {
            const style = STYLE[item.gravite] || STYLE.info;
            const Icon = TYPE_ICON[item.type] || FiAlertTriangle;
            const action =
              item.actionLabel ||
              DEFAULT_ACTION[item.type] ||
              t("superviseurDashboard.actions.view");
            return (
              <motion.li
                key={`${item.type}-${item.idStage}-${idx}`}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: reduceMotion ? 0 : Math.min(idx, 6) * 0.05,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <Link
                  href={item.lien || "/mes-stagiaires"}
                  className="group flex items-stretch transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <span className={cn("w-1 shrink-0", style.bar)} aria-hidden />
                  <div className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            style.badge,
                          )}
                        >
                          {style.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Icon className="h-3 w-3" />
                          {localizeAlertText(item, t).titre}
                        </span>
                      </div>
                      {(() => {
                        const loc = localizeAlertText(item, t);
                        return (
                          <>
                            <p className="truncate text-sm font-semibold text-foreground">
                              {item.prenomStagiaire
                                ? `${item.prenomStagiaire} ${item.nomStagiaire || ""}`
                                : loc.description || loc.titre}
                            </p>
                            {item.prenomStagiaire && (loc.description || item.description) && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {loc.description || item.description}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                      {action}
                      <FiChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}

      {compact && items.length > 4 && (
        <div className="border-t border-border/60 px-4 py-3 text-center">
          <Link
            href="/tableau-de-bord#alertes"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("superviseurDashboard.alerts.viewAll", { count: items.length })}
          </Link>
        </div>
      )}
    </div>
  );
}
