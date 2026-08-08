"use client";

import { motion } from "framer-motion";
import {
  FiMapPin,
  FiBriefcase,
  FiUsers,
  FiDollarSign,
  FiClock,
  FiCalendar,
  FiFlag,
} from "react-icons/fi";
import {
  modeBadge as getModeBadge,
  dureeLabel,
  formatRemuneration,
} from "@/lib/constants/offres";
import { useTranslation } from "@/lib/i18n/useTranslation";

function Info({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function OffreInfosGrid({ offre, delay = 0 }) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";
  const modeBadge = getModeBadge(t, offre.modeTravail);

  function formatDate(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString(dateLocale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      className="rounded-md border border-border bg-card p-6 sm:p-7"
    >
      <h5 className="mb-4 text-sm font-semibold text-foreground">
        {t("offersPage.infoGrid.title")}
      </h5>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Info
          icon={FiMapPin}
          label={t("offersPage.infoGrid.location")}
          value={offre.villeEntreprise}
        />
        <Info
          icon={FiBriefcase}
          label={t("offersPage.infoGrid.workType")}
          value={modeBadge?.label}
        />
        <Info
          icon={FiUsers}
          label={t("offersPage.infoGrid.positions")}
          value={
            offre.nombrePostes
              ? t(
                  offre.nombrePostes > 1
                    ? "offersPage.infoGrid.positionsPlural"
                    : "offersPage.infoGrid.position",
                  { n: offre.nombrePostes },
                )
              : null
          }
        />
        <Info
          icon={FiDollarSign}
          label={t("offersPage.infoGrid.remuneration")}
          value={formatRemuneration(t, offre)}
        />
        <Info
          icon={FiClock}
          label={t("offersPage.infoGrid.duration")}
          value={offre.dureeStage ? dureeLabel(t, offre.dureeStage) : null}
        />
        <Info
          icon={FiCalendar}
          label={t("offersPage.infoGrid.publicationDate")}
          value={formatDate(offre.datePublication)}
        />
        <Info
          icon={FiFlag}
          label={t("offersPage.infoGrid.deadline")}
          value={formatDate(offre.dateLimiteCandidature)}
        />
      </div>
    </motion.div>
  );
}
