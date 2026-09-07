"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Target,
  Trophy,
  User,
  Sparkles,
  ArrowRight,
  Circle,
  CircleDot,
  ListChecks,
} from "lucide-react";

import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import EvaluationTimeline from "@/components/features/stage/EvaluationTimeline";
import CoachIACard from "@/components/features/stage/CoachIACard";
import CertificatCard from "@/components/features/stage/CertificatCard";
import RecommandationCard from "@/components/features/stage/RecommandationCard";
import JournalStageSection from "@/components/features/stage/JournalStageSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonStage } from "@/lib/queries/useStages";
import { useEvaluations, useCoaching } from "@/lib/queries/useEvaluations";
import { useCertificat } from "@/lib/queries/useStages";
import { useRecommandation } from "@/lib/queries/useRecommandations";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getStageStatus(stage) {
  if (!stage) return "none";
  // Priorité au statut backend (source de vérité cycle de vie)
  if (stage.statut === "termine" || stage.statut === "interrompu") return "termine";
  if (stage.statut === "a_venir" || stage.estAVenir) return "a_venir";
  if (stage.statut === "actif" || stage.estActif) return "en_cours";
  // Fallback dates (legacy)
  const now = new Date();
  const debut = new Date(stage.dateDebut);
  if (now < debut) return "a_venir";
  return "en_cours";
}


/** Pourcentage affiché : API unifiée puis repli legacy */
function resolveStageProgressPercent(stage) {
  if (!stage) return 0;
  const candidates = [
    stage.progressionAffichee,
    stage.progression?.percent,
    stage.progressionCalculee,
    stage.progressionPourcentage,
  ];
  for (const c of candidates) {
    if (c == null || c === "") continue;
    const n = Number(c);
    if (Number.isFinite(n)) return Math.min(100, Math.max(0, Math.round(n)));
  }
  return 0;
}

function AnimatedProgressBar({ value, className }) {
  const clamped = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const config = {
    en_cours: { labelKey: "statusInProgress", className: "bg-primary/10 text-primary border-primary/20" },
    a_venir: { labelKey: "statusUpcoming", className: "bg-warning/10 text-warning border-warning/20" },
    termine: { labelKey: "statusFinished", className: "bg-success/10 text-success border-success/20" },
    none: { labelKey: "statusNone", className: "bg-muted text-muted-foreground border-border" },
  };
  const c = config[status] || config.none;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", c.className)}>
      {t(`stagiaireSpace.stage.${c.labelKey}`)}
    </span>
  );
}

function StageSummaryCard({ stage, status }) {
  const { t } = useTranslation();
  const progression = resolveStageProgressPercent(stage);
  const entreprise = stage.entreprise || { nomEntreprise: stage.nomEntreprise };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="overflow-hidden rounded-md border border-border bg-card shadow-sm"
    >
      <div className="bg-gradient-to-br from-primary/5 via-transparent to-transparent p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
              {entreprise.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entreprise.logoUrl} alt={entreprise.nomEntreprise} className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <StatusBadge status={status} />
              <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {stage.titrePoste || t("stagiaireSpace.stage.stageFallback")}
              </h2>
              <p className="text-sm font-medium text-muted-foreground">{entreprise.nomEntreprise}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateShort(stage.dateDebut)} → {formatDateShort(stage.dateFinPrevue)}
                </span>
                {(entreprise.ville || entreprise.pays) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {[entreprise.ville, entreprise.pays].filter(Boolean).join(", ")}
                  </span>
                )}
                {stage.modeTravail && (
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <Briefcase className="h-3.5 w-3.5" />
                    {String(stage.modeTravail).replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 space-y-2 sm:w-48">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t("stagiaireSpace.stage.progression")}</span>
              <span className="text-2xl font-bold tabular-nums text-primary">{progression} %</span>
            </div>
            <AnimatedProgressBar value={progression} />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{t("stagiaireSpace.stage.daysElapsedShort", { n: stage.joursEcoules ?? 0 })}</span>
              <span>{t("stagiaireSpace.stage.daysLeftShort", { n: stage.joursRestants ?? 0 })}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NextStepCard({ stage, status, evaluations }) {
  const { t } = useTranslation();
  let title = t("stagiaireSpace.stage.nextNone");
  let description = t("stagiaireSpace.stage.nextDescUpToDate");
  let tone = "neutral";

  if (status === "a_venir") {
    title = t("stagiaireSpace.stage.nextUpcoming");
    const j = stage.joursAvantDebut;
    const countdown =
      j == null
        ? ""
        : j === 0
          ? t("stagiaireSpace.stage.startsToday")
          : j === 1
            ? t("stagiaireSpace.stage.startsTomorrow")
            : t("stagiaireSpace.stage.startsInDays", { n: j });
    description = t("stagiaireSpace.stage.nextDescUpcoming", {
      date: formatDate(stage.dateDebut),
      countdown,
    });
    tone = "warning";
  } else if (status === "termine") {
    title = t("stagiaireSpace.stage.nextFinished");
    description = t("stagiaireSpace.stage.nextDescFinished");
    tone = "success";
  } else if (status === "en_cours") {
    const hasEval = evaluations && evaluations.length > 0;
    if (!hasEval) {
      title = t("stagiaireSpace.stage.nextFirstEval");
      description = t("stagiaireSpace.stage.nextDescFirstEval");
      tone = "warning";
    } else {
      title = t("stagiaireSpace.stage.nextContinue");
      description = t("stagiaireSpace.stage.nextDescContinue");
      tone = "primary";
    }
  }

  const toneStyles = {
    primary: "border-primary/20 bg-primary/5",
    warning: "border-warning/20 bg-warning/5",
    success: "border-success/20 bg-success/5",
    neutral: "border-border bg-card",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
      className={cn("rounded-md border p-5", toneStyles[tone] || toneStyles.neutral)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background">
          <ArrowRight className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stagiaireSpace.stage.nextStep")}</p>
          <h3 className="mt-0.5 text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function TimelineStage({ stage, status, evaluations }) {
  const { t } = useTranslation();
  const steps = useMemo(() => {
    const items = [
      {
        id: "debut",
        title: t("stagiaireSpace.stage.timelineStart"),
        date: stage.dateDebut,
        description: t("stagiaireSpace.stage.timelineStartDesc"),
        done: status !== "a_venir",
        current: status === "en_cours" && (!evaluations || evaluations.length === 0),
      },
      {
        id: "intermediaire",
        title: t("stagiaireSpace.stage.timelineMid"),
        date: null,
        description: t("stagiaireSpace.stage.timelineMidDesc"),
        done: evaluations && evaluations.length >= 1,
        current: status === "en_cours" && evaluations && evaluations.length >= 1 && evaluations.length < 2,
      },
      {
        id: "finale",
        title: t("stagiaireSpace.stage.timelineFinal"),
        date: null,
        description: t("stagiaireSpace.stage.timelineFinalDesc"),
        done: evaluations && evaluations.length >= 2,
        current: status === "en_cours" && evaluations && evaluations.length >= 2,
      },
      {
        id: "fin",
        title: t("stagiaireSpace.stage.timelineEnd"),
        date: stage.dateFinReelle || stage.dateFinPrevue,
        description: t("stagiaireSpace.stage.timelineEndDesc"),
        done: status === "termine",
        current: false,
      },
    ];
    if (status === "a_venir") {
      items[0].current = true;
      items[0].done = false;
    }
    return items;
  }, [stage, status, evaluations, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      className="rounded-md border border-border bg-card p-5"
    >
      <h3 className="mb-4 text-sm font-semibold text-foreground">{t("stagiaireSpace.stage.timelineTitle")}</h3>
      <ol className="relative space-y-0">
        {steps.map((step, index) => (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + index * 0.06, ease: "easeOut" }}
            className="relative flex gap-3 pb-6 last:pb-0"
          >
            {index < steps.length - 1 && (
              <span className={cn("absolute left-[11px] top-6 h-[calc(100%-8px)] w-0.5", step.done ? "bg-primary/40" : "bg-border")} />
            )}
            <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center">
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : step.current ? (
                <CircleDot className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/50" />
              )}
            </div>
            <div className="min-w-0 pt-0.5">
              <p className={cn("text-sm font-medium", step.current ? "text-primary" : step.done ? "text-foreground" : "text-muted-foreground")}>
                {step.title}
              </p>
              {step.date && <p className="text-xs text-muted-foreground">{formatDateShort(step.date)}</p>}
              <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
}

function ProgressStats({ stage }) {
  const { t } = useTranslation();
  const objectifs = stage.objectifs || [];
  const realises = objectifs.filter((o) => o.statut === "realise").length;
  const competences = stage.competencesAcquises || [];
  const taches = stage.taches || [];
  const tachesFaites = taches.filter((t) => t.statut === "terminee" || t.statut === "faite").length;
  const progression = resolveStageProgressPercent(stage);

  const stats = [
    { label: t("stagiaireSpace.stage.progress"), value: `${progression} %`, bar: progression },
    {
      label: t("stagiaireSpace.stage.progressObjectives"),
      value: `${realises} / ${objectifs.length || "—"}`,
      bar: objectifs.length ? (realises / objectifs.length) * 100 : 0,
      sub: objectifs.length ? null : t("stagiaireSpace.stage.noObjectivesShort"),
    },
    {
      label: t("stagiaireSpace.stage.skills"),
      value: `${competences.length}`,
      sub: null,
      bar: null,
    },
    {
      label: t("stagiaireSpace.stage.progressTasks"),
      value: `${tachesFaites} / ${taches.length || "—"}`,
      bar: taches.length ? (tachesFaites / taches.length) * 100 : 0,
      sub: taches.length ? null : t("stagiaireSpace.stage.noTasksShort"),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.16 }}
      className="rounded-md border border-border bg-card p-5"
    >
      <h3 className="mb-4 text-sm font-semibold text-foreground">{t("stagiaireSpace.stage.progress")}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((s) => (
          <div key={s.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">{s.value}</span>
            </div>
            {s.bar != null && <AnimatedProgressBar value={s.bar} className="h-1.5" />}
            {s.sub && <p className="text-[11px] text-muted-foreground">{s.sub}</p>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ObjectifsSection({ objectifs }) {
  const { t } = useTranslation();
  if (!objectifs || objectifs.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
        <Target className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <p className="mt-2 text-sm font-medium text-foreground">{t("stagiaireSpace.stage.noObjectives")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("stagiaireSpace.stage.noObjectivesHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {objectifs.map((obj, i) => {
        const done = obj.statut === "realise";
        return (
          <motion.div
            key={obj.idObjectif}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            className="rounded-md border border-border bg-card p-4"
          >
            <div className="flex items-start gap-2">
              {done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{obj.description}</p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">{done ? t("stagiaireSpace.stage.realized") : t("stagiaireSpace.stage.inProgressLabel")}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}


function TachesSection({ taches, objectifs }) {
  const { t: tr } = useTranslation();
  const list = Array.isArray(taches) ? taches : [];
  const objs = Array.isArray(objectifs) ? objectifs : [];

  if (list.length === 0 && objs.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
        <ListChecks className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <p className="mt-2 text-sm font-medium text-foreground">{tr("stagiaireSpace.stage.noTasks")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {tr("stagiaireSpace.stage.noTasksHint")}
        </p>
      </div>
    );
  }

  const byObj = new Map();
  for (const o of objs) {
    byObj.set(o.idObjectif, { objectif: o, taches: [] });
  }
  const sans = [];
  for (const t of list) {
    if (t.idObjectif && byObj.has(t.idObjectif)) {
      byObj.get(t.idObjectif).taches.push(t);
    } else {
      sans.push(t);
    }
  }

  const terminees = list.filter(
    (t) => t.statut === "terminee" || t.statut === "faite",
  ).length;

  function renderItem(t, i) {
    const done = t.statut === "terminee" || t.statut === "faite";
    return (
      <motion.li
        key={t.idTache || i}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 * i, duration: 0.25 }}
        className="flex items-start gap-3 rounded-md border border-border bg-card p-3"
      >
        {done ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        ) : (
          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={
              done
                ? "text-sm text-muted-foreground line-through"
                : "text-sm font-medium text-foreground"
            }
          >
            {t.description || tr("stagiaireSpace.stage.taskFallback")}
          </p>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
            {done ? tr("stagiaireSpace.stage.taskDone") : tr("stagiaireSpace.stage.taskTodo")}
          </p>
        </div>
      </motion.li>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {tr(terminees > 1 ? "stagiaireSpace.stage.tasksDoneCountPlural" : "stagiaireSpace.stage.tasksDoneCount", { done: terminees, total: list.length || 0 })}
      </p>
      {[...byObj.values()].map(({ objectif, taches: sub }) => (
        <div key={objectif.idObjectif} className="space-y-2">
          <div className="flex items-start gap-2">
            {objectif.statut === "realise" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            ) : (
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {objectif.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {sub.filter((t) => t.statut === "terminee" || t.statut === "faite").length}
                {tr(sub.length > 1 ? "stagiaireSpace.stage.tasksCountPlural" : "stagiaireSpace.stage.tasksCount", { n: sub.length })}
              </p>
            </div>
          </div>
          {sub.length === 0 ? (
            <p className="ml-6 text-xs text-muted-foreground">
              {tr("stagiaireSpace.stage.noTaskForObjective")}
            </p>
          ) : (
            <ul className="ml-2 space-y-2 border-l border-border pl-4">
              {sub.map(renderItem)}
            </ul>
          )}
        </div>
      ))}
      {sans.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tr("stagiaireSpace.stage.otherTasks")}
          </p>
          <ul className="space-y-2">{sans.map(renderItem)}</ul>
        </div>
      )}
    </div>
  );
}

function CompetencesSection({ competences }) {
  const { t } = useTranslation();
  if (!competences || competences.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <p className="mt-2 text-sm font-medium text-foreground">{t("stagiaireSpace.stage.noSkills")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("stagiaireSpace.stage.skillsHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {competences.map((c, i) => (
        <motion.span
          key={c.idAcquisition}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.04 * i }}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
        >
          <Trophy className="h-3 w-3" />
          {c.nomCompetence}
        </motion.span>
      ))}
    </div>
  );
}

function InfoCards({ stage }) {
  const { t } = useTranslation();
  const entreprise = stage.entreprise || { nomEntreprise: stage.nomEntreprise };
  const superviseur = stage.superviseur;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stagiaireSpace.stage.company")}</p>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {entreprise.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entreprise.logoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{entreprise.nomEntreprise}</p>
            {entreprise.secteurActivite && (
              <p className="truncate text-xs text-muted-foreground">{entreprise.secteurActivite}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stagiaireSpace.stage.supervisor")}</p>
        {superviseur ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{superviseur.nom}</p>
              {superviseur.fonction && (
                <p className="truncate text-xs text-muted-foreground">{superviseur.fonction}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("stagiaireSpace.stage.notProvided")}</p>
        )}
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stagiaireSpace.stage.period")}</p>
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">
            {formatDateShort(stage.dateDebut)} → {formatDateShort(stage.dateFinPrevue)}
          </p>
          <p className="text-xs text-muted-foreground">
            {stage.dureeTotaleJours ? `${stage.dureeTotaleJours} jours` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-md" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 rounded-md" />
        <Skeleton className="h-28 rounded-md" />
      </div>
      <Skeleton className="h-48 w-full rounded-md" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-24 rounded-md" />
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-card px-6 py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Briefcase className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{t("stagiaireSpace.stage.emptyTitle")}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("stagiaireSpace.stage.emptyDesc")}
        </p>
      </div>
      <Link
        href="/offres"
        className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("stagiaireSpace.stage.viewOffers")}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

export default function StagePage() {
  const { t } = useTranslation();
  const { data: stage, isLoading: stageLoading } = useMonStage();
  const { data: evaluations } = useEvaluations(stage?.idStage);
  const { data: coaching } = useCoaching(stage?.idStage);
  const { data: certificat } = useCertificat(stage?.idStage);
  const { data: recommandation } = useRecommandation(stage?.idStage);

  const status = getStageStatus(stage);

  return (
    <>
      <AppHeader
        title={t("stagiaireSpace.stage.title")}
        subtitle={t("stagiaireSpace.stage.subtitle")}
        refreshKeys={["monStage", "evaluations", "coaching"]}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6">
        {stageLoading && <LoadingSkeleton />}
        {!stageLoading && !stage && <EmptyState />}

        {stage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            <StageSummaryCard stage={stage} status={status} />

            <div className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <NextStepCard stage={stage} status={status} evaluations={evaluations} />
              </div>
              <div className="lg:col-span-3">
                <TimelineStage stage={stage} status={status} evaluations={evaluations} />
              </div>
            </div>

            <ProgressStats stage={stage} />
            <InfoCards stage={stage} />

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t("stagiaireSpace.stage.objectives")}</h3>
              <ObjectifsSection objectifs={stage.objectifs} />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t("stagiaireSpace.stage.tasks")}</h3>
              <TachesSection taches={stage.taches} objectifs={stage.objectifs} />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t("stagiaireSpace.stage.skills")}</h3>
              <CompetencesSection competences={stage.competencesAcquises} />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t("stagiaireSpace.stage.evaluations")}</h3>
              <EvaluationTimeline evaluations={evaluations} />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t("stagiaireSpace.stage.coach")}</h3>
              <CoachIACard sessions={coaching} />
            </section>

            {status === "en_cours" ? (
              <JournalStageSection idStage={stage.idStage} />
            ) : status === "a_venir" ? (
              <div className="rounded-md border border-border bg-card p-5 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{t("stagiaireSpace.stage.journal")}</p>
                <p className="mt-1">
                  {t("stagiaireSpace.stage.journalSoon")}
                  {stage.dateDebut
                    ? ` (${formatDateShort(stage.dateDebut)})`
                    : ""}
                  {stage.joursAvantDebut > 0
                    ? t(
                        stage.joursAvantDebut > 1
                          ? "stagiaireSpace.stage.inDaysPlural"
                          : "stagiaireSpace.stage.inDays",
                        { n: stage.joursAvantDebut },
                      )
                    : ""}
                  .
                </p>
              </div>
            ) : (
              <JournalStageSection idStage={stage.idStage} />
            )}

            {status === "termine" && (
              <div className="space-y-4">
                <CertificatCard certificat={certificat} />
                <RecommandationCard recommandation={recommandation} idStage={stage.idStage} />
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}
