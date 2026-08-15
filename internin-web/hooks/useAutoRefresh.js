"use client";

// Actualisation automatique périodique, centralisée et à fréquence adaptée
// au type de donnée — au lieu de fixer refetchInterval individuellement dans
// chaque hook lib/queries/*.js.
//
// Ne rafraîchit que les queries "active" (réellement montées à l'écran), et
// se nettoie proprement au démontage du composant. Le retour à l'onglet et
// la reconnexion réseau sont déjà couverts nativement par React Query
// (refetchOnWindowFocus / refetchOnReconnect, activés par défaut) : ce hook
// ne gère que le polling périodique en tâche de fond.

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Paliers de fréquence du cahier des charges. Les données statiques
// (profil, paramètres, référentiels...) ne doivent jamais être passées à ce
// hook — pas de palier "static" par design.
export const AUTO_REFRESH_INTERVALS = {
  dynamic: 30 * 1000, // notifications, candidatures, entretiens, messages, alertes
  medium: 90 * 1000, // statistiques, recommandations, activité récente, progression
};

function toKeyArray(key) {
  return Array.isArray(key) ? key : [key];
}

export function useAutoRefresh(queryKeys = [], intervalMs = AUTO_REFRESH_INTERVALS.medium) {
  const queryClient = useQueryClient();
  const keysRef = useRef(queryKeys);
  keysRef.current = queryKeys;

  useEffect(() => {
    if (!intervalMs || keysRef.current.length === 0) return;

    const id = setInterval(() => {
      // Si l'onglet est masqué, on laisse React Query s'en charger au retour
      // de focus plutôt que de consommer du réseau en arrière-plan.
      if (document.visibilityState !== "visible") return;

      keysRef.current.forEach((key) => {
        queryClient.refetchQueries({ queryKey: toKeyArray(key), type: "active" });
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [queryClient, intervalMs]);
}
