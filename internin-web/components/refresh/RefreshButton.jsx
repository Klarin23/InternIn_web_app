"use client";

// Bouton "Actualiser" centralisé — utilisé par AppHeader sur toutes les
// pages qui déclarent des `refreshKeys`. Discret, compact, cohérent avec le
// design system existant (couleurs primary/teal + border/radius du thème).

import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Check } from "lucide-react";
import { useRefresh } from "@/hooks/useRefresh";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";
import LastUpdated from "./LastUpdated";

export default function RefreshButton({
  queryKeys = [],
  showLastUpdated = true,
  successMessage = "Données mises à jour",
  errorMessage = "Impossible d'actualiser les données.",
  className,
}) {
  const { refresh, status, lastUpdated } = useRefresh(queryKeys, {
    onSuccess: () => toast.success(successMessage),
    onError: () => toast.error(errorMessage),
  });

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  if (queryKeys.length === 0) return null;

  return (
    <div className={cn("flex flex-col items-start gap-0.5", className)}>
      <button
        type="button"
        onClick={refresh}
        disabled={isLoading}
        aria-label="Actualiser les données"
        aria-busy={isLoading}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-70",
          isSuccess && "border-primary/30 bg-primary/5 text-primary",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isSuccess ? (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Mis à jour
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              {isLoading ? "Actualisation…" : "Actualiser"}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {showLastUpdated && <LastUpdated timestamp={lastUpdated} />}

      {status === "error" && (
        <div className="flex items-center gap-2 text-[11px] text-destructive">
          <span>Réessayez dans quelques instants.</span>
          <button
            type="button"
            onClick={refresh}
            className="font-medium underline underline-offset-2 hover:text-destructive/80"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
