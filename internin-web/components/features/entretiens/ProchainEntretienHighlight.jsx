"use client";
// Section "Prochain entretien" mise en avant — visuellement plus
// importante que les cartes classiques. N'affiche que des informations
// réellement disponibles (aucune heure de fin, aucun lieu inventés).
// Bouton "Rejoindre" affiché seulement si statut === "confirme" ET
// mode vidéo ET lien réel présent — condition identique à
// EntretienCardStagiaire.jsx. Idem pour Appeler/Voir l'adresse.

import { motion } from "framer-motion";
import { FiCalendar, FiClock, FiMapPin, FiVideo, FiPhone } from "react-icons/fi";
import {
  STATUT_CONFIG,
  formatJourRelatif,
  formatHeure,
  formatCompteARebours,
  buildLienGoogleCalendar,
} from "@/lib/entretiens/statut";
import { useTranslation } from "@/lib/i18n/useTranslation";

const MODE_LABEL_KEYS = {
  video: "interviews.modes.video",
  telephone: "interviews.modes.phoneCall",
  presentiel: "interviews.modes.onsite",
};

export default function ProchainEntretienHighlight({ entretien, maintenant, onVoirDetails }) {
  const { t, locale } = useTranslation();
  if (!entretien) return null;

  const date = new Date(entretien.dateHeure);
  const config = STATUT_CONFIG[entretien.statut];
  const compteARebours = formatCompteARebours(date, maintenant, t);
  const peutRejoindre =
    entretien.statut === "confirme" &&
    entretien.modeEntretien === "video" &&
    !!entretien.lienGoogleMeet;
  const peutAppeler =
    entretien.statut === "confirme" &&
    entretien.modeEntretien === "telephone" &&
    !!entretien.lienGoogleMeet;
  const peutVoirAdresse =
    entretien.statut === "confirme" &&
    entretien.modeEntretien === "presentiel" &&
    !!entretien.lienGoogleMeet;
  const lienMaps = entretien.lienGoogleMeet
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entretien.lienGoogleMeet)}`
    : null;
  const lienCalendrier =
    entretien.statut === "confirme" ? buildLienGoogleCalendar(entretien) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
      className="relative overflow-hidden rounded-md bg-linear-to-br from-[#0F172A] via-[#134E4A] to-[#0F9C8C] p-6 text-white"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        {t("interviews.next.title")}
      </span>

      <h3 className="mt-3 text-xl font-bold">{entretien.titreOffre}</h3>
      <p className="text-sm text-white/80">{entretien.nomEntreprise}</p>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
        <span className="flex items-center gap-1.5">
          <FiCalendar className="h-4 w-4" />
          {formatJourRelatif(date, maintenant, locale, t)}
        </span>
        <span className="flex items-center gap-1.5">
          <FiClock className="h-4 w-4" />
          {formatHeure(date, locale)}
        </span>
        <span className="flex items-center gap-1.5">
          <FiMapPin className="h-4 w-4" />
          {t(MODE_LABEL_KEYS[entretien.modeEntretien])}
        </span>
      </div>

      {compteARebours && (
        <p className="mt-2 text-xs font-medium text-white/70">
          ⏱ {compteARebours}
        </p>
      )}

      <div
        className={`mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold ${config.className}`}
      >
        <config.Icon className="h-3.5 w-3.5" />
        {t(config.badgeKey)}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onVoirDetails(entretien)}
          className="rounded-sm bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 active:scale-95"
        >
          {t("interviews.next.details")}
        </button>
        {peutRejoindre && (
          <a
            href={entretien.lienGoogleMeet}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-sm bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] transition hover:bg-white/90 active:scale-95"
          >
            <FiVideo className="h-4 w-4" />
            {t("interviews.next.join")}
          </a>
        )}
        {peutAppeler && (
          <a
            href={`tel:${entretien.lienGoogleMeet.replace(/\s+/g, "")}`}
            className="flex items-center gap-1.5 rounded-sm bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] transition hover:bg-white/90 active:scale-95"
          >
            <FiPhone className="h-4 w-4" />
            {t("interviews.actions.call")}
          </a>
        )}
        {peutVoirAdresse && (
          <a
            href={lienMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-sm bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] transition hover:bg-white/90 active:scale-95"
          >
            <FiMapPin className="h-4 w-4" />
            {t("interviews.actions.viewAddress")}
          </a>
        )}
        {lienCalendrier && (
          <a
            href={lienCalendrier}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-sm bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 active:scale-95"
          >
            <FiCalendar className="h-4 w-4" />
            {t("interviews.actions.addToCalendar")}
          </a>
        )}
      </div>
    </motion.div>
  );
}