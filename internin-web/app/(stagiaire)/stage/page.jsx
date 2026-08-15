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
} from "lucide-react";

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
  if (stage.statut === "termine") return "termine";
  const now = new Date();
  const debut = new Date(stage.dateDebut);
  if (now < debut) return "a_venir";
  return "en_cours";
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
  const config = {
    en_cours: { label: "Stage en cours", className: "bg-primary/10 text-primary border-primary/20" },
    a_venir: { label: "Stage à venir", className: "bg-warning/10 text-warning border-warning/20" },
    termine: { label: "Stage terminé", className: "bg-success/10 text-success border-success/20" },
    none: { label: "Aucun stage", className: "bg-muted text-muted-foreground border-border" },
  };
  const c = config[status] || config.none;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", c.className)}>
      {c.label}
    </span>
  );
}

function StageSummaryCard({ stage, status }) {
  const progression = stage.progressionPourcentage ?? stage.progressionCalculee ?? 0;
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
                {stage.titrePoste || "Stage"}
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
              <span className="text-xs font-medium text-muted-foreground">Progression</span>
              <span className="text-2xl font-bold tabular-nums text-primary">{progression} %</span>
            </div>
            <AnimatedProgressBar value={progression} />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{stage.joursEcoules ?? 0} j écoulés</span>
              <span>{stage.joursRestants ?? 0} j restants</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NextStepCard({ stage, status, evaluations }) {
  let title = "Aucune action requise";
  let description = "Votre stage est actuellement à jour.";
  let tone = "neutral";

  if (status === "a_venir") {
    title = "Préparation du stage";
    description = `Votre stage commence le ${formatDate(stage.dateDebut)}. Préparez vos documents et familiarisez-vous avec l'entreprise.`;
    tone = "warning";
  } else if (status === "termine") {
    title = "Stage terminé";
    description = "Consultez votre certificat et demandez une recommandation si besoin.";
    tone = "success";
  } else if (status === "en_cours") {
    const hasEval = evaluations && evaluations.length > 0;
    if (!hasEval) {
      title = "Première évaluation";
      description = "Aucune évaluation n'a encore été soumise. Votre superviseur pourra bientôt évaluer votre progression.";
      tone = "warning";
    } else {
      title = "Continuer le suivi";
      description = "Poursuivez vos objectifs et tenez à jour votre journal de stage.";
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prochaine étape</p>
          <h3 className="mt-0.5 text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function TimelineStage({ stage, status, evaluations }) {
  const steps = useMemo(() => {
    const items = [
      {
        id: "debut",
        title: "Stage commencé",
        date: stage.dateDebut,
        description: "Début de votre expérience professionnelle",
        done: status !== "a_venir",
        current: status === "en_cours" && (!evaluations || evaluations.length === 0),
      },
      {
        id: "intermediaire",
        title: "Évaluation intermédiaire",
        date: null,
        description: "Bilan à mi-parcours",
        done: evaluations && evaluations.length >= 1,
        current: status === "en_cours" && evaluations && evaluations.length >= 1 && evaluations.length < 2,
      },
      {
        id: "finale",
        title: "Évaluation finale",
        date: null,
        description: "Bilan de fin de stage",
        done: evaluations && evaluations.length >= 2,
        current: status === "en_cours" && evaluations && evaluations.length >= 2,
      },
      {
        id: "fin",
        title: "Stage terminé",
        date: stage.dateFinReelle || stage.dateFinPrevue,
        description: "Clôture et certificat",
        done: status === "termine",
        current: false,
      },
    ];
    if (status === "a_venir") {
      items[0].current = true;
      items[0].done = false;
    }
    return items;
  }, [stage, status, evaluations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      className="rounded-md border border-border bg-card p-5"
    >
      <h3 className="mb-4 text-sm font-semibold text-foreground">Timeline du stage</h3>
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
  const objectifs = stage.objectifs || [];
  const realises = objectifs.filter((o) => o.statut === "realise").length;
  const competences = stage.competencesAcquises || [];
  const taches = stage.taches || [];
  const tachesFaites = taches.filter((t) => t.statut === "terminee" || t.statut === "faite").length;
  const progression = stage.progressionPourcentage ?? stage.progressionCalculee ?? 0;

  const stats = [
    { label: "Progression générale", value: `${progression} %`, bar: progression },
    { label: "Objectifs", value: `${realises} / ${objectifs.length || "—"}`, bar: objectifs.length ? (realises / objectifs.length) * 100 : 0, sub: objectifs.length ? null : "Aucun objectif défini" },
    { label: "Compétences", value: `${competences.length}`, sub: "acquises", bar: null },
    { label: "Tâches", value: `${tachesFaites} / ${taches.length || "—"}`, bar: taches.length ? (tachesFaites / taches.length) * 100 : 0, sub: taches.length ? null : "Aucune tâche" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.16 }}
      className="rounded-md border border-border bg-card p-5"
    >
      <h3 className="mb-4 text-sm font-semibold text-foreground">Ma progression</h3>
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
  if (!objectifs || objectifs.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
        <Target className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <p className="mt-2 text-sm font-medium text-foreground">Aucun objectif défini</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Les objectifs de votre stage apparaîtront ici une fois définis avec votre superviseur.
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
                <p className="mt-1 text-xs capitalize text-muted-foreground">{done ? "Réalisé" : "En cours"}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function CompetencesSection({ competences }) {
  if (!competences || competences.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <p className="mt-2 text-sm font-medium text-foreground">Aucune compétence enregistrée</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Les compétences acquises pendant le stage seront listées ici.
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
  const entreprise = stage.entreprise || { nomEntreprise: stage.nomEntreprise };
  const superviseur = stage.superviseur;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Entreprise</p>
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
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Superviseur</p>
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
          <p className="text-sm text-muted-foreground">Non renseigné</p>
        )}
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Période</p>
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
        <p className="text-sm font-semibold text-foreground">Aucun stage en cours</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Vous n&apos;avez actuellement aucun stage actif. Explorez les offres pour démarrer votre expérience professionnelle.
        </p>
      </div>
      <a
        href="/offres"
        className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Voir les offres
        <ChevronRight className="h-4 w-4" />
      </a>
    </motion.div>
  );
}

export default function StagePage() {
  const { data: stage, isLoading: stageLoading } = useMonStage();
  const { data: evaluations } = useEvaluations(stage?.idStage);
  const { data: coaching } = useCoaching(stage?.idStage);
  const { data: certificat } = useCertificat(stage?.idStage);
  const { data: recommandation } = useRecommandation(stage?.idStage);

  const status = getStageStatus(stage);

  return (
    <>
      <AppHeader
        title="Mon stage"
        subtitle="Suivez votre progression et les différentes étapes de votre expérience professionnelle."
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
              <h3 className="mb-3 text-sm font-semibold text-foreground">Mes objectifs</h3>
              <ObjectifsSection objectifs={stage.objectifs} />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Compétences développées</h3>
              <CompetencesSection competences={stage.competencesAcquises} />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Mes évaluations</h3>
              <EvaluationTimeline evaluations={evaluations} />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Coach IA</h3>
              <CoachIACard sessions={coaching} />
            </section>

            <JournalStageSection idStage={stage.idStage} />

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
