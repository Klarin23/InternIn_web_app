"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiUsers,
  FiClipboard,
  FiCalendar,
  FiBarChart2,
  FiArrowRight,
  FiAlertTriangle,
  FiTarget,
  FiBookOpen,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { useMesStagiaires, useEvaluationsSuperviseur } from "@/lib/queries/useSuperviseur";

const CARDS = [
  {
    href: "/supervision/mes-stagiaires",
    icon: FiUsers,
    title: "Mes stagiaires",
    description: "Suivre et comparer la progression de vos stagiaires",
  },
  {
    href: "/supervision/evaluations",
    icon: FiClipboard,
    title: "Évaluations",
    description: "Évaluer et consulter l'historique des évaluations",
  },
  {
    href: "/supervision/calendrier",
    icon: FiCalendar,
    title: "Calendrier",
    description: "Échéances, évaluations et fin de stages",
  },
  {
    href: "/suivi-stagiaires",
    icon: FiBarChart2,
    title: "Suivi détaillé",
    description: "Vue panel de suivi des stages accueillis",
  },
];

export default function SupervisionHubPage() {
  const reduceMotion = useReducedMotion();
  const { data: stagiaires } = useMesStagiaires();
  const { data: evaluations } = useEvaluationsSuperviseur();

  const nbStagiaires = stagiaires?.length ?? 0;
  const aTraiter =
    evaluations?.filter(
      (e) =>
        e.statutAffichage === "a_effectuer" || e.statutAffichage === "en_retard",
    ).length ?? 0;

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: "Entreprise", href: "/tableau-de-bord" },
          { label: "Supervision" },
        ]}
        subtitle="Gérez et accompagnez vos stagiaires"
        refreshKeys={["mesStagiaires", "evaluationsSuperviseur"]}
      />
      <div className="px-4 py-6 sm:px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Supervision
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accédez aux outils d&apos;encadrement de vos stagiaires — les mêmes
            fonctionnalités que l&apos;espace Superviseur, dans le contexte de
            votre entreprise.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase text-muted-foreground">
                Stagiaires
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{nbStagiaires}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase text-muted-foreground">
                Évaluations à traiter
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600">
                {aTraiter}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {CARDS.map((card, i) => (
              <motion.div
                key={card.href}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
              >
                <Link
                  href={card.href}
                  className="group flex items-start gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground group-hover:text-primary">
                      {card.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                  <FiArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}
