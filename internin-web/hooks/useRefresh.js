"use client";

// Hook central pour toute actualisation MANUELLE de données via React Query.
// Il ne fait jamais de window.location.reload() ni d'invalidation globale :
// seules les queryKeys passées en paramètre sont re-fetchées.
//
// Statuts exposés : "idle" | "loading" | "success" | "error"
// - "loading" désactive le déclenchement d'un nouveau refresh (anti double-clic /
//   anti requêtes simultanées).
// - "success" est temporaire et revient automatiquement à "idle".
// - "error" ne vide jamais les données déjà en cache : refetchQueries conserve
//   les données précédentes de chaque query en cas d'échec.

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const SUCCESS_DISPLAY_MS = 1800;

function toKeyArray(key) {
  return Array.isArray(key) ? key : [key];
}

export function useRefresh(queryKeys = [], { onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("idle");
  const [lastUpdated, setLastUpdated] = useState(null);
  const successTimerRef = useRef(null);
  const isLoadingRef = useRef(false); // garde anti-requêtes-simultanées, insensible aux closures obsolètes

  useEffect(() => () => clearTimeout(successTimerRef.current), []);

  const refresh = useCallback(async () => {
    if (isLoadingRef.current) return; // une actualisation est déjà en cours
    isLoadingRef.current = true;
    clearTimeout(successTimerRef.current);
    setStatus("loading");

    try {
      await Promise.all(
        queryKeys.map((key) =>
          queryClient.refetchQueries({
            queryKey: toKeyArray(key),
            // "active" : ne rafraîchit que les requêtes réellement montées,
            // jamais tout le cache de l'application.
            type: "active",
          }),
        ),
      );
      setLastUpdated(Date.now());
      setStatus("success");
      onSuccess?.();
      successTimerRef.current = setTimeout(
        () => setStatus("idle"),
        SUCCESS_DISPLAY_MS,
      );
    } catch (err) {
      setStatus("error");
      onError?.(err);
    } finally {
      isLoadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, JSON.stringify(queryKeys), onSuccess, onError]);

  return { refresh, status, lastUpdated };
}
