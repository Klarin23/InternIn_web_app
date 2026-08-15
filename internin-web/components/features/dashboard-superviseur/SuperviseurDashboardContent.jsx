"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiUsers,
  FiBriefcase,
  FiClock,
  FiCheckCircle,
  FiClipboard,
  FiBell,
  FiChevronRight,
  FiInbox,
  FiActivity,
  FiAlertCircle,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import StatCard from "../dashboard-entreprise/StatCard";
import AlertCenter from "./AlertCenter";
import { CalendarPreview } from "./SupervisionCalendar";
import { useTableauDeBordSuperviseur } from "@/lib/queries/useSuperviseur";
import { useMonProfilEquipe } from "@/lib/queries/useEquipe";

const STYLE_GRAVITE = {
  urgent: {
    bar: "bg-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    label: "URGENT",
  },
  attention: {
    bar: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
    label: "ATTENTION",
  },
  attente: {
    bar: "bg-primary/60",
    badge: "bg-primary/10 text-primary border-primary/20",
    label: "EN ATTENTE",
  },
};

const LIBELLE_ACTION = {
  evaluation: "Évaluer",
  fin_stage: "Voir le suivi",
  journal: "Consulter",
};

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

function formatDateLong(date) {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
        <div className="h-3 w-40 rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-md border border-border bg-card p-5"
          >
            <div className="mb-4 h-11 w-11 rounded-full bg-muted" />
            <div className="mb-2 h-7 w-12 rounded bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-24 rounded-md border border-border bg-card p-5">
        <div className="mb-3 h-4 w-32 rounded bg-muted" />
        <div className="h-3 w-full rounded-full bg-muted" />
      </div>
      <div className="h-48 rounded-md border border-border bg-card p-5">
        <div className="mb-4 h-4 w-40 rounded bg-muted" />
        <div className="space-y-3">
          <div className="h-14 rounded-md bg-muted" />
          <div className="h-14 rounded-md bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-44 rounded-md border border-border bg-card p-5" />
        <div className="h-44 rounded-md border border-border bg-card p-5" />
      </div>
    </div>
  );
}

function VueEnsemble({ compteurs }) {
  const total =
    (compteurs.stagesEnCours || 0) +
    (compteurs.stagesBientotTermines || 0) +
    (compteurs.stagesTermines || 0);

  const segments = [
    {
      key: "cours",
      label: "En cours",
      value: compteurs.stagesEnCours || 0,
      className: "bg-secondary",
    },
    {
      key: "bientot",
      label: "Bientôt terminés",
      value: compteurs.stagesBientotTermines || 0,
      className: "bg-amber-500",
    },
    {
      key: "termines",
      label: "Terminés",
      value: compteurs.stagesTermines || 0,
      className: "bg-emerald-500",
    },
  ];

  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Vue d&apos;ensemble</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Répartition de vos stages suivis
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {total} stage{total > 1 ? "s" : ""} au total
        </span>
      </div>

      {total === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Aucun stage à afficher pour le moment.
        </p>
      ) : (
        <>
          <div
            className="flex h-2.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label="Répartition des stages"
          >
            {segments.map((s) =>
              s.value > 0 ? (
                <div
                  key={s.key}
                  className={`${s.className} transition-all`}
                  style={{ width: `${(s.value / total) * 100}%` }}
                  title={`${s.label} : ${s.value}`}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {segments.map((s) => (
              <li
                key={s.key}
                className="flex items-center gap-2.5 rounded-md border border-border/60 bg-muted/30 px-3 py-2.5"
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.className}`} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {s.value}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ATraiterAujourdhui({ items, reduceMotion }) {
  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            À traiter aujourd&apos;hui
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Actions prioritaires de supervision
          </p>
        </div>
        {items.length > 0 && (
          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 rounded-md border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <FiInbox className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Tout est à jour. Aucune action requise pour le moment.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => {
            const style = STYLE_GRAVITE[item.gravite] || STYLE_GRAVITE.attente;
            return (
              <li key={`${item.type}-${item.idStage}-${idx}`}>
                <Link
                  href={item.lien}
                  className="group flex items-stretch overflow-hidden rounded-md border border-border/70 bg-background transition-all duration-200 hover:-translate-x-[-3px] hover:border-border hover:bg-muted/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={`w-1 shrink-0 ${style.bar}`}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3.5 py-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${style.badge}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.titre}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary sm:inline-block">
                        {LIBELLE_ACTION[item.type] || "Voir"}
                      </span>
                      <FiChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ActivitesTimeline({ activites }) {
  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <FiActivity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Activités récentes</h3>
      </div>

      {activites.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucune activité récente.
        </p>
      ) : (
        <ul className="relative space-y-0">
          {activites.map((a, index) => (
            <motion.li
              key={a.idEvaluation}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              <div className="relative flex flex-col items-center">
                <span className="z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-primary bg-card" />
                {index < activites.length - 1 && (
                  <span className="absolute top-3 bottom-0 w-px bg-border" />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-foreground">
                  {a.prenomStagiaire} {a.nomStagiaire}
                </p>
                <p className="text-xs text-muted-foreground">
                  Évaluation de la semaine {a.numeroSemaine} soumise
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                  {formatDateShort(a.dateSoumission)}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationsImportantes({ notifications }) {
  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <FiBell className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">
          Notifications importantes
        </h3>
      </div>

      {notifications.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucune notification.
        </p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const unread = n.lu === false || n.lue === false;
            return (
              <li
                key={n.idNotification}
                className={`flex gap-3 rounded-md border px-3 py-3 transition-colors ${
                  unread
                    ? "border-primary/20 bg-primary/[0.04]"
                    : "border-border/60 bg-background"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    unread
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {unread ? (
                    <FiAlertCircle className="h-4 w-4" />
                  ) : (
                    <FiBell className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {n.titre}
                    </p>
                    {unread && (
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        aria-label="Non lue"
                      />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {n.message}
                  </p>
                  {(n.dateCreation || n.createdAt) && (
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      {formatDateShort(n.dateCreation || n.createdAt)}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function SuperviseurDashboardContent() {
  const { data: profil } = useMonProfilEquipe();
  const { data, isLoading } = useTableauDeBordSuperviseur();
  const reduceMotion = useReducedMotion();

  const aujourdHui = new Date();
  const prenom = profil?.nom?.split(" ")[0];

  const motionProps = reduceMotion
    ? {}
    : {
        variants: containerVariants,
        initial: "hidden",
        animate: "show",
      };

  const itemMotion = reduceMotion ? {} : { variants: itemVariants };

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: "Tableau de bord" }]}
        avatarLabel={profil?.nom?.slice(0, 2).toUpperCase()}
        refreshKeys={[
          "tableauDeBordSuperviseur",
          "mesStagiaires",
          "notifications",
        ]}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6">
        {isLoading && <DashboardSkeleton />}

        {data && (
          <motion.div className="space-y-8" {...motionProps}>
            {/* Header d'accueil */}
            <motion.section {...itemMotion}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {profil?.nomEntreprise
                  ? `${profil.nomEntreprise} · Espace Superviseur`
                  : "Espace Superviseur"}
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                Bonjour{prenom ? `, ${prenom}` : ""}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Voici un aperçu de vos activités de supervision.
              </p>
              <p className="mt-2 text-xs capitalize text-muted-foreground/90">
                {formatDateLong(aujourdHui)}
              </p>
            </motion.section>

            {/* KPI principaux */}
            <motion.section
              {...itemMotion}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <StatCard
                icon={FiUsers}
                value={data.compteurs.stagiaires}
                label="Stagiaires supervisés"
                color="bg-primary/10 text-primary"
                highlight
              />
              <StatCard
                icon={FiBriefcase}
                value={data.compteurs.stagesEnCours}
                label="Stages en cours"
                color="bg-secondary/10 text-secondary"
                highlight
              />
              <StatCard
                icon={FiClock}
                value={data.compteurs.stagesBientotTermines}
                label="Bientôt terminés"
                sublabel="dans les 30 prochains jours"
                color="bg-amber-500/15 text-amber-700 dark:text-amber-400"
              />
              <StatCard
                icon={FiCheckCircle}
                value={data.compteurs.stagesTermines}
                label="Stages terminés"
                color="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              />
            </motion.section>

            {/* KPI secondaires */}
            <motion.section
              {...itemMotion}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <StatCard
                icon={FiClipboard}
                value={data.compteurs.evaluationsAEffectuer}
                label="Évaluations à effectuer"
                sublabel="stages sans évaluation récente"
                color="bg-destructive/10 text-destructive"
              />
              <StatCard
                icon={FiBell}
                value={data.notificationsNonLues}
                label="Notifications non lues"
                color="bg-primary/10 text-primary"
              />
            </motion.section>

            {/* Vue d'ensemble */}
            <motion.section {...itemMotion}>
              <VueEnsemble compteurs={data.compteurs} />
            </motion.section>

            {/* Centre d'alertes + aperçu calendrier */}
            <motion.section
              {...itemMotion}
              id="alertes"
              className="grid grid-cols-1 gap-4 xl:grid-cols-5"
            >
              <div className="xl:col-span-3">
                <AlertCenter items={data.aTraiterAujourdhui || []} />
              </div>
              <div className="xl:col-span-2">
                <CalendarPreview limit={5} />
              </div>
            </motion.section>

            {/* Activités + notifications */}
            <motion.section
              {...itemMotion}
              className="grid grid-cols-1 gap-4 lg:grid-cols-2"
            >
              <ActivitesTimeline activites={data.activitesRecentes || []} />
              <NotificationsImportantes
                notifications={data.notifications || []}
              />
            </motion.section>
          </motion.div>
        )}
      </div>
    </>
  );
}
