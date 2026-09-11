"use client";
// Indicateur de progression horizontal (§ "Indicateur d'étapes" du Design System).
// Affiche les 11 étapes sous forme de segments, avec l'étape actuelle mise en évidence.

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function OnboardingStepper({ currentStep, totalSteps }) {
  const { t } = useTranslation();

  return (
    <div>
      {/* Barre de progression continue */}
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs font-medium text-muted-foreground">
        {t("auditUi.common.stepOf", { current: currentStep, total: totalSteps })}
      </p>
    </div>
  );
}
