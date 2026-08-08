"use client";

import { motion } from "framer-motion";
import { FormTextareaField } from "../OffreFormFields";

// Étape 2 — "Missions & profil recherché" (point 3 du cahier des charges).
// Les trois champs restent facultatifs, exactement comme dans le schéma Zod
// actuel (offreFormSchema) — on ne les rend pas obligatoires côté UI.
export default function StepMissionsProfil({ register, errors }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Missions & profil recherché
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Aidez les candidats à se projeter dans le rôle.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card/50 p-4">
        <FormTextareaField
          id="responsabilites"
          label="Responsabilités"
          optional
          placeholder="Quelles seront les principales missions du stagiaire ?"
          rows={4}
          registration={register("responsabilites")}
          error={errors.responsabilites?.message}
        />
      </div>

      <div className="rounded-md border border-border bg-card/50 p-4">
        <FormTextareaField
          id="competencesRequises"
          label="Compétences requises"
          optional
          placeholder="Quelles compétences sont nécessaires pour réussir ce stage ?"
          rows={4}
          registration={register("competencesRequises")}
          error={errors.competencesRequises?.message}
        />
      </div>

      <div className="rounded-md border border-border bg-card/50 p-4">
        <FormTextareaField
          id="opportunitesApprentissage"
          label="Opportunités d'apprentissage"
          optional
          placeholder="Que pourra apprendre le stagiaire pendant cette expérience ?"
          rows={4}
          registration={register("opportunitesApprentissage")}
          error={errors.opportunitesApprentissage?.message}
        />
      </div>
    </motion.div>
  );
}
