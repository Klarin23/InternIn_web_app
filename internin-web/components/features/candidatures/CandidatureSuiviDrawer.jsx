"use client";
// Drawer "Voir le suivi" : panneau latéral sur desktop (translateX),
// bottom sheet sur mobile (translateY), avec backdrop translucide flouté.

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import CandidatureTimeline from "./CandidatureTimeline";
import { getAffichage, formatDate } from "@/lib/candidatures/statut";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function CandidatureSuiviDrawer({
  candidature,
  entretiens,
  offreFinale,
  onClose,
}) {
  const { t, locale } = useTranslation();
  // Valeur initiale calculée une seule fois (initialiseur paresseux) —
  // évite d'appeler setState pendant le useEffect au montage.
  const [estMobile, setEstMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 639px)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e) => setEstMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const ouvert = !!candidature;
  const affichage = candidature
    ? getAffichage(candidature, entretiens, offreFinale, {
        t,
        locale,
      })
    : null;

  return (
    <AnimatePresence>
      {ouvert && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          />

          <motion.div
            initial={estMobile ? { y: "100%" } : { x: "100%" }}
            animate={estMobile ? { y: 0 } : { x: 0 }}
            exit={estMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className="fixed z-50 flex flex-col overflow-y-auto bg-card shadow-xl
                       inset-x-0 bottom-0 max-h-[85vh] rounded-t-lg
                       sm:inset-y-0 sm:left-auto sm:right-0 sm:bottom-auto sm:h-full sm:max-h-none sm:w-105 sm:rounded-none"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-sm font-bold text-foreground">
                {t("candidatures.drawer.title")}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("candidatures.drawer.closeAria")}
                className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 px-5 py-5">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {candidature.titre}
                </p>
                <p className="text-sm text-muted-foreground">
                  {candidature.nomEntreprise}
                </p>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("candidatures.drawer.currentStatus")}
                </p>
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${affichage.className}`}
                >
                  <affichage.Icon className="h-3.5 w-3.5" />
                  {affichage.label}
                </div>
                {affichage.detail && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {affichage.detail}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("candidatures.drawer.progress")}
                </p>
                <CandidatureTimeline
                  candidature={candidature}
                  entretiens={entretiens}
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("candidatures.drawer.applicationDate")}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {formatDate(candidature.dateCandidature, false, locale)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Date de candidature
              </p>
              <p className="mt-1 text-sm text-foreground">
                {formatDate(candidature.dateCandidature)}
              </p>
            </div>

            {candidature.statut === "rejetee" && candidature.messageRejet && (
              <div className="whitespace-pre-line rounded-sm bg-muted/40 p-3.5 text-sm text-muted-foreground">
                {candidature.messageRejet}
              </div>
            )}

            <div className="border-t border-border px-5 py-4">
              <Link
                href={`/offres/${candidature.idOffre}`}
                className="block w-full rounded-sm bg-[#14b8a6] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#0d9488]"
              >
                {t("candidatures.drawer.viewOffer")}
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
