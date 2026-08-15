"use client";

// Affiche "Mis à jour il y a Ns" et se met à jour à intervalle raisonnable
// (5s) plutôt qu'à chaque milliseconde — léger et peu coûteux.

import { useEffect, useState } from "react";

function formatRelative(timestamp, now) {
  if (!timestamp) return null;
  const diffSec = Math.max(0, Math.round((now - timestamp) / 1000));

  if (diffSec < 5) return "à l'instant";
  if (diffSec < 60) return `il y a ${diffSec} s`;

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;

  const diffH = Math.round(diffMin / 60);
  return `il y a ${diffH} h`;
}

export default function LastUpdated({ timestamp, prefix = "Mis à jour", className }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timestamp) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const label = formatRelative(timestamp, now);
  if (!label) return null;

  return (
    <span className={className ?? "text-[11px] text-muted-foreground"}>
      {prefix} {label}
    </span>
  );
}
