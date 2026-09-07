"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { motion, useReducedMotion } from "framer-motion";
import { Briefcase, GraduationCap } from "lucide-react";
import { getInitials, avatarColor } from "./messageUtils";
import { getStatutAffichage, STATUT_CONFIG } from "../../stageUtils";

export default function ChatHeader({ stage }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const fullName =
    `${stage?.prenom || ""} ${stage?.nom || ""}`.trim() ||
    t("suivi.common.intern");
  const initials = getInitials(stage?.prenom, stage?.nom);
  const color = avatarColor(fullName);
  const statutKey = getStatutAffichage(stage, null);
  const config = STATUT_CONFIG[statutKey] || STATUT_CONFIG.en_cours;
  const statusLabel = t(config.labelKey);

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
      className="flex items-start gap-3 border-b border-border/70 bg-card px-4 py-3 sm:px-5"
    >
      {stage?.photoProfilUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stage.photoProfilUrl}
          alt=""
          className="size-11 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: color }}
          aria-hidden
        >
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {fullName}
          </h3>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.color}`}
          >
            {statusLabel}
          </span>
        </div>
        {stage?.titrePoste && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Briefcase className="size-3 shrink-0" aria-hidden />
            {stage.titrePoste}
          </p>
        )}
        {stage?.nomUniversite && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <GraduationCap className="size-3 shrink-0" aria-hidden />
            {stage.nomUniversite}
          </p>
        )}
      </div>
    </motion.header>
  );
}
