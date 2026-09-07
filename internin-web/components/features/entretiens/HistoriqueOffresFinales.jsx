"use client";

import { FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import { useHistoriqueOffresFinales } from "@/lib/queries/useOffresFinales";
import { useTranslation } from "@/lib/i18n/useTranslation";

const DUREE_LABEL_KEYS = {
  "1_mois": "entrepriseSpace.candidatures.duration1Month",
  "2_mois": "entrepriseSpace.candidatures.duration2Months",
  "3_mois": "entrepriseSpace.candidatures.duration3Months",
};

export default function HistoriqueOffresFinales({ idEntretien }) {
  const { t, locale } = useTranslation();
  const { data: historique, isLoading } =
    useHistoriqueOffresFinales(idEntretien);

  if (isLoading || !historique || historique.length === 0) return null;

  const localeTag = locale === "en" ? "en-GB" : "fr-FR";

  function statusLabel(h) {
    if (h.statutValidationPlateforme === "rejete") {
      return t("entrepriseSpace.candidatures.histAdminRejected");
    }
    if (h.statutValidationPlateforme === "en_attente") {
      return t("entrepriseSpace.candidatures.histPendingAdmin");
    }
    if (h.statutReponseStagiaire === "refusee") {
      return t("entrepriseSpace.candidatures.histCandidateRefused");
    }
    if (h.statutReponseStagiaire === "acceptee") {
      return t("entrepriseSpace.candidatures.histCandidateAccepted");
    }
    return t("entrepriseSpace.candidatures.histAwaitingCandidate");
  }

  function statusTone(h) {
    if (h.statutValidationPlateforme === "rejete") return "destructive";
    if (h.statutReponseStagiaire === "refusee") return "destructive";
    if (h.statutReponseStagiaire === "acceptee") return "success";
    return "muted";
  }

  return (
    <div className="mb-3 space-y-2 rounded-sm border border-border bg-muted/30 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <FiClock className="h-3.5 w-3.5" />
        {t("entrepriseSpace.candidatures.finalOffersHistory")}
      </p>
      <ul className="space-y-2">
        {historique.map((h) => {
          const tone = statusTone(h);
          return (
            <li
              key={h.idOffreFinale}
              className="rounded-sm border border-border bg-card px-3 py-2.5 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {h.intitulePoste}
                  </p>
                  <p className="text-muted-foreground">
                    {(DUREE_LABEL_KEYS[h.dureeStage]
                      ? t(DUREE_LABEL_KEYS[h.dureeStage])
                      : h.dureeStage) || h.dureeStage}
                    {h.volumeHoraireHebdo
                      ? ` · ${h.volumeHoraireHebdo}h/semaine`
                      : ""}
                  </p>
                </div>
                <span
                  className={
                    tone === "destructive"
                      ? "inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 font-semibold text-destructive"
                      : tone === "success"
                        ? "inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-semibold text-green-700"
                        : "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground"
                  }
                >
                  {tone === "success" ? (
                    <FiCheckCircle className="h-3 w-3" />
                  ) : tone === "destructive" ? (
                    <FiXCircle className="h-3 w-3" />
                  ) : null}
                  {statusLabel(h)}
                </span>
              </div>
              {h.statutReponseStagiaire === "refusee" &&
                h.motifRefusStagiaire && (
                  <p className="mt-2 border-t border-border/60 pt-2 text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {t("entrepriseSpace.candidatures.refusalReason")}:{" "}
                    </span>
                    « {h.motifRefusStagiaire} »
                  </p>
                )}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {(h.dateReponseStagiaire || h.dateValidation || h.dateCreation) &&
                  new Date(
                    h.dateReponseStagiaire ||
                      h.dateValidation ||
                      h.dateCreation,
                  ).toLocaleDateString(localeTag, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
