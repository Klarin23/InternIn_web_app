"use client";
import { FiZap } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Aucune session de préparation d'entretien par IA n'existe encore côté
// backend (seul le coaching post-évaluation hebdomadaire existe, pour un
// stage déjà actif — un concept différent). Carte honnête plutôt que
// fonctionnalité simulée.
export default function CoachIACard() {
  const { t } = useTranslation();
  return (
    <div className="rounded-[20px] border border-border bg-card p-6 shadow-[0_2px_10px_-4px_rgba(17,24,39,0.08)] transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(17,24,39,0.12)]">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-amber-100">
          <FiZap className="h-4 w-4 text-amber-500" />
        </div>

        <h3 className="text-sm font-bold text-foreground">
          {t("dashboard.coachIA.title")}
        </h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("dashboard.coachIA.description")}
      </p>
      <button
        type="button"
        disabled
        title={t("dashboard.coachIA.comingSoon")}
        className="w-full rounded-sm bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground cursor-not-allowed"
      >
        {t("dashboard.coachIA.startSession")}
      </button>
    </div>
  );
}
