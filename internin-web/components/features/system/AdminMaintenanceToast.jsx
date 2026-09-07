"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiTool, FiSettings } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Toast persistant réservé à l'espace administrateur.
 * Visible tant que modeMaintenance est actif ; disparaît automatiquement
 * dès que la maintenance est désactivée (poll + event).
 */
export default function AdminMaintenanceToast() {
  const [state, setState] = useState({
    active: false,
    message: null,
    checked: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/public/maintenance", {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setState({
            checked: true,
            active: !!data.active,
            message: data.message || null,
          });
        }
      } catch {
        if (!cancelled) {
          setState((s) => ({ ...s, checked: true }));
        }
      }
    }

    check();
    const interval = setInterval(check, 12_000);

    const onMaint = (e) => {
      setState({
        checked: true,
        active: true,
        message: e.detail?.message || null,
      });
    };
    // Événement optionnel émis après sauvegarde des paramètres admin
    const onMaintOff = () => {
      setState({ checked: true, active: false, message: null });
    };

    window.addEventListener("internin:maintenance", onMaint);
    window.addEventListener("internin:maintenance-off", onMaintOff);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("internin:maintenance", onMaint);
      window.removeEventListener("internin:maintenance-off", onMaintOff);
    };
  }, []);

  return (
    <AnimatePresence>
      {state.active && (
        <motion.div
          key="admin-maint-toast"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto fixed bottom-5 right-5 z-[110] w-[min(100vw-2rem,22rem)]"
          role="status"
          aria-live="polite"
        >
          <div className="overflow-hidden rounded-2xl border border-amber-500/35 bg-card shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/10">
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
                <FiTool className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Plateforme en maintenance
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {state.message ||
                    "Les espaces non administrateur sont temporairement indisponibles. Désactivez la maintenance une fois les opérations terminées."}
                </p>
                <Link
                  href="/parametres-admin"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
                >
                  <FiSettings className="h-3.5 w-3.5" aria-hidden />
                  Gérer la maintenance
                </Link>
              </div>
            </div>
            <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500/40" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
