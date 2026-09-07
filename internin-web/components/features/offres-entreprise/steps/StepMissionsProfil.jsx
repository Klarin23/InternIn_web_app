"use client";

import { motion } from "framer-motion";
import { FormTextareaField } from "../OffreFormFields";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function StepMissionsProfil({ register, errors }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {t("entrepriseSpace.offers.missionsTitle")}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("entrepriseSpace.offers.missionsHint")}
        </p>
      </div>

      <div className="rounded-md border border-border bg-card/50 p-4">
        <FormTextareaField
          id="responsabilites"
          label={t("entrepriseSpace.offers.responsibilities")}
          optional
          placeholder={t("entrepriseSpace.offers.responsibilitiesPlaceholder")}
          rows={4}
          registration={register("responsabilites")}
          error={errors.responsabilites?.message}
        />
      </div>

      <div className="rounded-md border border-border bg-card/50 p-4">
        <FormTextareaField
          id="competencesRequises"
          label={t("entrepriseSpace.offers.requiredSkills")}
          optional
          placeholder={t("entrepriseSpace.offers.requiredSkillsPlaceholder")}
          rows={4}
          registration={register("competencesRequises")}
          error={errors.competencesRequises?.message}
        />
      </div>

      <div className="rounded-md border border-border bg-card/50 p-4">
        <FormTextareaField
          id="opportunitesApprentissage"
          label={t("entrepriseSpace.offers.opportunities")}
          optional
          placeholder={t("entrepriseSpace.offers.opportunitiesPlaceholder")}
          rows={4}
          registration={register("opportunitesApprentissage")}
          error={errors.opportunitesApprentissage?.message}
        />
      </div>
    </motion.div>
  );
}
