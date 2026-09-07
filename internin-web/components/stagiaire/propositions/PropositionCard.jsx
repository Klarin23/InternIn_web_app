"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  MapPin,
  Clock,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import {
  STATUT_META,
  canRespond,
  relativeTime,
  locationLabel,
} from "./propositionUtils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

export default function PropositionCard({ prop, onOpen, index = 0 }) {
  const { t, locale } = useTranslation();
  const reduce = useReducedMotion();
  const meta = STATUT_META[prop.statut] || STATUT_META.annulee;
  const loc = locationLabel(prop);
  const isNew = prop.statut === "envoyee";

  return (
    <motion.article
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.98, y: 8 }}
      transition={{
        duration: reduce ? 0 : 0.28,
        delay: reduce ? 0 : Math.min(index * 0.05, 0.25),
      }}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border p-5 transition-all duration-200",
        meta.cardAccent,
        "hover:-translate-y-1 hover:shadow-md hover:border-primary/35",
        isNew && "ring-1 ring-primary/15",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            meta.className,
          )}
        >
          {isNew && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          )}
          {t(meta.labelKey)}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-3">
        {prop.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prop.logoUrl}
            alt=""
            className="h-11 w-11 rounded-xl border border-border object-cover bg-muted"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
            <Building2 className="h-5 w-5" aria-hidden />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {prop.nomEntreprise || t("stagiaireSpace.propositions.companyFallback")}
          </p>
          {prop.secteurActivite && (
            <p className="truncate text-xs text-muted-foreground">
              {prop.secteurActivite}
            </p>
          )}
        </div>
      </div>

      <h3 className="mb-2 text-base font-semibold leading-snug text-foreground">
        {prop.titreOffre || t("stagiaireSpace.propositions.proposalFallback")}
      </h3>

      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        {loc && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {loc}
          </span>
        )}
        {prop.dureeStage && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {prop.dureeStage}
          </span>
        )}
        {prop.modeTravail && (
          <span className="inline-flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {prop.modeTravail}
          </span>
        )}
      </div>

      {(prop.message || prop.descriptionOffre) && (
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {prop.message || prop.descriptionOffre}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <p className="text-[11px] text-muted-foreground">
          {relativeTime(prop.dateCreation, t, locale)}
        </p>
        <button
          type="button"
          onClick={() => onOpen(prop)}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition group-hover:gap-1.5"
        >
          {t("stagiaireSpace.propositions.viewProposal")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </motion.article>
  );
}
