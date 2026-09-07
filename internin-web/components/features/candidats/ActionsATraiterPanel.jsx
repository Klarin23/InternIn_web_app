

"use client";
import { parseDateHeureRobuste, localeBcp47, APP_TIME_ZONE } from "@/lib/entretiens/planification";
import { useTranslation } from "@/lib/i18n/useTranslation";


import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle, FiArrowRight, FiRefreshCw } from "react-icons/fi";

function formatDateProposee(dateStr, locale = "fr") {
  if (!dateStr) return null;
  const d = parseDateHeureRobuste(dateStr);
  if (!d) return null;
  const loc = localeBcp47(locale);
  const jour = d.toLocaleDateString(loc, {
    timeZone: APP_TIME_ZONE,
    day: "numeric",
    month: "long",
  });
  const heure = d.toLocaleTimeString(loc, {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${jour} · ${heure}`;
}

/**
 * Panneau "À traiter" — liste les demandes de reprogrammation
 * nécessitant une action de l'entreprise.
 * N'apparaît que s'il y a au moins une demande.
 */
export default function ActionsATraiterPanel({
  demandes = [],
  onTraiter,
}) {
  const { t, locale } = useTranslation();

  if (!demandes.length) return null;

  const count = demandes.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, height: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="mb-6 overflow-hidden rounded-xl border border-amber-200/80 bg-amber-50/60 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/25"
      aria-label={t("entrepriseSpace.candidatures.ariaActionsToHandle", { count })}
      role="region"
    >
      <div className="flex items-center gap-2.5 border-b border-amber-200/60 px-4 py-3 dark:border-amber-900/30">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <FiAlertCircle className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {t("entrepriseSpace.candidatures.toHandleTitle")} 
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
              {count}
            </span>
          </p>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
            {count === 1
              ? t("entrepriseSpace.candidatures.toHandleOne")
              : t("entrepriseSpace.candidatures.toHandleOther", { count })}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-amber-200/50 dark:divide-amber-900/30">
        <AnimatePresence mode="popLayout">
          {demandes.map((demande, index) => {
            const dateLabel = formatDateProposee(demande.dateHeureProposee, locale);
            const initials = `${demande.prenom?.[0] || ""}${demande.nom?.[0] || ""}`;

            return (
              <motion.li
                key={demande.idEntretien || demande.idCandidature}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  height: 0,
                  marginTop: 0,
                  marginBottom: 0,
                  transition: { duration: 0.2 },
                }}
                transition={{
                  duration: 0.22,
                  delay: Math.min(index, 6) * 0.04,
                  ease: "easeOut",
                }}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-200 text-xs font-bold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                    {demande.photoProfilUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={demande.photoProfilUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {demande.prenom} {demande.nom}
                    </p>
                    {demande.titreOffre && (
                      <p className="truncate text-xs text-muted-foreground">
                        {demande.titreOffre}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                        <FiRefreshCw className="h-3 w-3" aria-hidden />
                        {t("entrepriseSpace.candidatures.rescheduleRequested")}
                      </span>
                      {dateLabel && (
                        <span className="text-[11px] text-amber-900/80 dark:text-amber-200/80">
                          {t("entrepriseSpace.candidatures.newDateProposed")} 
                          <strong className="font-semibold">{dateLabel}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onTraiter?.(demande)}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-amber-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:bg-amber-600 dark:hover:bg-amber-500 sm:self-center"
                  aria-label={`${t("entrepriseSpace.candidatures.handleReschedule", { name: `${demande.prenom} ${demande.nom}` })}`}
                >
                  {t("entrepriseSpace.candidatures.handleAction")}
                  <FiArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}
