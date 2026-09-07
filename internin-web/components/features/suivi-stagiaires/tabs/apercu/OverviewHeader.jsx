"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Mail, Phone, GraduationCap, Briefcase } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getInitials,
  avatarColor,
  formatDateShort,
  STATUT_CONFIG,
  getStatutAffichage,
} from "./apercuUtils";

export default function OverviewHeader({ stage, moyenne }) {
  const { t, locale } = useTranslation();
  const localeTag = locale === "en" ? "en-GB" : "fr-FR";
  const reduceMotion = useReducedMotion();
  const statutKey = getStatutAffichage(stage, moyenne);
  const config = STATUT_CONFIG[statutKey] || STATUT_CONFIG.en_cours;
  const initials = getInitials(stage?.prenom, stage?.nom);
  const color = avatarColor(`${stage?.prenom || ""}${stage?.nom || ""}`);

  const fullName =
    `${stage?.prenom || ""} ${stage?.nom || ""}`.trim() ||
    t("suivi.common.intern");

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm"
          style={{ backgroundColor: color }}
          aria-hidden
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {fullName}
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${config.color}`}
            >
              {t(config.labelKey)}
            </span>
          </div>

          {stage?.titrePoste && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Briefcase className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{stage.titrePoste}</span>
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {stage?.nomUniversite && (
              <span className="flex items-center gap-1">
                <GraduationCap className="size-3.5" aria-hidden />
                {stage.nomUniversite}
              </span>
            )}
            {(stage?.dateDebut || stage?.dateFinPrevue) && (
              <span>
                {formatDateShort(stage?.dateDebut, localeTag) || "—"}
                {" → "}
                {formatDateShort(stage?.dateFinPrevue, localeTag) || "—"}
              </span>
            )}
          </div>

          {(stage?.telephone || stage?.email) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {stage.telephone && (
                <a
                  href={`tel:${stage.telephone}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                >
                  <Phone className="size-3.5" aria-hidden />
                  {stage.telephone}
                </a>
              )}
              {stage.email && (
                <a
                  href={`mailto:${stage.email}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                >
                  <Mail className="size-3.5" aria-hidden />
                  <span className="max-w-[200px] truncate">{stage.email}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
