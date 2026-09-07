"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiUser,
  FiTrendingUp,
  FiBookOpen,
  FiStar,
} from "react-icons/fi";
import { useSupervisionContext } from "@/lib/supervision/SupervisionContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function DetailStagiaireTabs({ idStage }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { evaluationsPath: ctxEvalPath } = useSupervisionContext();
  const reduceMotion = useReducedMotion();

  const basePath = pathname?.startsWith("/supervision/mes-stagiaires")
    ? "/supervision/mes-stagiaires"
    : pathname?.includes("/mes-stagiaires")
      ? "/mes-stagiaires"
      : "/mes-stagiaires";
  const evaluationsPath = pathname?.startsWith("/supervision/")
    ? "/supervision/evaluations"
    : ctxEvalPath;

  const root = `${basePath}/${idStage}`;
  const tabs = [
    { href: root, label: t("mesStagiaires.tabs.details"), icon: FiUser, match: (p) => p === root },
    {
      href: `${root}/progression`,
      label: t("mesStagiaires.tabs.progression"),
      icon: FiTrendingUp,
      match: (p) => p?.includes("/progression"),
    },
    {
      href: `${root}/journal`,
      label: t("mesStagiaires.tabs.journal"),
      icon: FiBookOpen,
      match: (p) => p?.includes("/journal"),
    },
  ];

  // Évaluation uniquement si le contexte expose un chemin
  if (evaluationsPath) {
    tabs.push({
      href: `${evaluationsPath}/${idStage}`,
      label: t("mesStagiaires.tabs.evaluation"),
      icon: FiStar,
      match: (p) => p?.includes("/evaluations"),
    });
  }

  return (
    <nav
      className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border/70 bg-muted/30 p-1"
      aria-label={t("mesStagiaires.tabs.aria")}
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={reduceMotion ? undefined : "detail-stagiaire-tab"}
                className="absolute inset-0 rounded-lg bg-card shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="relative size-4" aria-hidden />
            <span className="relative">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
