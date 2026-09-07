"use client";

// Liste des offres de l'entreprise, avec badge de statut et compteur de
// candidatures. Le clic mène vers la page de détail — pas encore construite
// côté entreprise (gestion des candidats par offre), prochain chantier logique.

import { FiInbox, FiUsers } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

// STATUT_LABELS défini dans le composant (traduit).
const STATUT_COLORS = {
  brouillon: "bg-muted text-muted-foreground",
  publie: "bg-primary/10 text-primary",
  ferme: "bg-destructive/10 text-destructive",
  archive: "bg-muted text-muted-foreground",
};

export default function OffresList({ offres }) {
  const { t } = useTranslation();
  const STATUT_LABELS = {
    brouillon: t("entrepriseSpace.offers.statusDraft"),
    publie: t("entrepriseSpace.offers.offreListStatusPublished"),
    ferme: t("entrepriseSpace.offers.statusClosed"),
    archive: t("entrepriseSpace.offers.statusArchived"),
  };

  if (offres.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-14 text-center">
        <FiInbox className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          {t("entrepriseSpace.offers.offreListEmptyTitle")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("entrepriseSpace.offers.offreListEmptyDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offres.map((offre) => (
        <div
          key={offre.idOffre}
          className="flex items-center justify-between rounded-md border border-border bg-card p-4"
        >
          <div>
            <h5 className="font-semibold text-foreground">{offre.titre}</h5>
            <p className="text-sm text-muted-foreground">
              {t(offre.nombrePostes > 1 ? "entrepriseSpace.offers.positionCountOther" : "entrepriseSpace.offers.positionCountOne", { count: offre.nombrePostes })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <FiUsers className="h-4 w-4 text-muted-foreground" />
              {offre.nombreCandidatures}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUT_COLORS[offre.statut]}`}
            >
              {STATUT_LABELS[offre.statut]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
