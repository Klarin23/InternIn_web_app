"use client";

import { motion } from "framer-motion";
import {
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiFlag,
  FiHeart,
} from "react-icons/fi";
import {
  modeBadge as getModeBadge,
  dureeLabel,
  statutCandidature as getStatutCandidature,
  formatRemuneration,
} from "@/lib/constants/offres";
import PostulerDialog from "@/components/features/offres/PostulerDialog";
import CandidatureStatutTimeline from "./CandidatureStatutTimeline";
import { useTranslation } from "@/lib/i18n/useTranslation";

function Ligne({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function OffreCandidatureSidebar({
  offre,
  offreId,
  candidature,
  delay = 0,
}) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";
  const modeBadge = getModeBadge(t, offre.modeTravail);
  const statutInfo = candidature?.statut
    ? getStatutCandidature(t, candidature.statut)
    : null;

  function formatDateCourte(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString(dateLocale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      className="space-y-4 lg:sticky lg:top-[88px]"
    >
      {/* Résumé de l'offre */}
      <div className="rounded-md border border-border bg-card p-5">
        <h5 className="mb-3 text-sm font-semibold text-foreground">
          {t("offersPage.sidebar.summary")}
        </h5>
        <div className="mb-4 rounded-sm bg-primary/5 px-4 py-3">
          <p className="text-xs font-medium text-primary/80">
            {t("offersPage.sidebar.remuneration")}
          </p>
          <p className="mt-0.5 text-lg font-bold text-primary">
            {formatRemuneration(t, offre)}
          </p>
        </div>
        <div className="space-y-2.5">
          <Ligne
            icon={FiMapPin}
            label={t("offersPage.sidebar.location")}
            value={offre.villeEntreprise}
          />
          <Ligne
            icon={FiBriefcase}
            label={t("offersPage.sidebar.mode")}
            value={modeBadge?.label}
          />
          <Ligne
            icon={FiClock}
            label={t("offersPage.sidebar.duration")}
            value={offre.dureeStage ? dureeLabel(t, offre.dureeStage) : null}
          />
          <Ligne
            icon={FiFlag}
            label={t("offersPage.sidebar.deadline")}
            value={formatDateCourte(offre.dateLimiteCandidature)}
          />
        </div>
      </div>

      {/* Bloc candidature */}
      <div className="rounded-md border border-border bg-card p-5">
        <h5 className="mb-3 text-sm font-semibold text-foreground">
          {t("offersPage.sidebar.application")}
        </h5>

        {candidature ? (
          <div className="space-y-1">
            <div
              className={`mb-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statutInfo?.className || ""}`}
            >
              {t("offersPage.sidebar.sent")}
            </div>
            <CandidatureStatutTimeline statut={candidature.statut} />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t("offersPage.sidebar.openText")}
            </p>
            <PostulerDialog idOffre={offreId} offreTitle={offre.titre} />
            <button
              type="button"
              disabled
              title={t("offersPage.card.saveComingSoon")}
              className="flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-sm border border-border py-2 text-xs font-medium text-muted-foreground/60"
            >
              <FiHeart className="h-3.5 w-3.5" />
              {t("offersPage.sidebar.saveForLater")}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
