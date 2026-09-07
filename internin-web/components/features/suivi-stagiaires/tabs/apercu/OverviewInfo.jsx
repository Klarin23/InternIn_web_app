"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  GraduationCap,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatDate } from "./apercuUtils";

function Row({ icon: Icon, label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function OverviewInfo({ stage }) {
  const { t, locale } = useTranslation();
  const localeTag = locale === "en" ? "en-GB" : "fr-FR";
  const reduceMotion = useReducedMotion();

  const rows = [
    {
      icon: Briefcase,
      label: t("suivi.overview.position"),
      value: stage?.titrePoste,
    },
    {
      icon: User,
      label: t("suivi.overview.supervisor"),
      value: stage?.nomTuteur,
    },
    {
      icon: GraduationCap,
      label: t("suivi.overview.institution"),
      value: stage?.nomUniversite,
    },
    {
      icon: Calendar,
      label: t("suivi.overview.start"),
      value: formatDate(stage?.dateDebut, localeTag) || stage?.dateDebut,
    },
    {
      icon: Calendar,
      label: t("suivi.overview.endPlanned"),
      value: formatDate(stage?.dateFinPrevue, localeTag) || stage?.dateFinPrevue,
    },
    {
      icon: FileText,
      label: t("suivi.overview.objectives"),
      value: stage?.objectifsApprentissage,
    },
  ].filter((r) => r.value != null && String(r.value).trim() !== "");

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.3,
        delay: reduceMotion ? 0 : 0.08,
      }}
      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
    >
      <h4 className="text-sm font-semibold text-foreground">
        {t("suivi.overview.infoTitle")}
      </h4>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("suivi.overview.noExtraInfo")}
        </p>
      ) : (
        <div className="mt-1 divide-y divide-border/60">
          {rows.map((r) => (
            <Row key={r.label} icon={r.icon} label={r.label} value={r.value} />
          ))}
        </div>
      )}
    </motion.section>
  );
}
