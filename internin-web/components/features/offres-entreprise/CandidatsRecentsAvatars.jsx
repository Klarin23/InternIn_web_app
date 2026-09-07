"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export default function CandidatsRecentsAvatars({
  candidats,
  compact = false,
}) {
  const { t } = useTranslation();
  if (!candidats || candidats.length === 0) return null;

  const affiches = candidats.slice(0, 3);
  const reste = candidats.length - affiches.length;

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "mb-0"}`}>
      {!compact && (
        <span className="text-[11px] font-medium text-muted-foreground">
          {t("entrepriseSpace.offers.recentCandidates") || "Candidats récents"}
        </span>
      )}
      <div className="flex -space-x-2">
        {affiches.map((c) => (
          <div
            key={c.idCandidature}
            title={`${c.prenom} ${c.nom}`}
            className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-primary text-[9px] font-bold text-primary-foreground"
          >
            {c.photoProfilUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.photoProfilUrl}
                alt={`${c.prenom} ${c.nom}`}
                className="h-full w-full object-cover"
              />
            ) : (
              `${c.prenom?.[0] || ""}${c.nom?.[0] || ""}`
            )}
          </div>
        ))}
      </div>
      {reste > 0 && (
        <span className="text-[11px] font-medium text-muted-foreground">
          +{reste}{" "}
          {t("entrepriseSpace.offers.otherCandidates", { count: reste }) ||
            `autre${reste > 1 ? "s" : ""} candidat${reste > 1 ? "s" : ""}`}
        </span>
      )}
    </div>
  );
}
