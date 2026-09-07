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
  // Garde anti-requêtes simultanées + clés toujours à jour sans deps complexes
  const isLoadingRef = useRef(false);
  const queryKeysRef = useRef(queryKeys);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Mise à jour des refs après le rendu (pas pendant) pour respecter
  // react-hooks/refs tout en gardant les valeurs à jour dans `refresh`.
  useEffect(() => {
    queryKeysRef.current = queryKeys;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  useEffect(() => () => clearTimeout(successTimerRef.current), []);

  const refresh = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    clearTimeout(successTimerRef.current);
    setStatus("loading");

    try {
      const keys = queryKeysRef.current || [];
      await Promise.all(
        keys.map((key) =>
          queryClient.refetchQueries({
            queryKey: toKeyArray(key),
            type: "active",
          }),
        ),
      );
      setLastUpdated(Date.now());
      setStatus("success");
      onSuccessRef.current?.();
      successTimerRef.current = setTimeout(
        () => setStatus("idle"),
        SUCCESS_DISPLAY_MS,
      );
    } catch (err) {
      setStatus("error");
      onErrorRef.current?.(err);
    } finally {
      isLoadingRef.current = false;
    }
  }, [queryClient]);

  return { refresh, status, lastUpdated };
}
