"use client";
// Mini calendrier du mois en cours, avec les entretiens du stagiaire
// marqués d'un point. Sous la grille : la liste des prochaines dates, en
// clair.
//
// Écart assumé : la "date limite de candidature" existe dans le schéma
// (offres_stage.dateLimiteCandidature) mais n'est pas encore renvoyée par
// l'API pour la liste de candidatures du stagiaire — seuls les entretiens
// sont donc affichés ici pour l'instant.

import { useMemo } from "react";
import { FiCalendar } from "react-icons/fi";
import { useMesEntretiens } from "@/lib/queries/useEntretiens";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function CalendrierCard() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";
  const joursSemaine = t("dashboard.calendar.weekDays");
  const { data: entretiens } = useMesEntretiens();

  const { grille, moisLabel, entretiensParJour, prochains } = useMemo(() => {
    const aujourdhui = new Date();
    const annee = aujourdhui.getFullYear();
    const mois = aujourdhui.getMonth();

    const premierJour = new Date(annee, mois, 1);
    const nbJours = new Date(annee, mois + 1, 0).getDate();
    const decalage = (premierJour.getDay() + 6) % 7;

    const cases = [
      ...Array(decalage).fill(null),
      ...Array.from({ length: nbJours }, (_, i) => i + 1),
    ];

    const parJour = {};
    (entretiens || []).forEach((e) => {
      const d = new Date(e.dateHeure);
      if (d.getFullYear() === annee && d.getMonth() === mois) {
        parJour[d.getDate()] = (parJour[d.getDate()] || 0) + 1;
      }
    });

    const aVenir = (entretiens || [])
      .filter(
        (e) => new Date(e.dateHeure) >= new Date(aujourdhui.toDateString()),
      )
      .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure))
      .slice(0, 3);

    return {
      grille: cases,
      moisLabel: aujourdhui.toLocaleDateString(dateLocale, {
        month: "long",
        year: "numeric",
      }),
      entretiensParJour: parJour,
      prochains: aVenir,
    };
  }, [entretiens, dateLocale]);

  const aujourdhui = new Date().getDate();

  return (
    <div className="rounded-[20px] border border-border bg-card p-6 shadow-[0_2px_10px_-4px_rgba(17,24,39,0.08)] transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(17,24,39,0.12)]">
      <h3 className="mb-3 text-sm font-bold capitalize text-foreground">
        {moisLabel}
      </h3>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {joursSemaine.map((j, i) => (
          <span key={i}>{j}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grille.map((jour, i) => {
          if (!jour) return <span key={i} />;
          const aEntretien = !!entretiensParJour[jour];
          const estAujourdhui = jour === aujourdhui;
          return (
            <div
              key={i}
              className={`flex h-8 flex-col items-center justify-center rounded-sm text-xs ${
                estAujourdhui
                  ? "bg-[#14b8a6] font-bold text-white"
                  : "text-foreground"
              }`}
            >
              {jour}
              {aEntretien && (
                <span
                  className={`mt-0.5 h-1 w-1 rounded-full ${estAujourdhui ? "bg-white" : "bg-[#8B5CF6]"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {prochains.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          {prochains.map((e) => (
            <div
              key={e.idEntretien}
              className="flex items-center gap-2 text-xs"
            >
              <FiCalendar className="h-3.5 w-3.5 flex-shrink-0 text-[#8B5CF6]" />
              <span className="font-semibold text-foreground">
                {new Date(e.dateHeure).getDate()}
              </span>
              <span className="text-muted-foreground">
                {t("dashboard.calendar.interview")} · {e.nomEntreprise}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
