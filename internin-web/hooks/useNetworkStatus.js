"use client";

// Détecte la perte / le retour de connexion Internet via les événements
// natifs du navigateur (online/offline). Évite le flash SSR.

import { useEffect, useState, useCallback } from "react";

const RECONNECTED_DISPLAY_MS = 2800;

export function useNetworkStatus() {
  // true par défaut pour éviter un flash "hors ligne" au premier rendu client
  const [isOnline, setIsOnline] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    let reconnectTimer;

    function handleOnline() {
      setIsOnline(true);
      setJustReconnected(true);
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(
        () => setJustReconnected(false),
        RECONNECTED_DISPLAY_MS,
      );
    }

    function handleOffline() {
      setIsOnline(false);
      setJustReconnected(false);
      clearTimeout(reconnectTimer);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimeout(reconnectTimer);
    };
  }, []);

  // Vérifie immédiatement l'état (bouton Réessayer)
  const checkConnection = useCallback(async () => {
    const online = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (online) {
      setIsOnline(true);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), RECONNECTED_DISPLAY_MS);
    } else {
      setIsOnline(false);
      setJustReconnected(false);
    }
    return online;
  }, []);

  return { isOnline, justReconnected, checkConnection };
}
