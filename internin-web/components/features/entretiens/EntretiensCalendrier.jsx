"use client";
// Vue calendrier mensuelle des entretiens à venir. Les jours contenant un
// entretien sont marqués d'un point ; cliquer un jour affiche ses
// entretiens en dessous. Changement de mois avec une légère transition
// horizontale.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import EntretienCardStagiaire from "./EntretienCardStagiaire";
import { useTranslation } from "@/lib/i18n/useTranslation";

const JOURS_SEMAINE_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function EntretiensCalendrier({ entretiens, maintenant }) {
  const { locale, t } = useTranslation();
  const [offsetMois, setOffsetMois] = useState(0);
  const [jourSelectionne, setJourSelectionne] = useState(null);

  const base = new Date(maintenant);
  const moisAffiche = new Date(
    base.getFullYear(),
    base.getMonth() + offsetMois,
    1,
  );
  const annee = moisAffiche.getFullYear();
  const mois = moisAffiche.getMonth();

  function calculerGrilleEtEvenements() {
    const premierJour = new Date(annee, mois, 1);
    const nbJours = new Date(annee, mois + 1, 0).getDate();
    const decalage = (premierJour.getDay() + 6) % 7;

    const cases = [
      ...Array(decalage).fill(null),
      ...Array.from({ length: nbJours }, (_, i) => i + 1),
    ];

    const parJour = (entretiens || []).reduce((acc, e) => {
      const d = new Date(e.dateHeure);
      if (d.getFullYear() === annee && d.getMonth() === mois) {
        const jour = d.getDate();
        return { ...acc, [jour]: [...(acc[jour] || []), e] };
      }
      return acc;
    }, {});

    return { grille: cases, entretiensParJour: parJour };
  }

  const { grille, entretiensParJour } = calculerGrilleEtEvenements();

  const aujourdhui = new Date(maintenant);
  const estMoisCourant =
    aujourdhui.getFullYear() === annee && aujourdhui.getMonth() === mois;
  const entretiensDuJour = jourSelectionne
    ? entretiensParJour[jourSelectionne] || []
    : [];

  function changerMois(delta) {
    setOffsetMois((o) => o + delta);
    setJourSelectionne(null);
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold capitalize text-foreground">
          {moisAffiche.toLocaleDateString(locale, {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => changerMois(-1)}
            aria-label={t("interviews.calendar.previousMonth")}
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted active:scale-95"
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => changerMois(1)}
            aria-label={t("interviews.calendar.nextMonth")}
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted active:scale-95"
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {JOURS_SEMAINE_KEYS.map((jour, i) => (
          <span key={jour}>{t(`interviews.calendar.days.${jour}`)}</span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${annee}-${mois}`}
          initial={{ opacity: 0, x: offsetMois >= 0 ? 12 : -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid grid-cols-7 gap-1"
        >
          {grille.map((jour, i) => {
            if (!jour) return <span key={i} />;
            const evenements = entretiensParJour[jour];
            const estAujourdhui =
              estMoisCourant && jour === aujourdhui.getDate();
            const estSelectionne = jour === jourSelectionne;

            return (
              <button
                key={i}
                type="button"
                disabled={!evenements}
                onClick={() =>
                  setJourSelectionne(jour === jourSelectionne ? null : jour)
                }
                className={`flex h-9 flex-col items-center justify-center rounded-sm text-xs transition-colors ${
                  estSelectionne
                    ? "bg-[#8B5CF6] font-bold text-white"
                    : estAujourdhui
                      ? "bg-[#14b8a6] font-bold text-white"
                      : evenements
                        ? "cursor-pointer text-foreground hover:bg-muted"
                        : "cursor-default text-foreground"
                }`}
              >
                {jour}
                {evenements && (
                  <span
                    className={`mt-0.5 h-1 w-1 rounded-full ${
                      estSelectionne || estAujourdhui
                        ? "bg-white"
                        : "bg-[#8B5CF6]"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {jourSelectionne && entretiensDuJour.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-4 space-y-3 overflow-hidden border-t border-border pt-4"
          >
            {entretiensDuJour.map((e, i) => (
              <EntretienCardStagiaire
                key={e.idEntretien}
                entretien={e}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
