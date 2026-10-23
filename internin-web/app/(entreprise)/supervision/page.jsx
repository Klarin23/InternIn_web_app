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
import { useTranslation } from "@/lib/i18n/useTranslation";

const CARDS = [
  {
    href: "/supervision/mes-stagiaires",
    icon: FiUsers,
    titleKey: "internsTitle",
    descriptionKey: "internsDescription",
  },
  {
    href: "/supervision/evaluations",
    icon: FiClipboard,
    titleKey: "evaluationsTitle",
    descriptionKey: "evaluationsDescription",
  },
  {
    href: "/supervision/calendrier",
    icon: FiCalendar,
    titleKey: "calendarTitle",
    descriptionKey: "calendarDescription",
  },
  {
    href: "/suivi-stagiaires",
    icon: FiBarChart2,
    titleKey: "trackingTitle",
    descriptionKey: "trackingDescription",
  },
];

export default function SupervisionHubPage() {
  const { t } = useTranslation();
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
          { label: t("roles.companySpace"), href: "/tableau-de-bord" },
          { label: t("entrepriseSpace.supervision.title") },
        ]}
        subtitle={t("entrepriseSpace.supervision.subtitle")}
        refreshKeys={["mesStagiaires", "evaluationsSuperviseur"]}
      />
      <div className="px-4 py-6 sm:px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("entrepriseSpace.supervision.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("entrepriseSpace.supervision.description")}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase text-muted-foreground">
                {t("entrepriseSpace.supervision.interns")}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{nbStagiaires}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase text-muted-foreground">
                {t("entrepriseSpace.supervision.evaluationsToHandle")}
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
                      {t(`entrepriseSpace.supervision.${card.titleKey}`)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t(`entrepriseSpace.supervision.${card.descriptionKey}`)}
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
