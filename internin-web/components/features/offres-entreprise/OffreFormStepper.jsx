"use client";

import { FiCheck } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { OFFRE_FORM_STEPS } from "./offreForm.constants";

// Progression visuelle en haut du formulaire (point 1 et 17 du cahier des
// charges). Compacte sur mobile : seuls le numéro et le libellé de l'étape
// active restent visibles, avec une barre de progression fine.
export default function OffreFormStepper({ currentStep }) {
  return (
    <div className="mb-2">
      {/* Desktop / tablette : étapes horizontales avec libellés */}
      <ol className="hidden items-center gap-2 sm:flex">
        {OFFRE_FORM_STEPS.map((step, index) => {
          const isDone = step.id < currentStep;
          const isActive = step.id === currentStep;
          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isDone && "bg-primary text-primary-foreground",
                    isActive &&
                      "bg-primary/15 text-primary ring-2 ring-primary/40",
                    !isDone && !isActive && "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone ? <FiCheck className="h-3.5 w-3.5" /> : step.id}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isActive
                      ? "text-foreground"
                      : isDone
                        ? "text-foreground/70"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < OFFRE_FORM_STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-px flex-1 transition-colors",
                    isDone ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile : simple compteur + barre de progression */}
      <div className="sm:hidden">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">
            Étape {currentStep}/{OFFRE_FORM_STEPS.length} ·{" "}
            {OFFRE_FORM_STEPS[currentStep - 1].label}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{
              width: `${(currentStep / OFFRE_FORM_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
