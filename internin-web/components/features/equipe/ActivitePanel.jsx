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
import { useTranslation } from "@/lib/i18n/useTranslation";

/** Clés techniques d'action → clé i18n (ne pas modifier les clés techniques) */
const ACTION_KEYS = {
  invitation_envoyee: "equipe.activite.actions.invitationSent",
  invitation_renvoyee: "equipe.activite.actions.invitationResent",
  invitation_annulee: "equipe.activite.actions.invitationCanceled",
  permissions_modifiees: "equipe.activite.actions.permissionsUpdated",
  membre_active: "equipe.activite.actions.memberActivated",
  membre_desactive: "equipe.activite.actions.memberDisabled",
  stagiaire_affecte: "equipe.activite.actions.internAssigned",
  affectation_retiree: "equipe.activite.actions.assignmentRemoved",
  parametres_equipe_modifies: "equipe.activite.actions.teamSettingsUpdated",
  // Événements candidature (aussi stockés dans activites_equipe)
  profil_consulte: "entrepriseSpace.candidatures.actionProfileViewed",
  candidat_preselectionne: "entrepriseSpace.candidatures.actionPreselected",
  candidature_refusee: "entrepriseSpace.candidatures.actionRejected",
  candidature_acceptee: "entrepriseSpace.candidatures.actionAccepted",
  candidature_remise_attente: "entrepriseSpace.candidatures.actionReopened",
  candidature_soumise: "entrepriseSpace.candidatures.actionApplicationSubmitted",
  candidature_envoyee: "entrepriseSpace.candidatures.actionApplicationSent",
  entretien_programme: "entrepriseSpace.candidatures.actionInterviewScheduled",
  cv_telecharge: "entrepriseSpace.candidatures.actionCvDownloaded",
  evaluation_maj: "entrepriseSpace.candidatures.actionEvaluationUpdated",
  note_ajoutee: "entrepriseSpace.candidatures.actionNoteLeft",
  candidature_retiree: "entrepriseSpace.candidatures.actionWithdrawnByCandidate",
  // Libellés FR historiques
  "Profil consulté": "entrepriseSpace.candidatures.actionProfileViewed",
  "Candidat présélectionné": "entrepriseSpace.candidatures.actionPreselected",
  "Candidature refusée": "entrepriseSpace.candidatures.actionRejected",
  "Candidature acceptée": "entrepriseSpace.candidatures.actionAccepted",
  "Candidature remise en attente": "entrepriseSpace.candidatures.actionReopened",
  "Candidature soumise": "entrepriseSpace.candidatures.actionApplicationSubmitted",
  "Candidature envoyée": "entrepriseSpace.candidatures.actionApplicationSent",
  "Entretien programmé": "entrepriseSpace.candidatures.actionInterviewScheduled",
  "CV téléchargé": "entrepriseSpace.candidatures.actionCvDownloaded",
  "Évaluation mise à jour": "entrepriseSpace.candidatures.actionEvaluationUpdated",
  "A laissé une note": "entrepriseSpace.candidatures.actionNoteLeft",
  "Candidature retirée par le candidat": "entrepriseSpace.candidatures.actionWithdrawnByCandidate",

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

function localeTag(locale) {
  return locale === "en" || locale === "en-GB" || locale === "en-US"
    ? "en-GB"
    : "fr-FR";
}

function formatRelative(dateStr, t, locale) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t("equipe.activite.relative.justNow");
  if (diffMin < 60)
    return t("equipe.activite.relative.minutesAgo", { count: diffMin });
  if (diffH < 24)
    return t("equipe.activite.relative.hoursAgo", { count: diffH });
  if (diffD < 7)
    return t("equipe.activite.relative.daysAgo", { count: diffD });
  return date.toLocaleDateString(localeTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAbsolute(dateStr, locale) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(localeTag(locale), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}


/** Affiche les détails : JSON structuré → i18n ; sinon texte historique tel quel */
function formatActivityDetails(t, action, details) {
  if (details == null || details === "") return null;
  let data = null;
  if (typeof details === "string") {
    const s = details.trim();
    if (s.startsWith("{") && s.endsWith("}")) {
      try {
        data = JSON.parse(s);
      } catch {
        data = null;
      }
    }
  } else if (typeof details === "object") {
    data = details;
  }
  if (data && (data.name || data.nom || data.email || data.stageId || data.idStage)) {
    const name = data.name || data.nom || "";
    const email = data.email || "";
    const stageId = data.stageId || data.idStage || "";
    if (action === "stagiaire_affecte" && name && stageId) {
      return t("equipe.activite.detail.assignedToStage", { name, stageId });
    }
    if (action === "affectation_retiree" && stageId) {
      return t("equipe.activite.detail.stageOnly", { stageId });
    }
    if (name && email) {
      return t("equipe.activite.detail.withContact", { name, email });
    }
    if (name) {
      return t("equipe.activite.detail.withName", { name });
    }
  }
  // Données historiques (souvent FR) : affichage brut pour ne pas casser l'historique
  return typeof details === "string" ? details : null;
}

function actionLabel(t, action) {
  if (!action) return "";
  const key = ACTION_KEYS[action];
  if (key) {
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  const lower = String(action).toLowerCase();
  if (lower.includes("profil") && lower.includes("consult"))
    return t("entrepriseSpace.candidatures.actionProfileViewed");
  if (lower.includes("présélection") || lower.includes("preselection"))
    return t("entrepriseSpace.candidatures.actionPreselected");
  if (lower.includes("entretien") && (lower.includes("program") || lower.includes("planif")))
    return t("entrepriseSpace.candidatures.actionInterviewScheduled");
  if (lower.includes("candidature") && lower.includes("envoy"))
    return t("entrepriseSpace.candidatures.actionApplicationSent");
  if (lower.includes("candidature") && (lower.includes("refus") || lower.includes("reject")))
    return t("entrepriseSpace.candidatures.actionRejected");
  if (lower.includes("candidature") && lower.includes("accept"))
    return t("entrepriseSpace.candidatures.actionAccepted");
  if ((lower.includes("cv") && (lower.includes("télécharg") || lower.includes("telecharg"))))
    return t("entrepriseSpace.candidatures.actionCvDownloaded");
  if (lower.includes("évaluation") || lower.includes("evaluation"))
    return t("entrepriseSpace.candidatures.actionEvaluationUpdated");
  if (lower.includes("note"))
    return t("entrepriseSpace.candidatures.actionNoteLeft");
  if (lower.includes("retir"))
    return t("entrepriseSpace.candidatures.actionWithdrawnByCandidate");
  return action;
}

export default function ActivitePanel() {
  const { t, locale } = useTranslation();
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
            <div
              key={i}
              className="flex gap-3 rounded-md border border-border p-4"
            >
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
          {t("equipe.activite.empty.title")}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("equipe.activite.empty.description")}
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
          {t("equipe.activite.title")}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("equipe.activite.description")}
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
          <div className="text-xs text-muted-foreground">
            {t("equipe.activite.stats.total")}
          </div>
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
          <div className="text-xs text-muted-foreground">
            {t("equipe.activite.stats.today")}
          </div>
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
          <div className="text-xs text-muted-foreground">
            {t("equipe.activite.stats.week")}
          </div>
        </motion.div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <Select value={filtrePeriode} onValueChange={setFiltrePeriode}>
          <SelectTrigger className="h-10 w-full min-w-[160px] rounded-md sm:w-[190px]">
            <SelectValue placeholder={t("equipe.activite.filters.period")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">
              {t("equipe.activite.filters.allPeriods")}
            </SelectItem>
            <SelectItem value="aujourdhui">
              {t("equipe.activite.filters.today")}
            </SelectItem>
            <SelectItem value="semaine">
              {t("equipe.activite.filters.week")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtreType} onValueChange={setFiltreType}>
          <SelectTrigger className="h-10 w-full min-w-[200px] rounded-md sm:w-[240px]">
            <SelectValue
              placeholder={t("equipe.activite.filters.activityType")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">
              {t("equipe.activite.filters.allTypes")}
            </SelectItem>
            {Object.keys(ACTION_KEYS)
              .filter((key) => !key.includes(" ") && !/[A-ZÀ-Ü]/.test(key[0]))
              .map((key) => (
              <SelectItem key={key} value={key}>
                {actionLabel(t, key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Liste */}
      {liste.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-12 text-center"
        >
          <FiInbox className="mb-3 h-6 w-6 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">
            {t("equipe.activite.noResults.title")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("equipe.activite.noResults.description")}
          </p>
        </motion.div>
      ) : (
        <div className="relative space-y-0 rounded-md border border-border bg-card">
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
                    {actionLabel(t, a.action)}
                  </p>
                  {formatActivityDetails(t, a.action, a.details) && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {formatActivityDetails(t, a.action, a.details)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.nomAuteur ? (
                      <span className="font-medium text-foreground/80">
                        {a.nomAuteur}
                      </span>
                    ) : null}
                    {a.nomAuteur ? " · " : ""}
                    {formatRelative(a.dateAction, t, locale)}
                    <span className="hidden sm:inline">
                      {" · "}
                      {formatAbsolute(a.dateAction, locale)}
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
