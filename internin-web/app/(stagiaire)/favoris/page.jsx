"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, ArrowRight, AlertTriangle } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import FavoriteButton from "@/components/features/offres/FavoriteButton";
import { useFavoris } from "@/lib/queries/useFavoris";
import { parseCompetences } from "@/lib/constants/offres";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

const LOCALE_MAP = { fr: "fr-FR", en: "en-GB" };

function formatRelative(dateStr, t, locale = "fr") {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return t("stagiaireSpace.favorites.today");
  if (days === 1) return t("stagiaireSpace.favorites.yesterday");
  if (days < 7) return t("stagiaireSpace.favorites.daysAgo", { count: days });
  return d.toLocaleDateString(LOCALE_MAP[locale] || "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FavorisPage() {
  const { t, locale } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useFavoris();
  const reduceMotion = useReducedMotion();
  const [sort, setSort] = useState("recent");

  const list = useMemo(() => {
    const arr = Array.isArray(data) ? [...data] : [];
    if (sort === "ancien") {
      arr.sort((a, b) => new Date(a.dateAjout) - new Date(b.dateAjout));
    } else {
      arr.sort((a, b) => new Date(b.dateAjout) - new Date(a.dateAjout));
    }
    return arr;
  }, [data, sort]);

  const countLabel =
    list.length === 1
      ? t("stagiaireSpace.favorites.countOne", { count: list.length })
      : t("stagiaireSpace.favorites.countOther", { count: list.length });

  return (
    <>
      <AppHeader
        title={t("stagiaireSpace.favorites.title")}
        subtitle={t("stagiaireSpace.favorites.subtitle")}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <p className="text-sm text-muted-foreground">
            {isLoading ? t("stagiaireSpace.favorites.loading") : countLabel}
          </p>
          {list.length > 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSort("recent")}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  sort === "recent"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {t("stagiaireSpace.favorites.sortRecent")}
              </button>
              <button
                type="button"
                onClick={() => setSort("ancien")}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  sort === "ancien"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {t("stagiaireSpace.favorites.sortOldest")}
              </button>
            </div>
          )}
        </motion.div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl bg-muted/70"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
            <p className="font-semibold">
              {t("stagiaireSpace.favorites.loadError")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error?.message || t("stagiaireSpace.favorites.loadErrorHint")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg"
              onClick={() => refetch()}
            >
              {t("stagiaireSpace.favorites.retry")}
            </Button>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-500">
              <Heart className="size-7" strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 text-base font-semibold">
              {t("stagiaireSpace.favorites.emptyForNow")}
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              {t("stagiaireSpace.favorites.emptyDesc")}
            </p>
            <Button asChild className="mt-5 rounded-lg">
              <Link href="/offres">
                {t("stagiaireSpace.favorites.exploreOffers")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {list.map((offre, index) => {
                const skills = parseCompetences(offre.competencesRequises).slice(
                  0,
                  4,
                );
                const indispo = offre.statut && offre.statut !== "publie";
                return (
                  <motion.article
                    key={offre.idOffre}
                    layout
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduceMotion
                        ? undefined
                        : { opacity: 0, scale: 0.98 }
                    }
                    transition={{
                      duration: 0.22,
                      delay: reduceMotion
                        ? 0
                        : Math.min(index * 0.04, 0.16),
                    }}
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:border-border hover:shadow-md"
                  >
                    <div className="absolute right-3 top-3">
                      <FavoriteButton
                        idOffre={offre.idOffre}
                        isFavorite
                        size="sm"
                      />
                    </div>

                    <div className="flex items-start gap-3 pr-8">
                      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                        {offre.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={offre.logoUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">
                            {offre.nomEntreprise?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-foreground">
                          {offre.titre}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {offre.nomEntreprise}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {(offre.villeEntreprise || offre.paysEntreprise) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {[offre.villeEntreprise, offre.paysEntreprise]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                      {offre.dureeStage && <span>{offre.dureeStage}</span>}
                      {offre.modeTravail && <span>{offre.modeTravail}</span>}
                    </div>

                    {skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {indispo && (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                        <AlertTriangle
                          className="h-3.5 w-3.5 shrink-0 text-amber-500"
                          aria-hidden
                        />
                        {t("stagiaireSpace.favorites.unavailable")}
                      </p>
                    )}

                    <p className="mt-3 text-[11px] text-muted-foreground">
                      {t("stagiaireSpace.favorites.added", {
                        when: formatRelative(offre.dateAjout, t, locale),
                      })}
                    </p>

                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="mt-4 w-full gap-1.5 rounded-lg"
                    >
                      <Link href={`/offres/${offre.idOffre}`}>
                        {t("stagiaireSpace.favorites.viewOffer")}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}
