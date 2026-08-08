"use client";
// Statistiques rapides du dashboard stagiaire — version "cartes modernes" :
// gradient léger, icône circulaire, ombre douce, effet hover, apparition en
// cascade et compteur animé (0 -> valeur).
//
// Écart assumé : "Offres enregistrées" n'a pas encore de données réelles
// (pas de fonctionnalité favoris dans le schéma actuel) — affiché en
// version "Bientôt disponible", comme "Messages" l'était déjà.

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiBriefcase,
  FiHeart,
  FiCalendar,
  FiAward,
} from "react-icons/fi";
import { useMesCandidatures } from "@/lib/queries/useMesCandidatures";
import { useMesEntretiens } from "@/lib/queries/useEntretiens";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Anime un nombre de 0 jusqu'à `value` sur ~900ms (aucune dépendance en plus).
function AnimatedCounter({ value }) {
  const [affiche, setAffiche] = useState(0);

  useEffect(() => {
    if (typeof value !== "number") return;
    let frame;
    const duree = 900;
    const debut = performance.now();

    function tick(maintenant) {
      const progres = Math.min((maintenant - debut) / duree, 1);
      const ease = 1 - Math.pow(1 - progres, 3); // ease-out cubic
      setAffiche(Math.round(ease * value));
      if (progres < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{typeof value === "number" ? affiche : value}</>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" },
  }),
};

function StatCard({
  index,
  icon: Icon,
  value,
  label,
  sublabel,
  gradient,
  iconBg,
  indisponible,
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={indisponible ? undefined : { y: -4 }}
      className={`rounded-[20px] border border-border bg-card bg-gradient-to-br ${gradient} p-5 shadow-[0_2px_10px_-4px_rgba(17,24,39,0.08)] transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(17,24,39,0.12)] ${indisponible ? "opacity-60" : ""}`}
    >
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold text-foreground">
        <AnimatedCounter value={value} />
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{label}</div>
      {sublabel && (
        <div className="mt-0.5 text-xs text-muted-foreground">{sublabel}</div>
      )}
    </motion.div>
  );
}

export default function QuickStatsGrid() {
  const { t } = useTranslation();
  const { data: candidatures } = useMesCandidatures();
  const { data: entretiens } = useMesEntretiens();

  const nbCandidatures = candidatures?.length ?? 0;

  // Figé au montage (initialiseur paresseux), donc calculé une seule fois —
  // pas besoin de recalculer "maintenant" à chaque rendu.
  const [maintenant] = useState(() => Date.now());

  const nbCandidaturesSemaine = useMemo(() => {
    return (
      candidatures?.filter((c) => {
        const jours =
          (maintenant - new Date(c.dateCandidature).getTime()) / 86_400_000;
        return jours <= 7;
      }).length ?? 0
    );
  }, [candidatures, maintenant]);

  const nbEntreprisesConsultees = candidatures
    ? new Set(candidatures.map((c) => c.nomEntreprise)).size
    : 0;

  const nbEntretiens = entretiens?.length ?? 0;

  const nbStagesObtenus =
    candidatures?.filter((c) => c.statut === "acceptee").length ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard
        index={0}
        icon={FiFileText}
        value={nbCandidatures}
        label={t("dashboard.quickStats.applications")}
        sublabel={
          nbCandidaturesSemaine > 0
            ? t("dashboard.quickStats.thisWeek", { n: nbCandidaturesSemaine })
            : null
        }
        gradient="from-teal-500/[0.10] to-transparent"
        iconBg="bg-[#14b8a6] text-white"
      />
      <StatCard
        index={1}
        icon={FiBriefcase}
        value={nbEntreprisesConsultees}
        label={t("dashboard.quickStats.companiesViewed")}
        gradient="from-blue-500/[0.10] to-transparent"
        iconBg="bg-blue-500 text-white"
      />
      <StatCard
        index={2}
        icon={FiHeart}
        value="—"
        label={t("dashboard.quickStats.savedOffers")}
        sublabel={t("dashboard.quickStats.comingSoon")}
        gradient="from-pink-500/[0.10] to-transparent"
        iconBg="bg-pink-500 text-white"
        indisponible
      />
      <StatCard
        index={3}
        icon={FiCalendar}
        value={nbEntretiens}
        label={t("dashboard.quickStats.interviews")}
        gradient="from-violet-500/[0.10] to-transparent"
        iconBg="bg-[#8B5CF6] text-white"
      />
      <StatCard
        index={4}
        icon={FiAward}
        value={nbStagesObtenus}
        label={t("dashboard.quickStats.internshipsObtained")}
        gradient="from-amber-500/[0.10] to-transparent"
        iconBg="bg-amber-500 text-white"
      />
    </div>
  );
}
