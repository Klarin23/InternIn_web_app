"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { toneOf } from "./adminDashTheme";

export default function ActionsPrioritaires({ stats }) {
  const { t } = useTranslation();

  const items = [
    {
      key: "offres",
      count: stats.offresEnAttente ?? 0,
      title: t("adminDashboard.actionOffersTitle"),
      description: t("adminDashboard.actionOffersDesc"),
      href: "/verifications/offres-finales",
      action: t("adminDashboard.actionOffersBtn"),
      tone: "amber",
    },
    {
      key: "entreprises",
      count: stats.entitesNonVerifiees?.entreprises ?? 0,
      title: t("adminDashboard.actionCompaniesTitle"),
      description: t("adminDashboard.actionCompaniesDesc"),
      href: "/gestion-entreprises",
      action: t("adminDashboard.actionCompaniesBtn"),
      tone: "purple",
    },
    {
      key: "universites",
      count: stats.entitesNonVerifiees?.universites ?? 0,
      title: t("adminDashboard.actionUniversitiesTitle"),
      description: t("adminDashboard.actionUniversitiesDesc"),
      href: "/gestion-universites",
      action: t("adminDashboard.actionUniversitiesBtn"),
      tone: "indigo",
    },
  ].filter((i) => i.count > 0);

  if (items.length === 0) {
    return (
      <section
        className={cn(
          "rounded-xl border px-5 py-5 shadow-sm",
          toneOf("green").soft,
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("adminDashboard.attentionTitle")}
        </p>
        <p className="mt-3 text-sm font-medium text-foreground">
          {t("adminDashboard.allCaughtUp")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("adminDashboard.noPendingActions")}
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/80 bg-amber-500/[0.04] px-5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("adminDashboard.attentionTitle")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t(
            items.length > 1
              ? "adminDashboard.itemsRequiringPlural"
              : "adminDashboard.itemsRequiring",
            { n: items.length },
          )}
        </p>
      </div>
      <ul className="divide-y divide-border/80">
        {items.map((item) => {
          const tone = toneOf(item.tone);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md px-1.5 text-xs font-bold tabular-nums",
                        tone.icon,
                      )}
                    >
                      {item.count}
                    </span>
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-0.5 pl-8 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 text-xs font-semibold",
                    tone.text,
                  )}
                >
                  {item.action}
                  <FiArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
