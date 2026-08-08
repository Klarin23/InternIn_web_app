"use client";
// Timeline d'activité du tableau de bord stagiaire : fusionne candidatures
// envoyées + notifications reçues (seules sources d'activité réelles
// disponibles actuellement), groupées par jour, avec une légère animation
// de glissement à l'apparition de chaque élément.

import { motion } from "framer-motion";
import {
  FiFileText,
  FiEye,
  FiStar,
  FiXCircle,
  FiCalendar,
  FiBell,
} from "react-icons/fi";
import { useMesCandidatures } from "@/lib/queries/useMesCandidatures";
import { useNotifications } from "@/lib/queries/useNotifications";
import { useTranslation } from "@/lib/i18n/useTranslation";

function iconPourNotification(type) {
  if (type?.includes("preselectionnee"))
    return { Icon: FiStar, color: "text-amber-500" };
  if (type?.includes("rejetee"))
    return { Icon: FiXCircle, color: "text-destructive" };
  if (type?.includes("entretien"))
    return { Icon: FiCalendar, color: "text-[#8B5CF6]" };
  if (type?.includes("consultee"))
    return { Icon: FiEye, color: "text-blue-500" };
  return { Icon: FiBell, color: "text-muted-foreground" };
}

export default function ActiviteTimeline() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";
  const { data: candidatures } = useMesCandidatures();
  const { data: notifications } = useNotifications();

  function libelleJour(date) {
    const maintenant = new Date();
    const jours = Math.floor(
      (new Date(maintenant.toDateString()) - new Date(date.toDateString())) /
        86_400_000,
    );
    if (jours === 0) return t("dashboard.activity.today");
    if (jours === 1) return t("dashboard.activity.yesterday");
    return date.toLocaleDateString(dateLocale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  const evenements = [
    ...(candidatures || []).map((c) => ({
      id: `candidature-${c.idCandidature}`,
      date: new Date(c.dateCandidature),
      Icon: FiFileText,
      color: "text-[#14b8a6]",
      texte: t("dashboard.activity.applied", { company: c.nomEntreprise }),
    })),
    ...(notifications || []).map((n) => ({
      id: `notif-${n.idNotification}`,
      date: new Date(n.dateCreation),
      ...iconPourNotification(n.type),
      texte: n.titre,
    })),
  ].sort((a, b) => b.date - a.date);

  if (evenements.length === 0) {
    return (
      <div className="rounded-[20px] border border-border bg-card p-6 shadow-[0_2px_10px_-4px_rgba(17,24,39,0.08)] transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(17,24,39,0.12)]">
        <h3 className="mb-3 text-sm font-bold text-foreground">
          {t("dashboard.activity.title")}
        </h3>
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("dashboard.activity.noActivity")}
        </p>
      </div>
    );
  }

  const groupes = [];
  for (const evt of evenements) {
    const label = libelleJour(evt.date);
    let groupe = groupes.find((g) => g.label === label);
    if (!groupe) {
      groupe = { label, items: [] };
      groupes.push(groupe);
    }
    groupe.items.push(evt);
  }

  return (
    <div className="rounded-[20px] border border-border bg-card p-6 shadow-[0_2px_10px_-4px_rgba(17,24,39,0.08)] transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(17,24,39,0.12)]">
      <h3 className="mb-4 text-sm font-bold text-foreground">
        {t("dashboard.activity.title")}
      </h3>

      <div className="space-y-5">
        {groupes.map((groupe) => (
          <div key={groupe.label}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {groupe.label}
            </p>
            <div className="space-y-1 border-l-2 border-border pl-4">
              {groupe.items.map((evt, i) => {
                const Icon = evt.Icon;
                return (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: i * 0.06,
                      ease: "easeOut",
                    }}
                    className="relative flex items-center gap-2.5 py-2"
                  >
                    <span className="absolute -left-[21px] flex h-4 w-4 items-center justify-center rounded-full bg-card">
                      <Icon className={`h-4 w-4 ${evt.color}`} />
                    </span>
                    <p className="text-sm text-foreground">{evt.texte}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
