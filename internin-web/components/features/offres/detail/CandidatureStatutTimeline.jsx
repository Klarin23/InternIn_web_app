"use client";
// Timeline de progression de la candidature. N'utilise que des statuts
// réellement renvoyés par l'API (voir lib/constants/offres.js) — aucun
// statut n'est inventé. "rejetee" et "retiree" sont des issues terminales
// qui ne représentent pas une étape d'avancement : elles sont affichées à
// part plutôt que forcées sur la ligne de progression.

import { motion } from "framer-motion";
import { FiCheck, FiX } from "react-icons/fi";
import {
  statutCandidature,
  STATUT_CANDIDATURE_ETAPES,
} from "@/lib/constants/offres";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function CandidatureStatutTimeline({ statut }) {
  const { t } = useTranslation();
  const estIssueTerminaleNegative =
    statut === "rejetee" || statut === "retiree";

  if (estIssueTerminaleNegative) {
    const info = statutCandidature(t, statut);
    return (
      <div
        className={`flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm font-semibold ${info.className}`}
      >
        <FiX className="h-4 w-4 shrink-0" />
        {info.label}
      </div>
    );
  }

  const etapeActuelle = STATUT_CANDIDATURE_ETAPES.indexOf(statut);

  return (
    <div className="flex flex-col gap-0">
      {STATUT_CANDIDATURE_ETAPES.map((etape, i) => {
        const info = statutCandidature(t, etape);
        const estAtteinte = etapeActuelle >= 0 && i <= etapeActuelle;
        const estActuelle = i === etapeActuelle;
        const estDerniere = i === STATUT_CANDIDATURE_ETAPES.length - 1;

        return (
          <div key={etape} className="flex gap-3">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: estActuelle ? 1.1 : 1,
                  backgroundColor: estAtteinte
                    ? "var(--primary)"
                    : "var(--muted)",
                }}
                transition={{ duration: 0.3 }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              >
                {estAtteinte && (
                  <FiCheck className="h-3.5 w-3.5 text-primary-foreground" />
                )}
              </motion.div>
              {!estDerniere && (
                <div
                  className={`w-px flex-1 ${
                    i < etapeActuelle ? "bg-primary" : "bg-muted"
                  }`}
                  style={{ minHeight: "1.5rem" }}
                />
              )}
            </div>
            <p
              className={`pb-6 text-sm ${
                estActuelle
                  ? "font-semibold text-foreground"
                  : estAtteinte
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {info.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
