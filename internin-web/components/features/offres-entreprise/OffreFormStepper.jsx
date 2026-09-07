"use client";

import { FiCheck } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { OFFRE_FORM_STEPS } from "./offreForm.constants";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function OffreFormStepper({ currentStep }) {
  const { t } = useTranslation();

  return (
    <div className="mb-2">
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
                  {t(step.labelKey)}
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

      <div className="sm:hidden">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">
            {t("entrepriseSpace.offers.step", {
              current: currentStep,
              total: OFFRE_FORM_STEPS.length,
            })}{" "}
            · {t(OFFRE_FORM_STEPS[currentStep - 1].labelKey)}
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
