"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { FiCheck } from "react-icons/fi";
import { useHistoriqueCandidature } from "@/lib/queries/useCandidaturesEntreprise";

const HISTORY_ACTION_KEYS = {
  // Codes techniques
  profil_consulte: "entrepriseSpace.candidatures.actionProfileViewed",
  candidat_preselectionne: "entrepriseSpace.candidatures.actionPreselected",
  candidature_refusee: "entrepriseSpace.candidatures.actionRejected",
  candidature_acceptee: "entrepriseSpace.candidatures.actionAccepted",
  candidature_remise_attente: "entrepriseSpace.candidatures.actionReopened",
  candidature_soumise: "entrepriseSpace.candidatures.actionApplicationSubmitted",
  candidature_envoyee: "entrepriseSpace.candidatures.actionApplicationSent",
  entretien_programme: "entrepriseSpace.candidatures.actionInterviewScheduled",
  cv_telecharge: "entrepriseSpace.candidatures.actionCvDownloaded",
  evaluation_maj: "entrepriseSpace.candidatures.actionEvaluationUpdated",
  note_ajoutee: "entrepriseSpace.candidatures.actionNoteLeft",
  candidature_retiree: "entrepriseSpace.candidatures.actionWithdrawnByCandidate",
  // Libellés FR historiques (stockés en base)
  "Profil consulté": "entrepriseSpace.candidatures.actionProfileViewed",
  "Profil consulte": "entrepriseSpace.candidatures.actionProfileViewed",
  "Candidat présélectionné": "entrepriseSpace.candidatures.actionPreselected",
  "Candidat preselectionne": "entrepriseSpace.candidatures.actionPreselected",
  "Candidature refusée": "entrepriseSpace.candidatures.actionRejected",
  "Candidature refusee": "entrepriseSpace.candidatures.actionRejected",
  "Candidature acceptée": "entrepriseSpace.candidatures.actionAccepted",
  "Candidature acceptee": "entrepriseSpace.candidatures.actionAccepted",
  "Candidature remise en attente": "entrepriseSpace.candidatures.actionReopened",
  "Candidature soumise": "entrepriseSpace.candidatures.actionApplicationSubmitted",
  "Candidature envoyée": "entrepriseSpace.candidatures.actionApplicationSent",
  "Candidature envoyee": "entrepriseSpace.candidatures.actionApplicationSent",
  "Entretien programmé": "entrepriseSpace.candidatures.actionInterviewScheduled",
  "Entretien programme": "entrepriseSpace.candidatures.actionInterviewScheduled",
  "Interview scheduled": "entrepriseSpace.candidatures.actionInterviewScheduled",
  "CV téléchargé": "entrepriseSpace.candidatures.actionCvDownloaded",
  "CV telecharge": "entrepriseSpace.candidatures.actionCvDownloaded",
  "Évaluation mise à jour": "entrepriseSpace.candidatures.actionEvaluationUpdated",
  "Evaluation mise a jour": "entrepriseSpace.candidatures.actionEvaluationUpdated",
  "A laissé une note": "entrepriseSpace.candidatures.actionNoteLeft",
  "A laisse une note": "entrepriseSpace.candidatures.actionNoteLeft",
  "Note ajoutée": "entrepriseSpace.candidatures.actionNoteAdded",
  "Statut modifié": "entrepriseSpace.candidatures.actionStatusChanged",
  "Candidature retirée par le candidat": "entrepriseSpace.candidatures.actionWithdrawnByCandidate",
};

function translateHistoryAction(action, t) {
  if (!action) return "";
  if (HISTORY_ACTION_KEYS[action]) {
    const translated = t(HISTORY_ACTION_KEYS[action]);
    if (translated && translated !== HISTORY_ACTION_KEYS[action]) return translated;
  }
  const lower = String(action).toLowerCase();
  if (lower.includes("profil") && lower.includes("consult"))
    return t("entrepriseSpace.candidatures.actionProfileViewed");
  if (lower.includes("présélection") || lower.includes("preselection"))
    return t("entrepriseSpace.candidatures.actionPreselected");
  if (lower.includes("entretien") && (lower.includes("program") || lower.includes("planif")))
    return t("entrepriseSpace.candidatures.actionInterviewScheduled");
  if (lower.includes("candidature") && lower.includes("envoy"))
    return t("entrepriseSpace.candidatures.actionApplicationSent");
  if (lower.includes("candidature") && lower.includes("refus"))
    return t("entrepriseSpace.candidatures.actionRejected");
  if (lower.includes("candidature") && lower.includes("accept"))
    return t("entrepriseSpace.candidatures.actionAccepted");
  if (lower.includes("cv") && lower.includes("télécharg") || lower.includes("telecharg"))
    return t("entrepriseSpace.candidatures.actionCvDownloaded");
  return action;
}

function formatHeure(date, locale) {
  return new Date(date).toLocaleTimeString(locale === "en" ? "en-GB" : "fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDateCourte(date, locale) {
  return new Date(date).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export default function CandidatureTimeline({ idCandidature }) {
  const { t, locale } = useTranslation();
  const { data: historique, isLoading } =
    useHistoriqueCandidature(idCandidature);

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("entrepriseSpace.candidatures.timelineLoading")}
      </p>
    );
  }
  if (!historique || historique.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("entrepriseSpace.candidatures.timelineEmpty")}
      </p>
    );
  }

  return (
    <div className="relative space-y-4 pl-1">
      <div className="absolute bottom-2 left-[43px] top-2 w-px bg-border" />
      {historique.map((event) => (
        <div key={event.idActivite || `${event.dateAction}-${event.action}`} className="relative flex items-start gap-3">
          <div className="w-11 flex-shrink-0 pt-0.5 text-right">
            <p className="text-xs font-medium tabular-nums text-foreground">
              {formatHeure(event.dateAction, locale)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatDateCourte(event.dateAction, locale)}
            </p>
          </div>
          <span className="relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success text-white">
            <FiCheck className="h-3 w-3" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-foreground">
              {translateHistoryAction(event.action, t)}
            </p>
            {event.nomMembre && (
              <p className="text-xs text-muted-foreground">
                {t("entrepriseSpace.candidatures.historyBy", {
                  name: event.nomMembre,
                })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
