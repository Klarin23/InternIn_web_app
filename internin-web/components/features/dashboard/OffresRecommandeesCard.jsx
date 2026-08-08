"use client";
// Section "Offres faites pour vous" du tableau de bord stagiaire.
//
// Écart assumé : pas de champ "durée" sur une offre publiée (seulement sur
// l'offre finale, négociée après entretien) — non affiché, comme dans
// OffreCard.jsx. La "recommandation" est une correspondance simple avec les
// préférences de recherche du profil (secteurs/villes/modalités), pas un
// vrai moteur de matching.

import Link from "next/link";
import { motion } from "framer-motion";
import { FiMapPin, FiArrowRight } from "react-icons/fi";
import { useOffres } from "@/lib/queries/useOffres";
import { useTranslation } from "@/lib/i18n/useTranslation";

const AVATAR_PALETTE = [
  "bg-blue-600",
  "bg-cyan-500",
  "bg-purple-600",
  "bg-slate-900",
  "bg-emerald-600",
  "bg-pink-600",
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function couleurAvatar(nom) {
  return AVATAR_PALETTE[hashString(nom || "?") % AVATAR_PALETTE.length];
}

function parseCompetences(texte) {
  if (!texte) return [];
  return texte
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function correspond(offre, profil) {
  if (!profil) return false;
  if (profil.secteursRecherches?.includes(offre.secteurActivite)) return true;
  if (profil.villesRecherchees?.includes(offre.villeEntreprise)) return true;
  if (profil.modalitesTravailSouhaitees?.includes(offre.modeTravail))
    return true;
  return false;
}

const MODE_BADGE_CLASSES = {
  distance: "bg-success/15 text-green-700",
  hybride: "bg-info/15 text-blue-700",
  presentiel: "bg-muted text-muted-foreground",
};

export default function OffresRecommandeesCard({ profil }) {
  const { t } = useTranslation();
  const { data: offres } = useOffres();

  const recommandees = (() => {
    if (!offres) return [];
    const correspondantes = offres.filter((o) => correspond(o, profil));
    const base = correspondantes.length > 0 ? correspondantes : offres;
    return [...base]
      .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
      .slice(0, 3);
  })();

  if (recommandees.length === 0) return null;

  return (
    <div className="rounded-[20px] border border-border bg-card p-6 shadow-[0_2px_10px_-4px_rgba(17,24,39,0.08)] transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(17,24,39,0.12)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">
          {t("dashboard.recommendedOffers.title")}
        </h3>
        <Link
          href="/offres"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          {t("dashboard.recommendedOffers.viewAll")}{" "}
          <FiArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {recommandees.map((offre, i) => {
          const modeBadgeClass = MODE_BADGE_CLASSES[offre.modeTravail];
          const modeBadgeLabel = offre.modeTravail
            ? t(`workMode.${offre.modeTravail}`)
            : null;
          const competences = parseCompetences(offre.competencesRequises);

          return (
            <motion.div
              key={offre.idOffre}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08, ease: "easeOut" }}
              whileHover={{ y: -5 }}
              className="rounded-md border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <Link href={`/offres/${offre.idOffre}`} className="block">
                <div className="mb-2.5 flex items-center gap-2.5">
                  {offre.logoUrl ? (
                    <img
                      src={offre.logoUrl}
                      alt={offre.nomEntreprise || "Logo"}
                      className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${couleurAvatar(offre.nomEntreprise)}`}
                    >
                      {offre.nomEntreprise?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {offre.titre}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {offre.nomEntreprise}
                    </p>
                  </div>
                </div>

                <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
                  {offre.villeEntreprise && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <FiMapPin className="h-3 w-3" />
                      {offre.villeEntreprise}
                    </span>
                  )}
                  {modeBadgeClass && (
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${modeBadgeClass}`}
                    >
                      {modeBadgeLabel}
                    </span>
                  )}
                </div>

                {competences.length > 0 && (
                  <div className="flex flex-wrap gap-1">
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
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
