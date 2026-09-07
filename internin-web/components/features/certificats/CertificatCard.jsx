"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { motion, useReducedMotion } from "framer-motion";
import { Award, Building2, Calendar, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatPeriod(debut, fin, localeCode) {
  const opts = { month: "short", year: "numeric" };
  const loc = localeCode || "fr-FR";
  const d1 = debut
    ? new Date(debut).toLocaleDateString(loc, opts)
    : null;
  const d2 = fin ? new Date(fin).toLocaleDateString(loc, opts) : null;
  if (d1 && d2) return `${d1} — ${d2}`;
  return d1 || d2 || null;
}

export default function CertificatCard({ certificat, index = 0, onOpen, previewLoading = false }) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const localeCode =
    t("stagiaireSpace.certificates.locale") ||
    (locale === "en" ? "en-GB" : "fr-FR");
  // If translation returns the key itself, fall back
  const resolvedLocale =
    localeCode.startsWith("stagiaireSpace") || !localeCode.includes("-")
      ? locale === "en"
        ? "en-GB"
        : "fr-FR"
      : localeCode;
  const periode = formatPeriod(
    certificat.dateDebut,
    certificat.dateFinReelle || certificat.dateFinPrevue,
    resolvedLocale,
  );

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.2),
      }}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:border-border hover:shadow-md"
    >
      {/* Visual certificate frame */}
      <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-primary/[0.06] via-background to-muted/40 p-6">
        <div className="flex size-full flex-col items-center justify-center rounded-xl border border-dashed border-primary/25 bg-background/80 px-4 py-6 text-center shadow-inner">
          <Award className="mb-2 size-8 text-primary" strokeWidth={1.5} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            InternIn
          </p>
          <p className="mt-2 text-sm font-bold text-foreground">
            {t("stagiaireSpace.certificates.stageCertificate")}
          </p>
          {certificat.titrePoste && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {certificat.titrePoste}
            </p>
          )}
        </div>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <ShieldCheck className="size-3" />
          {t("stagiaireSpace.certificates.verified")}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-foreground">
          {certificat.titrePoste || t("stagiaireSpace.certificates.stageCertificate")}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3.5 shrink-0" />
          {certificat.nomEntreprise || t("stagiaireSpace.certificates.company")}
        </p>
        {periode && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            {periode}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            size="sm"
            className="flex-1 rounded-lg gap-1.5"
            disabled={previewLoading}
            onClick={() => onOpen?.(certificat)}
          >
            {previewLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t("stagiaireSpace.certificates.previewLoading")}
              </>
            ) : (
              t("stagiaireSpace.certificates.preview")
            )}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
