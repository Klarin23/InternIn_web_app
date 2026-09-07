"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { Clock, Flame, Star } from "lucide-react";

function calculerBadges(offre, seuilPopulaire, t) {
  const badges = [];

  if (offre.dateLimiteCandidature && offre.statut === "publie") {
    const joursRestants = Math.ceil(
      (new Date(offre.dateLimiteCandidature) - new Date()) / 86400000,
    );
    if (joursRestants >= 0 && joursRestants <= 3) {
      badges.push({
        key: "expire",
        Icon: Clock,
        label:
          joursRestants === 0
            ? t("entrepriseSpace.offers.expiresToday")
            : t("entrepriseSpace.offers.expiresInDays", {
                count: joursRestants,
              }),
        className:
          "bg-destructive/10 text-destructive border-destructive/20",
        iconClassName: "text-destructive",
      });
    }
  }

  if (offre.nombreCandidatures >= seuilPopulaire) {
    badges.push({
      key: "populaire",
      Icon: Flame,
      label: t("entrepriseSpace.offers.popularOffer"),
      className:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      iconClassName: "text-amber-600 dark:text-amber-400",
    });
  }

  if (offre.dateCreation) {
    const joursDepuisCreation = Math.floor(
      (new Date() - new Date(offre.dateCreation)) / 86400000,
    );
    if (joursDepuisCreation <= 2) {
      badges.push({
        key: "nouvelle",
        Icon: Star,
        label: t("entrepriseSpace.offers.newOfferBadge"),
        className:
          "bg-primary/10 text-primary border-primary/20",
        iconClassName: "text-primary",
      });
    }
  }

  return badges;
}

export default function OffreBadgesInfo({
  offre,
  seuilPopulaire,
  compact = false,
}) {
  const { t } = useTranslation();
  const badges = calculerBadges(offre, seuilPopulaire, t);
  if (badges.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap gap-1 ${compact ? "items-center" : "flex-col items-end"}`}
    >
      {badges.map((b) => (
        <span
          key={b.key}
          title={b.label}
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${b.className}`}
        >
          <b.Icon
            className={`h-3 w-3 shrink-0 ${b.iconClassName || ""}`}
            aria-hidden
          />
          {!compact && b.label}
        </span>
      ))}
    </div>
  );
}
