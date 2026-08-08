"use client";
import Link from "next/link";
import { FiArrowRight, FiInbox } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUT_COLORS = {
  soumise: "bg-muted text-muted-foreground",
  consultee: "bg-[#DBEAFE] text-[#1D4ED8]",
  preselectionnee: "bg-accent/40 text-amber-700",
  rejetee: "bg-destructive/10 text-destructive",
  retiree: "bg-muted text-muted-foreground",
  acceptee: "bg-success/10 text-green-700",
};

const AVATAR_COLORS = [
  "#14B8A6",
  "#8B5CF6",
  "#F97316",
  "#3B82F6",
  "#EC4899",
  "#22C55E",
  "#EAB308",
  "#06B6D4",
];

function couleurAvatar(nom) {
  if (!nom) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < nom.length; i++) {
    hash = nom.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initiale(nom) {
  return (nom?.charAt(0) || "?").toUpperCase();
}

// Même logique que la page /candidatures : si un entretien encore à venir
// est lié à la candidature, on affiche "Entretien" plutôt que le statut brut.
function getAffichage(candidature, entretiens, t) {
  const entretienLie = entretiens?.find(
    (e) => e.idCandidature === candidature.idCandidature,
  );
  if (
    entretienLie &&
    ["planifie", "valide", "reprogramme"].includes(entretienLie.statut)
  ) {
    return {
      label: t("applicationStatus.interview"),
      color: "bg-[#EDE9FE] text-[#6D28D9]",
    };
  }
  if (entretienLie && ["confirme", "termine"].includes(entretienLie.statut)) {
    return {
      label: t("applicationStatus.selected"),
      color: "bg-success/10 text-green-700",
    };
  }
  return {
    label: t(`applicationStatus.${candidature.statut}`),
    color: STATUT_COLORS[candidature.statut],
  };
}

export default function DernieresCandidaturesCard({
  candidatures,
  entretiens,
}) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";
  const dernieres = [...(candidatures || [])]
    .sort((a, b) => new Date(b.dateCandidature) - new Date(a.dateCandidature))
    .slice(0, 4);

  return (
    <div className="rounded-[20px] border border-border bg-card p-6 shadow-[0_2px_10px_-4px_rgba(17,24,39,0.08)] transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(17,24,39,0.12)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">
          {t("dashboard.recentApplications.title")}
        </h3>
        <Link
          href="/candidatures"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          {t("dashboard.recentApplications.viewAll")}{" "}
          <FiArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {dernieres.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <FiInbox className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("dashboard.recentApplications.empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {dernieres.map((c) => {
            const affichage = getAffichage(c, entretiens, t);
            return (
              <li
                key={c.idCandidature}
                className="flex items-center justify-between gap-3 rounded-sm px-1 py-2.5 transition hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: couleurAvatar(c.nomEntreprise) }}
                  >
                    {initiale(c.nomEntreprise)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {c.titre}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.nomEntreprise} ·{" "}
                      {new Date(c.dateCandidature).toLocaleDateString(
                        dateLocale,
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${affichage.color}`}
                >
                  {affichage.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
