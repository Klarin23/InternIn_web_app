"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useState } from "react";
import { FiCalendar, FiLoader, FiClock } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateEntretienEntreprise } from "@/lib/queries/useEntretiens";
import { toast } from "@/lib/store/useToastStore";
import { normaliserDateHeurePourApi, formatDateHeureLocale } from "@/lib/entretiens/planification";

/** Clés i18n — ne jamais passer du texte FR à t() */
const STATUT_LABEL_KEYS = {
  planifie: "entrepriseSpace.candidatures.interviewStatusPlanifie",
  valide: "entrepriseSpace.candidatures.interviewStatusValide",
  confirme: "entrepriseSpace.candidatures.interviewStatusConfirme",
  reprogramme: "entrepriseSpace.candidatures.interviewStatusReprogramme",
  termine: "entrepriseSpace.candidatures.interviewStatusTermine",
  annule: "entrepriseSpace.candidatures.interviewStatusAnnule",
  absent: "entrepriseSpace.candidatures.interviewStatusAbsent",
};

const STATUT_COLORS = {
  planifie: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  valide: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300",
  confirme: "bg-success/10 text-green-700 dark:text-green-400",
  reprogramme: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  termine: "bg-muted text-muted-foreground",
  annule: "bg-destructive/10 text-destructive",
  absent: "bg-destructive/10 text-destructive",
};

function toLocaleTag(locale) {
  if (!locale) return "fr-FR";
  const l = String(locale).toLowerCase();
  if (l.startsWith("en")) return "en-GB";
  return "fr-FR";
}

function formatDateTime(value, locale) {
  if (!value) return "—";
  return formatDateHeureLocale(value, locale, { withTime: true });
}

export default function EntretienStatutPanel({ entretien }) {
  const { t, locale } = useTranslation();
  const [nouvelleDate, setNouvelleDate] = useState("");
  const updateMutation = useUpdateEntretienEntreprise();

  const dateFormatee = formatDateTime(entretien.dateHeure, locale);
  const statutKey = STATUT_LABEL_KEYS[entretien.statut];
  const statutLabel = statutKey ? t(statutKey) : entretien.statut;
  const peutCloturer = ["confirme", "valide"].includes(entretien.statut);

  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FiClock className="h-3.5 w-3.5 shrink-0" />
          {dateFormatee}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            STATUT_COLORS[entretien.statut] || "bg-muted text-muted-foreground"
          }`}
        >
          {statutLabel}
        </span>
      </div>

      {entretien.statut === "reprogramme" && (
        <div className="space-y-2">
          <p className="rounded-md bg-accent/10 p-2.5 text-xs text-amber-900 dark:text-amber-200">
            <b>{t("entrepriseSpace.candidatures.candidateProposal")}</b>
            {" — "}
            {formatDateTime(entretien.dateHeureProposee, locale)}
            {entretien.retourEntretien ? (
              <>
                <br />
                {entretien.retourEntretien}
              </>
            ) : null}
          </p>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <Input
              type="datetime-local"
              value={nouvelleDate}
              onChange={(e) => setNouvelleDate(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-lg"
              aria-label={t("entrepriseSpace.candidatures.newInterviewDate")}
            />
            <Button
              type="button"
              size="sm"
              disabled={!nouvelleDate || updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate(
                  {
                    id: entretien.idEntretien,
                    payload: {
                      dateHeure: normaliserDateHeurePourApi(nouvelleDate),
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success(
                        t("entrepriseSpace.candidatures.newDateToCandidate"),
                      );
                      setNouvelleDate("");
                    },
                    onError: (err) =>
                      toast.error(
                        err?.message ||
                          t(
                            "entrepriseSpace.candidatures.rescheduleImpossible",
                          ),
                      ),
                  },
                )
              }
              className="shrink-0 rounded-lg"
            >
              {updateMutation.isPending ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FiCalendar className="h-4 w-4" />
                  {t("entrepriseSpace.candidatures.rescheduleAction")}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {entretien.statut === "planifie" && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("entrepriseSpace.candidatures.waitingCandidateReplyHintBefore")}{" "}
          <b>{t("entrepriseSpace.candidatures.menuInterviews")}</b>
          {t("entrepriseSpace.candidatures.waitingCandidateReplyHintAfter")}
        </p>
      )}

      {peutCloturer && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("entrepriseSpace.candidatures.markCompletedHintBefore")}{" "}
          <b>{t("entrepriseSpace.candidatures.menuInterviews")}</b>
          {t("entrepriseSpace.candidatures.markCompletedHintAfter")}
        </p>
      )}
    </div>
  );
}
