"use client";

import Link from "next/link";
import { FiClock, FiCheckCircle, FiXCircle, FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function VerificationBanner({ statut }) {
  const { t } = useTranslation();

  const CONFIG = {
    en_attente: {
      icon: FiClock,
      title: t("entrepriseSpace.dashboard.verifyPendingTitle"),
      message: t("entrepriseSpace.dashboard.verifyPendingDesc"),
      className: "border-amber-500/25 bg-amber-500/5",
      iconClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      titleClass: "text-amber-900 dark:text-amber-200",
    },
    verifiee: {
      icon: FiCheckCircle,
      title: t("entrepriseSpace.dashboard.verifyOkTitle"),
      message: t("entrepriseSpace.dashboard.verifyOkDesc"),
      className: "border-success/25 bg-success/5",
      iconClass: "bg-success/15 text-success",
      titleClass: "text-foreground",
    },
    rejetee: {
      icon: FiXCircle,
      title: t("entrepriseSpace.dashboard.verifyRejectedTitle"),
      message: t("entrepriseSpace.dashboard.verifyRejectedDesc"),
      className: "border-destructive/25 bg-destructive/5",
      iconClass: "bg-destructive/15 text-destructive",
      titleClass: "text-destructive",
    },
  };

  const config = CONFIG[statut] || CONFIG.en_attente;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        config.className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            config.iconClass,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className={cn("text-sm font-semibold", config.titleClass)}>
            {config.title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {config.message}
          </p>
        </div>
      </div>
      {(statut === "en_attente" || statut === "rejetee") && (
        <Button asChild variant="outline" size="sm" className="shrink-0 gap-1">
          <Link href="/parametres-entreprise">
            {t("entrepriseSpace.dashboard.viewMyProfile")}
            <FiArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}
