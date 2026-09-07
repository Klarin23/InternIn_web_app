"use client";

import { useEffect, useState } from "react";
import { FiTool } from "react-icons/fi";
import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * Écran plein page affiché pendant la maintenance (icône outil + message).
 * Réutilisé par MaintenanceGate et les pages hors layout (ex. tableau de bord).
 */
export function MaintenanceScreen({ message }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
        <FiTool className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="text-xl font-bold text-foreground">Maintenance en cours</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {message ||
          "InternIn est actuellement en maintenance. Nous serons de retour très bientôt."}
      </p>
    </div>
  );
}

/**
 * Affiche un écran plein pour les non-admins si la plateforme est en maintenance.
 * Les administrateurs passent toujours (sauf si admins_peuvent_acceder = false côté API).
 */
export default function MaintenanceGate({ children }) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.typeUtilisateur === "administrateur";
  const [state, setState] = useState({
    checked: false,
    active: false,
    message: null,
  });

  useEffect(() => {
    // Les admins passent sans appel API — pas de setState synchrone ici.
    if (isAdmin) return;

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
          setState({ checked: true, active: false, message: null });
        }
      }
    }

    check();
    const onMaint = (e) => {
      setState({
        checked: true,
        active: true,
        message: e.detail?.message || null,
      });
    };
    window.addEventListener("internin:maintenance", onMaint);
    const interval = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("internin:maintenance", onMaint);
    };
  }, [isAdmin]);

  // Admin : toujours laisser passer, sans attendre le check.
  if (isAdmin) return children;

  if (!state.checked) return children;

  if (state.active) {
    return <MaintenanceScreen message={state.message} />;
  }

  return children;
}
