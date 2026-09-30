"use client";

import Link from "next/link";
import { FiClock } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function AlertesConventionsCard({ alertes }) {
  const { t } = useTranslation();
  const list = Array.isArray(alertes) ? alertes : [];

  if (list.length === 0) {
    return (
      <div className="flex h-full items-center rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5">
        <p className="text-sm text-muted-foreground">
          {t("universiteSpace.dashboard.alertsEmpty")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-background/50">
      <ul className="divide-y divide-border/60">
        {list.map((a) => (
          <li key={a.idConvention}>
            <Link
              href="/conventions"
              className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {t("universiteSpace.dashboard.alertConvention")}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <FiClock className="h-3 w-3 shrink-0" />
                  {a.joursAttente === 0
                    ? t("universiteSpace.dashboard.alertToday")
                    : a.joursAttente === 1
                      ? t("universiteSpace.dashboard.alertDayOne")
                      : t("universiteSpace.dashboard.alertDayOther", {
                          count: a.joursAttente,
                        })}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-300">
                {t("universiteSpace.dashboard.todoReview")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
