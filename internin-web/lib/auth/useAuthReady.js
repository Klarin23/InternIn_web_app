"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * Attend que le store auth soit réhydraté depuis localStorage.
 * Empêche les redirections prématurées vers /connexion au rechargement (F5).
 */
export function useAuthReady() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function markReady() {
      if (cancelled) return;
      useAuthStore.getState().setHasHydrated(true);
      setReady(true);
    }

    // Déjà hydraté ?
    if (useAuthStore.persist.hasHydrated()) {
      markReady();
      return () => {
        cancelled = true;
      };
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      markReady();
    });

    // Force rehydrate si le middleware ne l'a pas encore fait
    try {
      const p = useAuthStore.persist.rehydrate?.();
      if (p && typeof p.then === "function") {
        p.then(() => markReady()).catch(() => markReady());
      }
    } catch {
      // ignore
    }

    // Filet de sécurité : si rien n'a déclenché l'hydratation sous 500ms
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState()._hasHydrated) {
        markReady();
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if (typeof unsub === "function") unsub();
    };
  }, []);

  return ready || hasHydrated;
}
