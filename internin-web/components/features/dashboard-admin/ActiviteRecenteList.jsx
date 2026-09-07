"use client";

import { FiActivity } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { toneOf } from "./adminDashTheme";

const TYPE_TITLE_KEYS = {
  offre_validee: "adminDashboard.activity.offerApproved",
  offre_rejetee: "adminDashboard.activity.offerRejected",
  entreprise_en_attente: "adminDashboard.activity.companyPending",
  entreprise_verifiee: "adminDashboard.activity.companyVerified",
  entreprise_rejetee: "adminDashboard.activity.companyRejected",
  universite_en_attente: "adminDashboard.activity.universityPending",
  universite_verifiee: "adminDashboard.activity.universityVerified",
  universite_rejetee: "adminDashboard.activity.universityRejected",
  signalement_recu: "adminDashboard.activity.reportReceived",
};

function formatHeure(date, locale) {
  try {
    return new Date(date).toLocaleTimeString(locale || "fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatRelative(date, t) {
  if (!date) return "—";
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return t("adminDashboard.secAgo", { n: Math.max(0, sec) });
  const min = Math.floor(sec / 60);
  if (min < 60) return t("adminDashboard.minAgo", { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t("adminDashboard.hourAgo", { n: h });
  return formatHeure(date, t("adminDashboard.localeTime"));
}

function translateTitle(item, t) {
  const key = TYPE_TITLE_KEYS[item?.type];
  if (key) return t(key);
  return item?.titre || "—";
}

function translateSubtitle(item, t) {
  const raw = item?.sousTitre;
  if (!raw) return null;

  let m = raw.match(/^Stage (.+) — (.+)$/);
  if (m) {
    return t("adminDashboard.activity.stageLine", {
      poste: m[1],
      company: m[2],
    });
  }
  m = raw.match(/^(.+) — vérification requise$/);
  if (m) {
    return t("adminDashboard.activity.verificationRequired", { name: m[1] });
  }
  m = raw.match(/^(.+) — dossier complet$/);
  if (m) {
    return t("adminDashboard.activity.dossierComplete", { name: m[1] });
  }
  m = raw.match(/^(.+) — dossier non conforme$/);
  if (m) {
    return t("adminDashboard.activity.dossierNonCompliant", { name: m[1] });
  }
  // Report: typeLitige or free text — keep as-is (often a code / free description)
  return raw;
}

/** Map API tonalite → accent dashboard */
function activityTone(tonalite) {
  switch (tonalite) {
    case "danger":
    case "critical":
      return "red";
    case "warning":
    case "attention":
      return "amber";
    case "success":
    case "verified":
      return "green";
    case "info":
      return "blue";
    case "growth":
    case "institution":
      return "purple";
    case "ops":
    case "primary":
      return "teal";
    default:
      return "neutral";
  }
}

export default function ActiviteRecenteList({ activite = [] }) {
  const { t } = useTranslation();
  const items = (activite || []).slice(0, 8);

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/80 px-5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("adminDashboard.recentActivity")}
        </p>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
            <FiActivity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">
            {t("adminDashboard.noRecentActivity")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("adminDashboard.activityHint")}
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-border/80">
          {items.map((item, i) => {
            const tone = toneOf(activityTone(item.tonalite));
            const titre = translateTitle(item, t);
            const sousTitre = translateSubtitle(item, t);
            return (
              <li
                key={`${item.date}-${i}`}
                className="flex items-start gap-3 px-5 py-3"
              >
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    tone.dot,
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{titre}</p>
                  {sousTitre && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {sousTitre}
                    </p>
                  )}
                </div>
                <time
                  className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
                  dateTime={item.date}
                >
                  {formatRelative(item.date, t)}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
