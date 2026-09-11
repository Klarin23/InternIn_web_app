"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { calculerCompletionEvaluationProfil } from "@/lib/utils/profilEvaluationCompletion";

export default function ProfilEvaluationCompletionAlert({ profil }) {
  const { t } = useTranslation();
  const completion = calculerCompletionEvaluationProfil(profil);

  if (!profil || completion.complet) {
    return null;
  }

  return (
    <section
      role="alert"
      aria-labelledby="profil-evaluation-alert-title"
      className="overflow-hidden rounded-2xl border border-amber-300/60 bg-amber-50/70 shadow-sm dark:border-amber-400/20 dark:bg-amber-950/20"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2
              id="profil-evaluation-alert-title"
              className="text-base font-semibold text-foreground sm:text-lg"
            >
              {t("stagiaireSpace.profile.evaluationCompletion.title")}
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
              {t("stagiaireSpace.profile.evaluationCompletion.description")}
            </p>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/80 dark:text-amber-300/80">
                {t("stagiaireSpace.profile.evaluationCompletion.missingTitle")}
              </p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {completion.manquants.map((element) => (
                  <li
                    key={element.id}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {t(element.labelKey)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="shrink-0 md:pt-1">
          <Link
            href="/profil"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:w-auto"
          >
            {t("stagiaireSpace.profile.evaluationCompletion.action")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="border-t border-amber-300/50 bg-amber-100/40 px-5 py-3 dark:border-amber-400/10 dark:bg-amber-400/5 sm:px-6">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          {t("stagiaireSpace.profile.evaluationCompletion.progress", {
            done: completion.elements.length - completion.manquants.length,
            total: completion.elements.length,
          })}
        </p>
      </div>
    </section>
  );
}
