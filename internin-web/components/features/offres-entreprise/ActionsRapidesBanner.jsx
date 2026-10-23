"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Mail, Calendar } from "lucide-react";

function estAujourdhui(date, now) {
  return new Date(date).toDateString() === new Date(now).toDateString();
}

const ICONES = {
  expire: AlertTriangle,
  candidatures: Mail,
  entretiens: Calendar,
};

const ICON_COLORS = {
  expire: "text-amber-600",
  candidatures: "text-primary",
  entretiens: "text-sky-600",
};

export default function ActionsRapidesBanner({ offres, candidatures, entretiens }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(null);

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    const timeout = window.setTimeout(updateNow, 0);
    const interval = window.setInterval(updateNow, 60_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  const offresExpirentBientot = (offres || []).filter((o) => {
    if (now === null || o.statut !== "publie" || !o.dateLimiteCandidature) return false;
    const millisecondesRestantes = new Date(o.dateLimiteCandidature).getTime() - now;
    const jours = Math.ceil(millisecondesRestantes / 86400000);
    return Number.isFinite(millisecondesRestantes) && millisecondesRestantes >= 0 && jours <= 7;
  }).length;

  const nouvellesCandidatures = (candidatures || []).filter(
    (c) => c.statut === "soumise",
  ).length;

  const entretiensAujourdhui = (entretiens || []).filter(
    (e) => now !== null && e.statut === "planifie" && estAujourdhui(e.dateHeure, now),
  ).length;

  const alertes = [
    offresExpirentBientot > 0 && {
      key: "expire",
      texte: t(
        offresExpirentBientot > 1
          ? "entrepriseSpace.offers.bannerExpireWeekOther"
          : "entrepriseSpace.offers.bannerExpireWeekOne",
        { count: offresExpirentBientot },
      ),
    },
    nouvellesCandidatures > 0 && {
      key: "candidatures",
      texte: t(
        nouvellesCandidatures > 1
          ? "entrepriseSpace.offers.bannerNewAppsOther"
          : "entrepriseSpace.offers.bannerNewAppsOne",
        { count: nouvellesCandidatures },
      ),
    },
    entretiensAujourdhui > 0 && {
      key: "entretiens",
      texte: t(
        entretiensAujourdhui > 1
          ? "entrepriseSpace.offers.bannerInterviewsTodayOther"
          : "entrepriseSpace.offers.bannerInterviewsTodayOne",
        { count: entretiensAujourdhui },
      ),
    },
  ].filter(Boolean);

  if (alertes.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-6 flex flex-wrap gap-3 overflow-hidden"
      >
        {alertes.map((a) => {
          const Icon = ICONES[a.key] || AlertTriangle;
          const iconColor = ICON_COLORS[a.key] || "text-muted-foreground";
          return (
            <div
              key={a.key}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-sm"
            >
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${iconColor}`}
                aria-hidden
              />
              {a.texte}
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
