"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
// Widget "À traiter" — voir la conversation sur la réorganisation du
// tableau de bord entreprise. Regroupe en un seul bloc, tout en haut de la
// page, ce qui demande une action de l'entreprise MAINTENANT :
// candidatures en attente de réponse, entretiens du jour, évaluations en
// retard. Avant, cette information était éparpillée entre TimelineWidget,
// RecentCandidaturesList et le bloc Supervision — sans hiérarchie claire.
//
// Ne fait aucun appel réseau : réutilise les données déjà chargées par
// EntrepriseDashboardContent (candidatures, entretiens, évaluations).

import Link from "next/link";
import {
  FiBell,
  FiUserPlus,
  FiCalendar,
  FiClipboard,
  FiArrowRight,
} from "react-icons/fi";

function estAujourdhui(date) {
  if (!date) return false;
  return new Date(date).toDateString() === new Date().toDateString();
}

export default function ActionsPrioritairesWidget({
  candidatures,
  entretiens,
  evaluationsSupervision,
}) {
  const { t, locale } = useTranslation();
  const candidaturesEnAttente = (candidatures || []).filter(
    (c) => c.statut === "soumise" || c.statut === "consultee",
  ).length;

  const entretiensAujourdhui = (entretiens || []).filter(
    (e) =>
      estAujourdhui(e.dateHeure) &&
      ["planifie", "valide", "confirme", "reprogramme"].includes(e.statut),
  ).length;

  const evaluationsARetard = (evaluationsSupervision || []).filter(
    (e) =>
      e.statutAffichage === "a_effectuer" || e.statutAffichage === "en_retard",
  ).length;

  const items = [
    {
      key: "candidatures",
      icon: FiUserPlus,
      label:
        candidaturesEnAttente > 1 ? t("entrepriseSpace.dashboard.candPendingOther", { count: candidaturesEnAttente }) : t("entrepriseSpace.dashboard.candPendingOne", { count: candidaturesEnAttente }),
      href: "/candidats",
      count: candidaturesEnAttente,
    },
    {
      key: "entretiens",
      icon: FiCalendar,
      label:
        entretiensAujourdhui > 1 ? t("entrepriseSpace.dashboard.interviewTodayOther", { count: entretiensAujourdhui }) : t("entrepriseSpace.dashboard.interviewTodayOne", { count: entretiensAujourdhui }),
      href: "/entretiens-entreprise",
      count: entretiensAujourdhui,
    },
    {
      key: "evaluations",
      icon: FiClipboard,
      label:
        evaluationsARetard > 1 ? t("entrepriseSpace.dashboard.evalLateOther", { count: evaluationsARetard }) : t("entrepriseSpace.dashboard.evalLateOne", { count: evaluationsARetard }),
      href: "/supervision/mes-stagiaires",
      count: evaluationsARetard,
    },
  ].filter((item) => item.count > 0);

  // Rien à traiter : pas de bloc affiché (on ne pollue pas la page avec
  // une carte vide "tout est à jour").
  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="rounded-md border border-primary/30 bg-primary/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2">
        <FiBell className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{t("entrepriseSpace.dashboard.toHandle")}</h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {total}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="flex items-center justify-between gap-3 rounded-md bg-card px-3 py-2.5 transition hover:bg-card/70"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm text-foreground">
                {item.label}
              </span>
            </div>
            <FiArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
