"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { FiCheck, FiUserPlus, FiBriefcase, FiCalendar } from "react-icons/fi";

function estAujourdhui(date) {
  return new Date(date).toDateString() === new Date().toDateString();
}

function formatHeure(date, loc) {
  return new Date(date).toLocaleTimeString(loc, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TYPE_CONFIG = {
  candidature: { icon: FiUserPlus, color: "bg-primary" },
  offre: { icon: FiBriefcase, color: "bg-info" },
  entretien: { icon: FiCalendar, color: "bg-success" },
};

export default function TimelineWidget({ candidatures, offres, entretiens }) {
  const { t, locale } = useTranslation();
  const loc = locale === "fr" ? "fr-FR" : "en-GB";
  const evenements = [
    ...(candidatures || [])
      .filter((c) => c.dateCandidature && estAujourdhui(c.dateCandidature))
      .map((c) => ({
        date: c.dateCandidature,
        type: "candidature",
        texte: t("entrepriseSpace.dashboard.appliedText", { name: `${c.prenom} ${c.nom}` }),
        sousTexte: c.titreOffre,
      })),
    ...(offres || [])
      .filter((o) => o.datePublication && estAujourdhui(o.datePublication))
      .map((o) => ({
        date: o.datePublication,
        type: "offre",
        texte: t("entrepriseSpace.dashboard.offerPublished"),
        sousTexte: o.titre,
      })),
    ...(entretiens || [])
      .filter(
        (e) =>
          e.statut === "planifie" &&
          e.dateCreation &&
          estAujourdhui(e.dateCreation),
      )
      .map((e) => ({
        date: e.dateCreation,
        type: "entretien",
        texte: t("entrepriseSpace.dashboard.interviewConfirmed"),
        sousTexte: `${e.prenom} ${e.nom}`,
      })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
      <h5 className="mb-4 text-sm font-semibold text-foreground">
        {t("entrepriseSpace.dashboard.activityToday")}
      </h5>

      {evenements.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("entrepriseSpace.dashboard.noActivityToday")}
        </p>
      ) : (
        <div className="relative space-y-5 pl-1">
          {/* Ligne verticale continue derrière les points */}
          <div className="absolute bottom-2 left-[27px] top-2 w-px bg-border" />

          {evenements.map((e, i) => {
            const { icon: Icon, color } = TYPE_CONFIG[e.type];
            return (
              <div key={i} className="relative flex items-start gap-3">
                <span className="w-11 flex-shrink-0 pt-1.5 text-right text-xs font-medium tabular-nums text-muted-foreground">
                  {formatHeure(e.date, loc)}
                </span>
                <span
                  className={`relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white ${color}`}
                >
                  <Icon className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <FiCheck className="h-3.5 w-3.5 flex-shrink-0 text-success" />
                    <span className="truncate">{e.texte}</span>
                  </p>
                  {e.sousTexte && (
                    <p className="truncate pl-5 text-xs text-muted-foreground">
                      {e.sousTexte}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
