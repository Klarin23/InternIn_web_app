"use client";

// Toast global d'état de connexion — monté une seule fois dans app/layout.js.
// Non bloquant : n'interrompt pas la saisie des formulaires.

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff, Wifi, Loader2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function ConnectionStatus() {
  const { isOnline, justReconnected, checkConnection } = useNetworkStatus();
  const queryClient = useQueryClient();
  const wasOffline = useRef(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      queryClient.refetchQueries({ type: "active" });
    }
  }, [isOnline, queryClient]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      if (checkConnection) await checkConnection();
    } finally {
      setTimeout(() => setIsRetrying(false), 600);
    }
  }, [checkConnection]);

  const showOffline = !isOnline;
  const showReconnected = isOnline && justReconnected;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[120] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:bottom-6 sm:right-6"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {showOffline && (
          <motion.div
            key="offline"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            role="status"
            className="pointer-events-auto w-[min(100%,22rem)] rounded-xl border border-border bg-white p-4 shadow-lg dark:border-border dark:bg-card"
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <WifiOff className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Connexion interrompue
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Votre connexion Internet semble avoir été interrompue.
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-teal-700 dark:text-teal-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Tentative de reconnexion…</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`}
                  />
                  Réessayer
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showReconnected && (
          <motion.div
            key="online"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            role="status"
            className="pointer-events-auto w-[min(100%,22rem)] rounded-xl border border-teal-500/25 bg-white p-4 shadow-lg dark:bg-card"
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-400">
                <Wifi className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Connexion rétablie
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Vous êtes de nouveau en ligne.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
