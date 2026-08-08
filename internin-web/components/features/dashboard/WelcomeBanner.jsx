"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiEdit2, FiCheckCircle } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

// En-tête "Hero" du tableau de bord stagiaire : nom, établissement, niveau,
// barre de progression du profil, avatar + badge vérifié + bouton d'édition.
// L'illustration est une composition SVG décorative (pas d'image externe),
// pour rester cohérente avec la charte de couleurs (turquoise/violet).
export default function WelcomeBanner({
  prenom,
  nomEtablissement,
  niveau,
  score = 0,
  photoProfilUrl,
  emailVerifie,
}) {
  const { t } = useTranslation();
  const initiale = (prenom?.charAt(0) || "?").toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex flex-col gap-6 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0F172A] via-[#134E4A] to-[#0F9C8C] p-7 text-white shadow-[0_10px_30px_-10px_rgba(15,23,42,0.35)] sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Illustration décorative en arrière-plan */}
      <svg
        className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-20 sm:opacity-25"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="100" fill="url(#grad)" />
        <circle cx="60" cy="70" r="26" fill="white" fillOpacity="0.25" />
        <circle cx="140" cy="130" r="14" fill="white" fillOpacity="0.35" />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bloc texte + progression */}
      <div className="relative z-10 min-w-0 flex-1">
        <h2 className="text-2xl font-bold">
          {t("dashboard.welcome.greeting", { name: prenom })}
        </h2>
        {(nomEtablissement || niveau) && (
          <p className="mt-1 text-sm text-white/80">
            {[niveau, nomEtablissement].filter(Boolean).join(" · ")}
          </p>
        )}

        <p className="mt-4 text-sm font-medium text-white/90">
          {t("dashboard.welcome.completeProfile", { score })}
        </p>
        <div className="mt-2 h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-white/20">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#5EEAD4] to-[#8B5CF6]"
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
          />
        </div>
      </div>

      {/* Bloc avatar + badge + bouton */}
      <div className="relative z-10 flex flex-shrink-0 items-center gap-4">
        <div className="relative">
          {photoProfilUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoProfilUrl}
              alt={prenom}
              className="h-16 w-16 rounded-full border-2 border-white/40 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-[#14b8a6] text-xl font-bold text-white">
              {initiale}
            </div>
          )}
          {emailVerifie && (
            <span
              title={t("dashboard.welcome.verifiedAccount")}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white"
            >
              <FiCheckCircle className="h-5 w-5 text-[#14b8a6]" />
            </span>
          )}
        </div>

        <Link
          href="/profil"
          className="flex items-center gap-1.5 rounded-sm bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
        >
          <FiEdit2 className="h-4 w-4" />
          {t("dashboard.welcome.editProfile")}
        </Link>
      </div>
    </motion.div>
  );
}
