"use client";
// Header animé + statistiques "À venir / Aujourd'hui / Terminés", dérivées
// uniquement des statuts réels (STATUTS_PASSES / STATUT_CONFIG, inchangés).
// `maintenant` est reçu en prop (figé au montage du parent), aucun
// Date.now() appelé pendant le rendu.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiCalendar, FiSun, FiCheckSquare } from "react-icons/fi";
import { STATUTS_PASSES } from "@/lib/entretiens/statut";
import { useTranslation } from "@/lib/i18n/useTranslation";

function AnimatedCounter({ value }) {
  const [affiche, setAffiche] = useState(0);
  useEffect(() => {
    let frame;
    const debut = performance.now();
    function tick(t) {
      const p = Math.min((t - debut) / 800, 1);
      setAffiche(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) frame = requestAnimationFrame(tick);
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
    transition: { duration: 0.35, delay: 0.15 + i * 0.08, ease: "easeOut" },
  }),
};

function StatCard({ index, icon: Icon, value, label, iconBg }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-border/70 bg-card p-4 text-center shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full ${iconBg}`}
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

export default function EntretiensHeaderStats({ entretiens, maintenant }) {
  const { t } = useTranslation();
  const liste = entretiens || [];

  const aVenir = liste.filter((e) => !STATUTS_PASSES.includes(e.statut));
  const aujourdhui = aVenir.filter(
    (e) =>
      new Date(e.dateHeure).toDateString() ===
      new Date(maintenant).toDateString(),
  );
  const termines = liste.filter((e) => STATUTS_PASSES.includes(e.statut));

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h2 className="text-2xl font-bold text-foreground">
          {t("interviews.pageTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("interviews.pageSubtitle")}
        </p>
      </motion.div>

      {liste.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard
            index={0}
            icon={FiCalendar}
            value={aVenir.length}
            label={t("interviews.stats.upcoming")}
            iconBg="bg-[#14b8a6] text-white"
          />
          <StatCard
            index={1}
            icon={FiSun}
            value={aujourdhui.length}
            label={t("interviews.stats.today")}
            iconBg="bg-amber-500 text-white"
          />
          <StatCard
            index={2}
            icon={FiCheckSquare}
            value={termines.length}
            label={t("interviews.stats.completed")}
            iconBg="bg-slate-700 text-white"
          />
        </div>
      )}
    </div>
  );
}
