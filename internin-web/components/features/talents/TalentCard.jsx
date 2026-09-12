"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getInitials,
  localization,
  DISPONIBILITE_LABELS,
  formatFormation,
} from "./talentUtils";
import { cn } from "@/lib/utils";

/** Proposition désactivée uniquement si le stagiaire est actuellement en stage. */
export function canProposeToTalent(talent) {
  return talent?.statutStage !== "actif";
}

export default function TalentCard({
  talent,
  onView,
  onPropose,
  canPropose = true,
  index = 0,
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const loc = localization(talent);
  const score =
    typeof talent.scoreCompletudeProfil === "number"
      ? Math.min(100, Math.max(0, talent.scoreCompletudeProfil))
      : null;
  const competences = Array.isArray(talent.competences)
    ? talent.competences
    : [];
  const totalComps =
    typeof talent.competencesCount === "number"
      ? talent.competencesCount
      : competences.length;
  const shown = competences.slice(0, 4);
  const extra = Math.max(0, totalComps - shown.length);
  const dispo = DISPONIBILITE_LABELS[talent.statutStage];
  const form = formatFormation(talent.formation);
  const proposeEnabled = canPropose && canProposeToTalent(talent);

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -4,
              boxShadow:
                "0 10px 25px -5px rgb(0 0 0 / 0.08), 0 4px 10px -6px rgb(0 0 0 / 0.06)",
              transition: { duration: 0.2, ease: "easeOut" },
            }
      }
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.2),
        ease: "easeOut",
      }}
      className={cn(
        "group flex min-w-0 w-full max-w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm",
        "transition-[border-color] duration-200 ease-out",
        "hover:border-primary/25",
        "will-change-transform",
      )}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-background"
          whileHover={reduceMotion ? undefined : { scale: 1.06 }}
          transition={{ duration: 0.2 }}
        >
          {talent.photoProfilUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={talent.photoProfilUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm font-semibold text-muted-foreground">
              {getInitials(talent.prenom, talent.nom)}
            </div>
          )}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {talent.prenom} {talent.nom}
            </h3>
            {dispo && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  dispo.className,
                )}
              >
                {dispo.labelKey ? t(dispo.labelKey) : dispo.label}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {talent.titreProfessionnel || t("talents.card.student")}
          </p>
          {loc && (
            <p className="mt-1 inline-flex max-w-full items-center gap-0.5 truncate text-[11px] text-muted-foreground">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{loc}</span>
            </p>
          )}
        </div>
      </div>

      {form?.title && (
        <div className="mt-3 flex gap-2 rounded-xl bg-muted/40 px-2.5 py-2 text-xs">
          <GraduationCap
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{form.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {[form.school, form.level].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {shown.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("talents.card.skills")}
          </p>
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {shown.map((c) => (
              <span
                key={c.idCompetence || c.nom}
                className="max-w-full break-words rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-foreground/85"
              >
                {c.nom}
              </span>
            ))}
            {extra > 0 && (
              <span className="max-w-full rounded-md bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                +{extra}
              </span>
            )}
          </div>
        </div>
      )}

      {score != null && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              {t("talents.card.profileCompleted")}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {score} %
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-auto space-y-2 pt-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 w-full min-w-0 rounded-lg sm:h-10"
            onClick={() => onView?.(talent)}
          >
            {t("talents.card.viewProfile")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-11 w-full min-w-0 rounded-lg sm:h-10"
            disabled={!proposeEnabled}
            title={
              proposeEnabled ? undefined : t("talents.card.inInternshipTitle")
            }
            onClick={() => proposeEnabled && onPropose?.(talent)}
          >
            {t("talents.card.proposeShort")}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
