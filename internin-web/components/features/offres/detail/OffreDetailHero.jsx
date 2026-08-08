"use client";
// Bloc Hero de la page de détail — refonte visuelle uniquement (aucune
// logique métier). Le cœur "favori" reste désactivé : aucune fonctionnalité
// de stages sauvés n'existe encore côté backend (voir OffreCard.jsx) — l'UI
// est prête pour l'activer, mais rien n'est simulé.

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiArrowLeft, FiMapPin, FiUsers, FiHeart } from "react-icons/fi";
import {
  modeBadge as getModeBadge,
  couleurAvatar,
  parseCompetences,
} from "@/lib/constants/offres";
import { useTranslation } from "@/lib/i18n/useTranslation";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function OffreDetailHero({ offre, isNew }) {
  const router = useRouter();
  const { t } = useTranslation();
  const modeBadge = getModeBadge(t, offre.modeTravail);
  const competences = parseCompetences(offre.competencesRequises, 8);

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.button
        variants={item}
        type="button"
        onClick={() => router.push("/offres")}
        className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <FiArrowLeft className="h-4 w-4" />
        {t("offersPage.notFound.back")}
      </motion.button>

      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-md border border-border bg-card p-6 sm:p-8"
      >
        {isNew && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 18,
              delay: 0.2,
            }}
            className="absolute right-6 top-6 rounded-full bg-linear-to-r from-primary to-cyan-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
          >
            {t("offersPage.card.new")}
          </motion.span>
        )}

        <div className="flex items-start gap-4">
          {offre.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offre.logoUrl}
              alt={offre.nomEntreprise || t("offersPage.detail.companyLogo")}
              className="h-16 w-16 shrink-0 rounded-full border border-border object-cover sm:h-18 sm:w-18"
            />
          ) : (
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white sm:h-18 sm:w-18 ${couleurAvatar(offre.nomEntreprise)}`}
            >
              {offre.nomEntreprise?.charAt(0) || "?"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                {offre.titre}
              </h1>
              <button
                type="button"
                disabled
                title={t("offersPage.card.saveComingSoon")}
                aria-label={t("offersPage.card.saveAria")}
                className="mt-1 flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full text-muted-foreground/50"
              >
                <FiHeart className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-base font-medium text-muted-foreground">
              {offre.nomEntreprise}
            </p>
          </div>
        </div>

        <motion.div
          variants={item}
          className="mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm"
        >
          {offre.villeEntreprise && (
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground">
              <FiMapPin className="h-3.5 w-3.5" />
              {offre.villeEntreprise}
            </span>
          )}
          {modeBadge && (
            <span
              className={`rounded-full px-3 py-1.5 font-semibold ${modeBadge.className}`}
            >
              {modeBadge.label}
            </span>
          )}
          {offre.nombrePostes ? (
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground">
              <FiUsers className="h-3.5 w-3.5" />
              {t(
                offre.nombrePostes > 1
                  ? "offersPage.infoGrid.positionsPlural"
                  : "offersPage.infoGrid.position",
                { n: offre.nombrePostes },
              )}
            </span>
          ) : null}
        </motion.div>

        {competences.length > 0 && (
          <motion.div
            variants={container}
            className="mt-4 flex flex-wrap gap-1.5"
          >
            {competences.map((c) => (
              <motion.span
                key={c}
                variants={item}
                className="rounded-sm bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                {c}
              </motion.span>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
