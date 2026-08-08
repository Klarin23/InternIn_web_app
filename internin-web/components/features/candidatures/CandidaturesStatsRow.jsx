"use client";
// Rangée de statistiques du centre de candidatures : Total / En attente /
// Consultées / Entretiens / Réponses — dérivées uniquement des statuts
// réellement gérés par le backend (via getAffichage, logique inchangée).

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiClock,
  FiEye,
  FiCalendar,
  FiCheckSquare,
} from "react-icons/fi";
import { getAffichage } from "@/lib/candidatures/statut";
import { useTranslation } from "@/lib/i18n/useTranslation";

function AnimatedCounter({ value }) {
  const [affiche, setAffiche] = useState(0);

  useEffect(() => {
    let frame;
    const duree = 800;
    const debut = performance.now();
    function tick(maintenant) {
      const progres = Math.min((maintenant - debut) / duree, 1);
      const ease = 1 - Math.pow(1 - progres, 3);
      setAffiche(Math.round(ease * value));
      if (progres < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{affiche}</>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.07, ease: "easeOut" },
  }),
};

function StatCard({ index, icon: Icon, value, label, iconBg }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3 }}
      className="rounded-md border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xl font-bold text-foreground">
        <AnimatedCounter value={value} />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </motion.div>
  );
}

export default function CandidaturesStatsRow({ candidatures, entretiens }) {
  const { t, locale } = useTranslation();
  const liste = candidatures || [];

  const compte = liste.reduce(
    (acc, c) => {
      const { label } = getAffichage(c, entretiens);
      if (label === "En attente") acc.enAttente++;
      else if (label === "Consultée") acc.consultees++;
      else if (label === "Entretien") acc.entretiens++;
      else if (label === "Accepté" || label === "Refusé") acc.reponses++;
      return acc;
    },
    { enAttente: 0, consultees: 0, entretiens: 0, reponses: 0 },
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <StatCard
        index={0}
        icon={FiFileText}
        value={liste.length}
        label={t("candidatures.stats.total")}
        iconBg="bg-[#14b8a6] text-white"
      />
      <StatCard
        index={1}
        icon={FiClock}
        value={compte.enAttente}
        label={t("candidatures.stats.pending")}
        iconBg="bg-amber-500 text-white"
      />
      <StatCard
        index={2}
        icon={FiEye}
        value={compte.consultees}
        label={t("candidatures.stats.viewed")}
        iconBg="bg-blue-500 text-white"
      />
      <StatCard
        index={3}
        icon={FiCalendar}
        value={compte.entretiens}
        label={t("candidatures.stats.interviews")}
        iconBg="bg-[#8B5CF6] text-white"
      />
      <StatCard
        index={4}
        icon={FiCheckSquare}
        value={compte.reponses}
        label={t("candidatures.stats.responses")}
        iconBg="bg-slate-700 text-white"
      />
    </div>
  );
}
