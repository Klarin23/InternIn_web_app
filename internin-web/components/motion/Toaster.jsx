"use client";
// Affiche la pile de toasts en haut à droite de l'écran, chacun glissant
// depuis le coin supérieur droit. À monter une seule fois, dans le layout racine.

import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";
import { useToastStore } from "@/lib/store/useToastStore";

const VARIANT_CONFIG = {
  success: {
    icon: FiCheckCircle,
    bg: "bg-card border-primary/30",
    iconColor: "text-primary",
  },
  error: {
    icon: FiAlertCircle,
    bg: "bg-card border-destructive/30",
    iconColor: "text-destructive",
  },
  info: {
    icon: FiInfo,
    bg: "bg-card border-border",
    iconColor: "text-muted-foreground",
  },
};

export default function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-100 flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const config = VARIANT_CONFIG[t.variant] || VARIANT_CONFIG.info;
          const Icon = config.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-md border ${config.bg} p-3.5 shadow-lg`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconColor}`} />
              <p className="flex-1 text-sm font-medium text-foreground">
                {t.message}
              </p>
              <button
                onClick={() => dismissToast(t.id)}
                aria-label="Fermer"
                className="text-muted-foreground hover:text-foreground"
              >
                <FiX className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
