"use client";
// Carte d'offre — refonte visuelle uniquement (aucune logique métier modifiée).
// Écarts assumés, inchangés depuis la version précédente :
// - Pas de champ "durée" sur une offre publiée (seulement sur l'offre finale).
// - Le cœur "favori" reste désactivé : aucune fonctionnalité de stages
//   sauvés n'existe encore côté backend. L'UI est prête pour l'activer.
// - "Compétences" vient d'un champ texte libre (pas une liste structurée).
// - Le score de compatibilité (`offre.matchScore`) n'existe pas encore côté
//   API : la structure est prête, mais rien n'est inventé/affiché tant que
//   ce champ n'est pas fourni par le backend.

import Link from "next/link";
import { motion } from "framer-motion";
import { FiMapPin, FiHeart, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import {
  modeBadge as getModeBadge,
  statutCandidature as getStatutCandidature,
  couleurSecteur,
  couleurAvatar,
  parseCompetences,
  formatRemuneration,
  estOffreExpiree,
} from "@/lib/constants/offres";
import { useTranslation } from "@/lib/i18n/useTranslation";

const cardMotion = {
  initial: { opacity: 0, y: 18, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

export default function OffreCard({
  offre,
  isNew = false,
  candidature,
  vue = "grille",
  index = 0,
}) {
  const { t } = useTranslation();
  const secteurStyle = couleurSecteur(offre.secteurActivite);
  const modeBadge = getModeBadge(t, offre.modeTravail);
  const competences = parseCompetences(offre.competencesRequises);
  
  const statutInfo = candidature?.statut
    ? getStatutCandidature(t, candidature.statut)
    : null;
  // Structure prête pour un futur score de matching — jamais inventé ici.
  const matchScore =
    typeof offre.matchScore === "number" ? offre.matchScore : null;

  const estListe = vue === "liste";
  const expiree = estOffreExpiree(offre);
  return (
    <motion.div
      layout
      initial={cardMotion.initial}
      animate={cardMotion.animate}
      exit={cardMotion.exit}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: Math.min(index * 0.04, 0.4),
      }}
      whileHover={{
        y: -4,
        boxShadow: "0 16px 32px -12px rgba(17, 24, 39, 0.18)",
      }}
      className={`group relative rounded-md border border-border bg-card transition-colors hover:border-primary/40 ${
        estListe
          ? "flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
          : "flex flex-col p-5"
      }`}
    >
      {isNew && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 18,
            delay: 0.15,
          }}
          className="absolute -top-2 left-4 z-10 rounded-full bg-gradient-to-r from-primary to-cyan-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
        >
          {t("offersPage.card.new")}
        </motion.span>
      )}

      <button
        type="button"
        disabled
        title={t("offersPage.card.saveComingSoon")}
        className={`absolute right-4 top-4 z-10 text-muted-foreground/50 transition-colors cursor-not-allowed ${estListe ? "sm:static sm:order-3" : ""}`}
        aria-label={t("offersPage.card.saveAria")}
      >
        <FiHeart className="h-5 w-5" />
      </button>

      <Link
        href={`/offres/${offre.idOffre}`}
        className={
          estListe
            ? "flex min-w-0 flex-1 items-center gap-4"
            : "flex flex-1 flex-col"
        }
      >
        <div
          className={`flex items-start gap-3 ${estListe ? "min-w-0 flex-1" : "mb-3 pr-8"}`}
        >
          {offre.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offre.logoUrl}
              alt={offre.nomEntreprise || "Logo de l'entreprise"}
              className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${couleurAvatar(offre.nomEntreprise)}`}
            >
              {offre.nomEntreprise?.charAt(0) || "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h5 className="truncate font-semibold text-foreground">
              {offre.titre}
            </h5>
            <p className="truncate text-sm text-muted-foreground">
              {offre.nomEntreprise}
            </p>

            {estListe && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                {offre.villeEntreprise && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <FiMapPin className="h-3 w-3" />
                    {offre.villeEntreprise}
                  </span>
                )}
                {modeBadge && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${modeBadge.className}`}
                  >
                    {modeBadge.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {matchScore !== null && !estListe && (
            <span className="flex-shrink-0 rounded-full bg-accent px-2 py-1 text-[11px] font-bold text-accent-foreground">
              ✨ {matchScore}%
            </span>
          )}
        </div>

        {!estListe && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {offre.villeEntreprise && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <FiMapPin className="h-3 w-3" />
                {offre.villeEntreprise}
              </span>
            )}
            {offre.secteurActivite && (
              <span
                className={`rounded-full px-2.5 py-1 font-semibold ${secteurStyle.bg} ${secteurStyle.text}`}
              >
                {offre.secteurActivite}
              </span>
            )}
            {modeBadge && (
              <span
                className={`rounded-full px-2.5 py-1 font-semibold ${modeBadge.className}`}
              >
                {modeBadge.label}
              </span>
            )}

            {expiree && (
              <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-semibold text-destructive">
                Expirée
              </span>
            )}
          </div>
        )}

        {competences.length > 0 && !estListe && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {competences.map((c) => (
              <span
                key={c}
                className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {!estListe && (
          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            {statutInfo ? (
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statutInfo.className}`}
              >
                <FiCheckCircle className="h-3.5 w-3.5" />
                {statutInfo.label}
              </span>
            ) : (
              <span className="text-sm font-bold text-foreground">
                {formatRemuneration(t, offre)}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm font-semibold text-primary">
              {t("offersPage.card.viewOffer")}
              <FiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        )}
      </Link>

      {estListe && (
        <div className="flex flex-shrink-0 items-center gap-4 sm:order-2">
          <span className="hidden text-sm font-bold text-foreground md:block">
            {formatRemuneration(t, offre)}
          </span>
          {statutInfo ? (
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statutInfo.className}`}
            >
              <FiCheckCircle className="h-3.5 w-3.5" />
              {statutInfo.label}
            </span>
          ) : (
            <Link
              href={`/offres/${offre.idOffre}`}
              className="flex items-center gap-1 rounded-sm px-2 py-1 text-sm font-semibold text-primary hover:underline"
            >
              {t("offersPage.card.viewOffer")}
              <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </motion.div>
  );
}
