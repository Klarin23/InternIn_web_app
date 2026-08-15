"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiLoader,
  FiInbox,
  FiActivity,
  FiUserPlus,
  FiRefreshCw,
  FiX,
  FiShield,
  FiPlay,
  FiPause,
  FiUserCheck,
  FiUserMinus,
  FiSettings,
  FiClock,
  FiCalendar,
} from "react-icons/fi";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivitesEquipe } from "@/lib/queries/useEquipe";

const ACTION_LABELS = {
  invitation_envoyee: "Invitation envoyée",
  invitation_renvoyee: "Invitation renvoyée",
  invitation_annulee: "Invitation annulée",
  permissions_modifiees: "Rôle / permissions modifiés",
  membre_active: "Membre activé",
  membre_desactive: "Membre désactivé",
  stagiaire_affecte: "Stagiaire affecté à un superviseur",
  affectation_retiree: "Affectation retirée",
  parametres_equipe_modifies: "Paramètres de l'équipe modifiés",
};

const ACTION_ICONS = {
  invitation_envoyee: FiUserPlus,
  invitation_renvoyee: FiRefreshCw,
  invitation_annulee: FiX,
  permissions_modifiees: FiShield,
  membre_active: FiPlay,
  membre_desactive: FiPause,
  stagiaire_affecte: FiUserCheck,
  affectation_retiree: FiUserMinus,
  parametres_equipe_modifies: FiSettings,
};

const ACTION_COLORS = {
  invitation_envoyee: "bg-primary/10 text-primary",
  invitation_renvoyee: "bg-blue-500/10 text-blue-600",
  invitation_annulee: "bg-destructive/10 text-destructive",
  permissions_modifiees: "bg-violet-500/10 text-violet-600",
  membre_active: "bg-emerald-500/10 text-emerald-600",
  membre_desactive: "bg-amber-500/10 text-amber-600",
  stagiaire_affecte: "bg-teal-500/10 text-teal-600",
  affectation_retiree: "bg-slate-500/10 text-slate-600",
  parametres_equipe_modifies: "bg-indigo-500/10 text-indigo-600",
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: i * 0.04, ease: "easeOut" },
  }),
};

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatRelative(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD} j`;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ActivitePanel() {
  const { data: activites, isLoading } = useActivitesEquipe();
  const [filtreType, setFiltreType] = useState("tous");
  const [filtrePeriode, setFiltrePeriode] = useState("tous");

  const liste = useMemo(() => {
    let items = activites || [];
    if (filtreType !== "tous") {
      items = items.filter((a) => a.action === filtreType);
    }
    if (filtrePeriode !== "tous") {
      const now = new Date();
      items = items.filter((a) => {
        const d = new Date(a.dateAction);
        if (filtrePeriode === "aujourdhui") return isSameDay(d, now);
        if (filtrePeriode === "semaine") return d >= startOfWeek(now);
        return true;
      });
    }
    return items;
  }, [activites, filtreType, filtrePeriode]);

  const stats = useMemo(() => {
    const all = activites || [];
    const now = new Date();
    const weekStart = startOfWeek(now);
    return {
      total: all.length,
      aujourdhui: all.filter((a) => isSameDay(new Date(a.dateAction), now))
        .length,
      semaine: all.filter((a) => new Date(a.dateAction) >= weekStart).length,
    };
  }, [activites]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-md border border-border p-4">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activites || activites.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <FiActivity className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold text-foreground">
          Aucune activité récente
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Les actions effectuées par les membres de votre équipe apparaîtront
          ici.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-foreground">
          Activité de l&apos;équipe
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Consultez les actions récentes effectuées par les membres de votre
          équipe.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="rounded-md border border-border bg-card p-4 shadow-sm"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#14b8a6] text-white">
            <FiActivity className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold tabular-nums text-foreground">
            {stats.total}
          </div>
          <div className="text-xs text-muted-foreground">Total activités</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-md border border-border bg-card p-4 shadow-sm"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
            <FiClock className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold tabular-nums text-foreground">
            {stats.aujourdhui}
          </div>
          <div className="text-xs text-muted-foreground">Aujourd&apos;hui</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-md border border-border bg-card p-4 shadow-sm"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-white">
            <FiCalendar className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold tabular-nums text-foreground">
            {stats.semaine}
          </div>
          <div className="text-xs text-muted-foreground">Cette semaine</div>
        </motion.div>
      </div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2"
      >
        <Select value={filtrePeriode} onValueChange={setFiltrePeriode}>
          <SelectTrigger className="h-10 w-full rounded-md sm:w-[160px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Toutes les périodes</SelectItem>
            <SelectItem value="aujourdhui">Aujourd&apos;hui</SelectItem>
            <SelectItem value="semaine">Cette semaine</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtreType} onValueChange={setFiltreType}>
          <SelectTrigger className="h-10 w-full rounded-md sm:w-[220px]">
            <SelectValue placeholder="Type d'activité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les types</SelectItem>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Timeline */}
      {liste.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-12 text-center"
        >
          <FiInbox className="mb-3 h-6 w-6 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">
            Aucune activité trouvée
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Essayez de modifier vos filtres.
          </p>
        </motion.div>
      ) : (
        <div className="relative space-y-0 rounded-md border border-border bg-card">
          {/* Ligne verticale timeline */}
          <div className="absolute bottom-6 left-[1.9rem] top-6 hidden w-px bg-border sm:block" />

          {liste.map((a, i) => {
            const Icon = ACTION_ICONS[a.action] || FiActivity;
            const colorClass =
              ACTION_COLORS[a.action] || "bg-primary/10 text-primary";

            return (
              <motion.div
                key={a.idActivite}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="relative flex items-start gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:gap-4 sm:px-5"
              >
                <span
                  className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {ACTION_LABELS[a.action] || a.action}
                  </p>
                  {a.details && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {a.details}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.nomAuteur ? (
                      <span className="font-medium text-foreground/80">
                        {a.nomAuteur}
                      </span>
                    ) : null}
                    {a.nomAuteur ? " · " : ""}
                    {formatRelative(a.dateAction)}
                    <span className="hidden sm:inline">
                      {" · "}
                      {new Date(a.dateAction).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
