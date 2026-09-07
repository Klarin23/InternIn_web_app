"use client";
// Carte de candidature redessinée : logo, titre, entreprise, localisation,
// mode de travail, badge de statut, timeline compacte, date, actions.
// `maintenant` est reçu en prop (figé au montage du parent) pour rester une
// fonction pure — pas de Date.now() dans le rendu.

import Link from "next/link";
import { motion } from "framer-motion";
import { FiMapPin, FiEye } from "react-icons/fi";
import { Undo2 } from "lucide-react";
import CandidatureTimeline from "./CandidatureTimeline";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getAffichage,
  formatDate,
  formatDepuis,
  peutRetirerCandidature,
  MOTIFS_RETRAIT_LABELS,
} from "@/lib/candidatures/statut";

const MODE_LABEL_KEYS = {
  distance: "candidatures.modes.remote",
  hybride: "candidatures.modes.hybrid",
  presentiel: "candidatures.modes.onsite",
};

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

export default function CandidatureCard({
  candidature,
  entretiens,
  offreFinale,
  maintenant,
  index = 0,
  onVoirSuivi,
  onRetirer,
}) {
  const { t, locale } = useTranslation();
  const affichage = getAffichage(candidature, entretiens, offreFinale, {
    t,
    locale: locale === "en" ? "en-GB" : "fr-FR",
  });
  const StatutIcon = affichage.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="rounded-md border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {candidature.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidature.logoUrl}
            alt={candidature.nomEntreprise}
            className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${AVATAR_PALETTE[hashString(candidature.nomEntreprise || "?") % AVATAR_PALETTE.length]}`}
          >
            {candidature.nomEntreprise?.charAt(0) || "?"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {candidature.titre}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {candidature.nomEntreprise}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {candidature.villeEntreprise && (
              <span className="flex items-center gap-1">
                <FiMapPin className="h-3 w-3" />
                {candidature.villeEntreprise}
              </span>
            )}
            {candidature.modeTravail && (
              <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                {t(
                  MODE_LABEL_KEYS[candidature.modeTravail] ??
                    "candidatures.modes.onsite",
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${affichage.className}`}
      >
        <StatutIcon className="h-3.5 w-3.5" />
        {affichage.label}
      </div>

      <div className="mt-3">
        <CandidatureTimeline
          candidature={candidature}
          entretiens={entretiens}
          compact
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {t("candidatures.card.sentOn", {
          date: formatDate(candidature.dateCandidature, false, locale),
        })}{" "}
        {formatDepuis(candidature.dateCandidature, maintenant, t)}
      </p>

      {candidature.statut === "retiree" && (
        <div className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            {t("candidatures.status.withdrawn.label")}
          </p>
          {affichage.detail && (
            <p className="mt-0.5">{affichage.detail}</p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/offres/${candidature.idOffre}`}
            className="group flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-[#14b8a6] hover:text-[#14b8a6]"
          >
            {t("candidatures.card.viewOffer")}
          </Link>
          <button
            type="button"
            onClick={() => onVoirSuivi(candidature)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-[#14b8a6] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0d9488]"
          >
            <FiEye className="h-3.5 w-3.5" />
            {t("candidatures.card.viewTracking")}
          </button>
        </div>
        {peutRetirerCandidature(candidature) && onRetirer && (
          <button
            type="button"
            onClick={() => onRetirer(candidature)}
            className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-slate-400 hover:bg-muted/50 hover:text-foreground"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden />
            {t("candidatures.withdraw.button")}
          </button>
        )}
      </div>
    </motion.div>
  );
}
