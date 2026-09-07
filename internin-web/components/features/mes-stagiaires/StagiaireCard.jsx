"use client";

import Link from "next/link";
import { useSupervisionContext } from "@/lib/supervision/SupervisionContext";
import { useRappelerEvaluationSuperviseur } from "@/lib/queries/useSuperviseur";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiTarget,
  FiCheckSquare,
  FiAlertTriangle,
  FiArrowUpRight,
  FiUserCheck,
} from "react-icons/fi";

const STATUT_LABEL_KEYS = {
  actif: "mesStagiaires.status.active",
  termine: "mesStagiaires.status.completed",
  interrompu: "mesStagiaires.status.interrupted",
};

const STATUT_STYLES = {
  actif: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500",
  },
  termine: {
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
    ring: "ring-muted-foreground/40",
  },
  interrompu: {
    badge: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    ring: "ring-destructive",
  },
};

const AVATAR_COLORS = [
  "#14B8A6",
  "#5B3DF5",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#10B981",
  "#F97316",
  "#8B5CF6",
];

function formatDate(dateStr, locale = "fr") {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ProgressBar({ value }) {
  const [width, setWidth] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = requestAnimationFrame(() => setWidth(value));
    return () => cancelAnimationFrame(id);
  }, [value, reduceMotion]);

  const display = reduceMotion ? value : width;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, display))}%` }}
      />
    </div>
  );
}

export default function StagiaireCard({ stagiaire, index }) {
  const { t, locale } = useTranslation();
  const { basePath, isEntreprise } = useSupervisionContext();
  const rappelMut = useRappelerEvaluationSuperviseur();
  const [rappelMsg, setRappelMsg] = useState(null);
  const couleur = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initiales =
    `${stagiaire.prenom?.charAt(0) || ""}${stagiaire.nom?.charAt(0) || ""}`.toUpperCase();
  const statut = STATUT_STYLES[stagiaire.statutStage] || STATUT_STYLES.termine;
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={
        reduceMotion
          ? undefined
          : {
              hidden: { opacity: 0, y: 12 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.3, ease: "easeOut" },
              },
            }
      }
      className="h-full"
    >
      <Link
        href={`${basePath}/${stagiaire.idStage}`}
        className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Chevron hover */}
        <span className="absolute right-4 top-4 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary">
          <FiArrowUpRight className="h-4 w-4" />
        </span>

        {/* Header avatar + nom */}
        <div className="mb-4 flex items-start gap-3 pr-6">
          <div className="relative shrink-0">
            {stagiaire.photoProfilUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stagiaire.photoProfilUrl}
                alt={`${stagiaire.prenom} ${stagiaire.nom}`}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white/30"
                style={{ backgroundColor: couleur }}
              >
                {initiales}
              </span>
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${statut.dot}`}
              aria-hidden
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {stagiaire.prenom} {stagiaire.nom}
              </p>
              {stagiaire.alerte && (
                <span className="inline-flex items-center gap-1 rounded-md border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                  <FiAlertTriangle className="h-3 w-3" />
                  {t("mesStagiaires.card.actionRequired")}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {stagiaire.formation || t("mesStagiaires.card.noEducation")}
              {stagiaire.universite ? ` · ${stagiaire.universite}` : ""}
            </p>
          </div>
        </div>

        {/* Infos poste / secteur / dates */}
        <div className="mb-4 space-y-1.5">
          <p className="text-sm font-medium text-foreground">{stagiaire.poste}</p>
          {stagiaire.secteurActivite && (
            <p className="text-xs text-muted-foreground">
              {stagiaire.secteurActivite}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FiCalendar className="h-3.5 w-3.5 shrink-0" />
            {formatDate(stagiaire.dateDebut, locale)} →{" "}
            {formatDate(stagiaire.dateFinPrevue, locale)}
          </p>
          {stagiaire.superviseurAssigne ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FiUserCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                Superviseur :{" "}
                <span className="font-medium text-foreground">
                  {stagiaire.superviseurAssigne}
                </span>
              </span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-amber-700/90 dark:text-amber-400/90">
              <FiUserCheck className="h-3.5 w-3.5 shrink-0" />
              {t("mesStagiaires.card.noSupervisor")}
            </p>
          )}
        </div>

        {/* Badge statut + % */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statut.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statut.dot}`} />
            {t(STATUT_LABEL_KEYS[stagiaire.statutStage] || "mesStagiaires.status.active")}
          </span>
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {stagiaire.progression}%
          </span>
        </div>

        {/* Progression */}
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            Progression
          </p>
          <ProgressBar value={stagiaire.progression ?? 0} />
        </div>

        {/* {t("mesStagiaires.card.objectives")} / {t("mesStagiaires.card.tasks")} */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/60 bg-muted/40 px-2.5 py-2">
            <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <FiTarget className="h-3 w-3 text-primary" />
              {t("mesStagiaires.card.objectives")}
            </div>
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {stagiaire.objectifsAtteints}
              <span className="font-normal text-muted-foreground">
                /{stagiaire.objectifsTotal}
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/40 px-2.5 py-2">
            <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <FiCheckSquare className="h-3 w-3 text-secondary" />
              {t("mesStagiaires.card.tasks")}
            </div>
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {stagiaire.tachesTerminees}
              <span className="font-normal text-muted-foreground">
                /{stagiaire.tachesTotal}
              </span>
            </p>
          </div>
        </div>

        {/* Dernière activité */}
        <p className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <FiClock className="h-3.5 w-3.5 shrink-0" />
          {stagiaire.derniereActivite
            ? t("mesStagiaires.card.lastEvaluation", { date: formatDate(stagiaire.derniereActivite, locale) })
            : t("mesStagiaires.card.noEvaluation")}
        </p>

        {/* Entreprise : rappel superviseur si évaluation en retard */}
        {isEntreprise && stagiaire.alerte && stagiaire.superviseurAssigne && (
          <div className="mt-3 border-t border-border/60 pt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full text-xs"
              disabled={rappelMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setRappelMsg(null);
                rappelMut.mutate(stagiaire.idStage, {
                  onSuccess: (data) => {
                    setRappelMsg(
                      data?.message || t("mesStagiaires.card.reminderSent"),
                    );
                  },
                  onError: (err) => {
                    setRappelMsg(
                      err?.message || t("mesStagiaires.card.reminderError"),
                    );
                  },
                });
              }}
            >
              {rappelMut.isPending
                ? t("mesStagiaires.card.sending")
                : t("mesStagiaires.card.remindSupervisor")}
            </Button>
            {rappelMsg && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {rappelMsg}
              </p>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
