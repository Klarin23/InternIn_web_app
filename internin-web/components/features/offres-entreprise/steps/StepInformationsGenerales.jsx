"use client";

import { motion } from "framer-motion";
import { FormTextField, FormTextareaField } from "../OffreFormFields";

// Étape 1 — "Informations générales" (point 2 du cahier des charges).
// Reçoit register/errors depuis OffreForm (RHF) plutôt que de créer son
// propre contexte, pour rester simple et éviter tout provider superflu.
export default function StepInformationsGenerales({ register, errors }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Informations générales
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Ces informations apparaissent en premier aux candidats.
        </p>
      </div>

      <FormTextField
        id="titre"
        label="Titre du poste"
        placeholder="Ex. : Stage Développeur Frontend"
        helper="Utilisez un intitulé précis qui permet aux candidats de comprendre immédiatement le poste."
        registration={register("titre")}
        error={errors.titre?.message}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormTextField
          id="secteurActivite"
          label="Secteur d'activité"
          placeholder="Ex. : Technologies de l'information"
          registration={register("secteurActivite")}
          error={errors.secteurActivite?.message}
        />
        <FormTextField
          id="departement"
          label="Département"
          optional
          placeholder="Ex. : Informatique"
          registration={register("departement")}
        />
      </div>

      <FormTextareaField
        id="description"
        label="Description du stage"
        placeholder="Décrivez le poste, le contexte, les missions principales..."
        rows={6}
        registration={register("description")}
        error={errors.description?.message}
      />
    </motion.div>
  );
}
