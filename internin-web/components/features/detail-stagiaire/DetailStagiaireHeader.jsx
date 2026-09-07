"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiBookOpen,
} from "react-icons/fi";
import { useSupervisionContext } from "@/lib/supervision/SupervisionContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUT_LABEL_KEYS = {
  a_venir: "mesStagiaires.status.upcoming",
  actif: "mesStagiaires.header.stageInProgress",
  termine: "mesStagiaires.status.completed",
  interrompu: "mesStagiaires.status.interrupted",
};

const STATUT_COLORS = {
  a_venir:
    "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  actif:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  termine: "bg-muted text-muted-foreground",
  interrompu: "bg-destructive/10 text-destructive",
};

function formatDate(dateStr, locale = "fr") {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * @param {object} props
 * @param {object} props.stagiaire
 * @param {object} props.stage
 * @param {object} [props.stats] - { progression, objectifsFaits, objectifsTotal, tachesFaites, tachesTotal, journalCount }
 * @param {object} [props.meta] - { titrePoste, ville, formationLabel }
 */
export default function DetailStagiaireHeader({
  stagiaire,
  stage,
  stats,
  meta,
}) {
  const { t, locale } = useTranslation();
  const { basePath } = useSupervisionContext();
  const reduceMotion = useReducedMotion();
  const initiales =
    `${stagiaire.prenom?.charAt(0) || ""}${stagiaire.nom?.charAt(0) || ""}`.toUpperCase();

  const debut = formatDate(stage?.dateDebut, locale);
  const fin = formatDate(stage?.dateFinPrevue || stage?.dateFin, locale);
  const periode = debut && fin ? `${debut} → ${fin}` : debut || fin;

  const statItems = [];
  if (stats?.progression != null) {
    statItems.push({
      label: t("mesStagiaires.header.progress"),
      value: `${stats.progression} %`,
    });
  }
  if (stats?.objectifsTotal != null) {
    statItems.push({
      label: t("mesStagiaires.header.objectives"),
      value: `${stats.objectifsFaits ?? 0}/${stats.objectifsTotal}`,
    });
  }
  if (stats?.tachesTotal != null) {
    statItems.push({
      label: t("mesStagiaires.header.tasks"),
      value: `${stats.tachesFaites ?? 0}/${stats.tachesTotal}`,
    });
  }
  if (stats?.journalCount != null) {
    statItems.push({
      label: t("mesStagiaires.header.journal"),
      value: String(stats.journalCount),
    });
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22 }}
    >
      <Link
        href={basePath}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <FiArrowLeft className="h-4 w-4" aria-hidden />
        {t("mesStagiaires.header.myInterns")}
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          {stagiaire.photoProfilUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stagiaire.photoProfilUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-background"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
              {initiales}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {stagiaire.prenom} {stagiaire.nom}
              </h1>
              {stage?.statut && (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    STATUT_COLORS[stage.statut] || STATUT_COLORS.termine,
                  )}
                >
                  {(() => {
                    const key = STATUT_LABEL_KEYS[stage?.statut];
                    if (key) {
                      const label = t(key);
                      return label && label !== key ? label : stage.statut;
                    }
                    return stage?.statut || "—";
                  })()}
                </span>
              )}
            </div>

            {(meta?.titrePoste || stagiaire.titreProfessionnel) && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {meta?.titrePoste || stagiaire.titreProfessionnel}
              </p>
            )}

            {meta?.formationLabel && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <FiBookOpen className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                {meta.formationLabel}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {stagiaire.email && (
                <span className="inline-flex items-center gap-1">
                  <FiMail className="h-3.5 w-3.5" aria-hidden />
                  {stagiaire.email}
                </span>
              )}
              {stagiaire.telephone && (
                <span className="inline-flex items-center gap-1">
                  <FiPhone className="h-3.5 w-3.5" aria-hidden />
                  {stagiaire.telephone}
                </span>
              )}
              {(meta?.ville || stagiaire.ville) && (
                <span className="inline-flex items-center gap-1">
                  <FiMapPin className="h-3.5 w-3.5" aria-hidden />
                  {meta?.ville || stagiaire.ville}
                </span>
              )}
              {periode && (
                <span className="inline-flex items-center gap-1">
                  <FiCalendar className="h-3.5 w-3.5" aria-hidden />
                  {periode}
                </span>
              )}
            </div>
          </div>
        </div>

        {statItems.length > 0 && (
          <div className="grid grid-cols-2 gap-px border-t border-border/60 bg-border/40 sm:grid-cols-4">
            {statItems.map((s) => (
              <div
                key={s.label}
                className="bg-card px-4 py-3 text-center sm:text-left"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
