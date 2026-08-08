"use client";
// Mini timeline verticale de progression d'une candidature : Envoyée →
// Consultée → Entretien → Décision. L'étape courante est mise en évidence
// (point plein + libellé en gras) ; les étapes futures restent creuses.
// Gère aussi le cas particulier "retirée" (hors timeline linéaire).

import { motion } from "framer-motion";
import { FiCheck } from "react-icons/fi";
import { getEtapesTimeline } from "@/lib/candidatures/statut";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function CandidatureTimeline({
  candidature,
  entretiens,
  compact = false,
}) {
  const { t, locale } = useTranslation();
  const { retiree, etapes } = getEtapesTimeline(candidature, entretiens);

  if (retiree) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("candidatures.timeline.withdrawn")}
      </p>
    );
  }

  return (
    <div
      className={compact ? "flex items-center gap-1.5" : "flex flex-col gap-0"}
    >
      {etapes.map((etape, i) => (
        <div
          key={etape.label}
          className={compact ? "flex items-center" : "flex items-start gap-3"}
        >
          <div
            className={
              compact ? "flex items-center" : "flex flex-col items-center"
            }
          >
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.08, ease: "easeOut" }}
              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                etape.fait
                  ? "border-[#14b8a6] bg-[#14b8a6]"
                  : etape.courante
                    ? "border-[#14b8a6] bg-white"
                    : "border-muted-foreground/30 bg-white"
              }`}
            >
              {etape.fait && <FiCheck className="h-2.5 w-2.5 text-white" />}
              {!etape.fait && etape.courante && (
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </motion.span>
            {i < etapes.length - 1 && (
              <span
                className={
                  compact
                    ? `mx-1 h-0.5 w-4 ${etape.fait ? "bg-[#14b8a6]" : "bg-muted-foreground/20"}`
                    : `my-0.5 h-4 w-0.5 ${etape.fait ? "bg-[#14b8a6]" : "bg-muted-foreground/20"}`
                }
              />
            )}
          </div>
          {!compact && (
            <span
              className={`pb-4 text-xs ${
                etape.fait || etape.courante
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {t(etape.labelKey)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
