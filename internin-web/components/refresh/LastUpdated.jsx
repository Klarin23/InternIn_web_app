"use client";

// Affiche "Mis à jour il y a Ns" et se met à jour à intervalle raisonnable
// (5s) plutôt qu'à chaque milliseconde — léger et peu coûteux.

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

function formatRelative(timestamp, now, t) {
  if (!timestamp) return null;
  const diffSec = Math.max(0, Math.round((now - timestamp) / 1000));

  if (diffSec < 5) return t("auditUi.refresh.justNow");
  if (diffSec < 60) return t("auditUi.refresh.secondsAgo", { n: diffSec });

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return t("auditUi.refresh.minutesAgo", { n: diffMin });

  const diffH = Math.round(diffMin / 60);
  return t("auditUi.refresh.hoursAgo", { n: diffH });
}

export default function LastUpdated({ timestamp, prefix, className }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timestamp) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const label = formatRelative(timestamp, now, t);
  if (!label) return null;

  return (
    <span className={className ?? "text-[11px] text-muted-foreground"}>
      {prefix || t("auditUi.refresh.lastUpdated")} {label}
    </span>
  );
}
