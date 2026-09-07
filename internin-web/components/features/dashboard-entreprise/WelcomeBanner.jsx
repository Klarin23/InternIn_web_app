"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FiSun, FiMoon, FiPlus, FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function WelcomeBanner({ nomEntreprise, stats = {} }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const heure = new Date().getHours();
  const estJour = heure < 13;

  const config = estJour
    ? {
        salutation: t("entrepriseSpace.dashboard.greetingMorning"),
        Icon: FiSun,
        iconBg: "bg-accent/40",
        iconColor: "text-amber-600 dark:text-amber-400",
        gradient: "from-primary/[0.07] via-transparent to-accent/[0.06]",
      }
    : {
        salutation: t("entrepriseSpace.dashboard.greetingEvening"),
        Icon: FiMoon,
        iconBg: "bg-indigo-500/10",
        iconColor: "text-indigo-500 dark:text-indigo-300",
        gradient: "from-indigo-500/[0.08] via-transparent to-primary/[0.05]",
      };

  const Icon = config.Icon;
  const summaryParts = [
    stats.offres != null
      ? stats.offres > 1
        ? t("entrepriseSpace.dashboard.offersActiveOther", { count: stats.offres })
        : t("entrepriseSpace.dashboard.offersActiveOne", { count: stats.offres })
      : null,
    stats.candidatures != null
      ? stats.candidatures > 1
        ? t("entrepriseSpace.dashboard.applicationsCountOther", { count: stats.candidatures })
        : t("entrepriseSpace.dashboard.applicationsCountOne", { count: stats.candidatures })
      : null,
    stats.entretiens != null
      ? stats.entretiens > 1
        ? t("entrepriseSpace.dashboard.interviewsCountOther", { count: stats.entretiens })
        : t("entrepriseSpace.dashboard.interviewsCountOne", { count: stats.entretiens })
      : null,
  ].filter(Boolean);

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.4, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl border border-border bg-card bg-linear-to-br p-6 sm:p-8 ${config.gradient}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/4 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-3">
            <motion.div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${config.iconBg} ${config.iconColor}`}
              animate={
                reduce
                  ? undefined
                  : estJour
                    ? { rotate: [0, 8, 0] }
                    : { y: [0, -3, 0] }
              }
              transition={
                reduce
                  ? undefined
                  : { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
            </motion.div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {config.salutation},{" "}
                {nomEntreprise || t("entrepriseSpace.dashboard.companyFallback")}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t("entrepriseSpace.dashboard.welcomeWhatHappens")}
              </p>
            </div>
          </div>

          {summaryParts.length > 0 && (
            <p className="text-sm font-medium text-foreground/80">
              {summaryParts.join(" · ")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild className="gap-1.5 shadow-sm">
            <Link href="/offres-entreprise?nouvelle=1">
              <FiPlus className="h-4 w-4" />
              {t("entrepriseSpace.dashboard.publishOffer")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/candidats">
              {t("entrepriseSpace.dashboard.viewApplications")}
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
