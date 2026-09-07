"use client";

import { FiCheckCircle, FiBookOpen, FiMessageSquare } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

const ICONES = {
  evaluation: FiCheckCircle,
  journal: FiBookOpen,
  observation: FiMessageSquare,
};

const COULEURS = {
  evaluation: "bg-success/10 text-green-700",
  journal: "bg-primary/10 text-primary",
  observation: "bg-accent/40 text-amber-700",
};

export default function HistoriqueStage({ historique }) {
  const { t, locale } = useTranslation();

  if (!historique || historique.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("mesStagiaires.journal.empty")}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {historique.map((h, i) => {
        const Icone = ICONES[h.type] || FiMessageSquare;
        return (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span
              className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${COULEURS[h.type] || "bg-muted text-muted-foreground"}`}
            >
              <Icone className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-foreground">{h.libelle}</span>
              <span className="block text-xs text-muted-foreground">
                {new Date(h.date).toLocaleDateString(
                  locale === "en" ? "en-GB" : "fr-FR",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  },
                )}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
