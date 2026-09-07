"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
// Section activité récente : réutilise useNotifications (cloche AppHeader).
// Traduction via translateNotification (même pattern que NotificationsCenter).

import { FiBell } from "react-icons/fi";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { useNotifications } from "@/lib/queries/useNotifications";
import { translateNotification } from "@/lib/notifications/translateNotif";

function tempsEcoule(dateStr, t) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t("header.justNow");
  if (minutes < 60) return t("header.minutesAgo", { n: minutes });
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return t("header.hoursAgo", { n: heures });
  const jours = Math.floor(heures / 24);
  return t("header.daysAgo", { n: jours });
}

export default function RecentActivityFeed() {
  const { t } = useTranslation();
  const { data: notifications, isLoading } = useNotifications();
  const recentes = (notifications || []).slice(0, 6);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
      <h5 className="mb-4 text-sm font-semibold text-foreground">
        {t("entrepriseSpace.dashboard.recentActivity")}
      </h5>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("entrepriseSpace.dashboard.loadingShort")}
        </p>
      ) : recentes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("entrepriseSpace.dashboard.noActivity")}
        </p>
      ) : (
        <Stagger className="space-y-3" staggerDelay={0.06}>
          {recentes.map((n) => {
            const { titre, message } = translateNotification(n, t);
            const primary = titre || message || n.titre || n.message || "";
            const secondary =
              titre && message && message !== titre ? message : null;
            return (
              <StaggerItem key={n.idNotification}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FiBell className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {primary}
                    </p>
                    {secondary ? (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {secondary}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {tempsEcoule(n.dateCreation, t)}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
