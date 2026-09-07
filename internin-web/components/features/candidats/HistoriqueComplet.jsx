"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useState } from "react";
import {
  FiChevronDown,
  FiEye,
  FiEdit3,
  FiFileText,
  FiMessageSquare,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
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

function iconePourAction(action) {
  const a = (action || "").toLowerCase();
  if (a.includes("profil") || a.includes("profile") || a.includes("consult")) return FiEye;
  if (a.includes("cv")) return FiFileText;
  if (a.includes("note")) return FiMessageSquare;
  if (a.includes("entretien") || a.includes("interview")) return FiCalendar;
  return FiEdit3;
}

function formatDateHeure(date, locale) {
  const loc = locale === "en" ? "en-GB" : "fr-FR";
  return new Date(date).toLocaleString(loc, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoriqueComplet({ idCandidature }) {
  const { t, locale } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const { data: historique } = useHistoriqueCandidature(idCandidature);

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FiClock className="h-4 w-4 text-muted-foreground" />
          {t("entrepriseSpace.candidatures.historyComplete")}
          {historique && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {historique.length}
            </span>
          )}
        </span>
        <FiChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${ouvert ? "rotate-180" : ""}`}
        />
      </button>

      {ouvert && (
        <div className="divide-y divide-border/60 border-t border-border">
          {!historique || historique.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              {t("entrepriseSpace.candidatures.historyEmpty")}
            </p>
          ) : (
            [...historique].reverse().map((event) => {
              const Icone = iconePourAction(event.action);
              return (
                <div
                  key={event.idActivite || `${event.dateAction}-${event.action}`}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <Icone className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      {translateHistoryAction(event.action, t)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.nomMembre
                        ? t("entrepriseSpace.candidatures.historyBy", {
                            name: event.nomMembre,
                          })
                        : t("entrepriseSpace.candidatures.historyByCandidate")}{" "}
                      · {formatDateHeure(event.dateAction, locale)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
