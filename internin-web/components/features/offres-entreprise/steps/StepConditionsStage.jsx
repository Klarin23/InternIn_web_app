"use client";

import { Controller, useWatch } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { FiMinus, FiPlus, FiCalendar } from "react-icons/fi";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import SelectableCard from "../SelectableCard";
import {
  MODE_TRAVAIL_OPTIONS,
  REMUNERATION_OPTIONS,
  DUREE_OPTIONS,
} from "../offreForm.constants";

const todayIso = () => new Date().toISOString().split("T")[0];

// Étape 3 — "Conditions du stage" (points 4 à 8 du cahier des charges).
// Regroupe mode de travail, durée, nombre de postes, rémunération (avec
// montant conditionnel animé) et date limite de candidature.
//
// IMPORTANT : ce composant n'a PAS appelé useForm() lui-même (c'est
// OffreForm.jsx qui le fait). Pour réagir de façon fiable aux changements
// de remunerationType / nombrePostes ici, on utilise `useWatch({ control,
// name })` plutôt que la fonction `watch()` reçue en prop : `watch()` ne
// garantit un re-render que dans le composant qui a appelé useForm() ;
// `useWatch` est l'outil prévu par RHF pour un composant enfant.
export default function StepConditionsStage({ control, register, errors }) {
  const remunerationType = useWatch({ control, name: "remunerationType" });
  const nombrePostes = useWatch({ control, name: "nombrePostes" }) || 1;
  const showMontant = REMUNERATION_OPTIONS.find(
    (o) => o.value === remunerationType,
  )?.hasMontant;

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Conditions du stage
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Les informations pratiques que les candidats consultent en premier.
        </p>
      </div>

      {/* Mode de travail — cartes sélectionnables (point 5) */}
      <div className="space-y-2">
        <Label>Mode de travail</Label>
        <Controller
          name="modeTravail"
          control={control}
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-label="Mode de travail"
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {MODE_TRAVAIL_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.value}
                  selected={field.value === option.value}
                  onSelect={() => field.onChange(option.value)}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                />
              ))}
            </div>
          )}
        />
        {errors.modeTravail && (
          <p className="text-xs text-destructive">
            {errors.modeTravail.message}
          </p>
        )}
      </div>

      {/* Durée + nombre de postes (point 6) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Durée du stage{" "}
            <span className="text-muted-foreground">(facultatif)</span>
          </Label>
          <Controller
            name="dureeStage"
            control={control}
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label="Durée du stage"
                className="inline-flex rounded-md border border-border bg-muted/40 p-1"
              >
                {DUREE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={field.value === option.value}
                    onClick={() => field.onChange(option.value)}
                    className={cn(
                      "rounded-sm px-3.5 py-1.5 text-sm font-medium transition-colors",
                      field.value === option.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombrePostes">Nombre de postes</Label>
          <Controller
            name="nombrePostes"
            control={control}
            render={({ field }) => (
              <div className="inline-flex items-center gap-3 rounded-md border border-border px-3 py-1.5">
                <button
                  type="button"
                  aria-label="Réduire le nombre de postes"
                  disabled={(field.value ?? 1) <= 1}
                  onClick={() =>
                    field.onChange(Math.max(1, (field.value ?? 1) - 1))
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                >
                  <FiMinus className="h-3.5 w-3.5" />
                </button>
                <Input
                  id="nombrePostes"
                  type="number"
                  min={1}
                  value={field.value ?? 1}
                  onChange={(e) =>
                    field.onChange(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="h-8 w-14 rounded-sm border-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="Augmenter le nombre de postes"
                  onClick={() => field.onChange((field.value ?? 1) + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted"
                >
                  <FiPlus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          />
          {errors.nombrePostes && (
            <p className="text-xs text-destructive">
              {errors.nombrePostes.message}
            </p>
          )}
        </div>
      </div>

      {/* Rémunération — cartes + montant conditionnel (point 7) */}
      <div className="space-y-2">
        <Label>Rémunération</Label>
        <Controller
          name="remunerationType"
          control={control}
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-label="Type de rémunération"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {REMUNERATION_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.value}
                  selected={field.value === option.value}
                  onSelect={() => field.onChange(option.value)}
                  icon={option.icon}
                  label={option.label}
                  className="p-3"
                />
              ))}
            </div>
          )}
        />
        {errors.remunerationType && (
          <p className="text-xs text-destructive">
            {errors.remunerationType.message}
          </p>
        )}

        <AnimatePresence initial={false}>
          {showMontant && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1.5 pt-3">
                <Label htmlFor="montantRemuneration">Montant</Label>
                <div className="relative w-full sm:w-56">
                  <Input
                    id="montantRemuneration"
                    type="number"
                    min={0}
                    placeholder="Ex. : 50000"
                    className="h-12 rounded-sm pr-16"
                    {...register("montantRemuneration")}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                    FCFA
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Date limite de candidature (point 8) */}
      <div className="space-y-1.5">
        <Label htmlFor="dateLimiteCandidature">
          Date limite de candidature{" "}
          <span className="text-muted-foreground">(facultatif)</span>
        </Label>
        <div className="relative w-full sm:w-64">
          <FiCalendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="dateLimiteCandidature"
            type="date"
            min={todayIso()}
            className="h-12 rounded-sm pl-9"
            {...register("dateLimiteCandidature")}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          📅 Les candidatures seront acceptées jusqu&apos;à cette date.
        </p>
        {errors.dateLimiteCandidature && (
          <p className="text-xs text-destructive">
            {errors.dateLimiteCandidature.message}
          </p>
        )}
      </div>
    </motion.div>
  );
}
