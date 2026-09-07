"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import ProfilSectionCard from "@/components/features/profil/ProfilSectionCard";

export default function DomainesActiviteSection({ profil, onModifier }) {
  const { t } = useTranslation();
  return (
    <ProfilSectionCard title={t("profilEntreprise.activityAreas.title")} onEdit={onModifier}>
      {profil.secteurActivite ? (
        <span className="inline-block rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary">
          {profil.secteurActivite}
        </span>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("profilEntreprise.activityAreas.empty")}{" "}{" "}
          <button
            type="button"
            onClick={onModifier}
            className="text-primary hover:underline"
          >
            En ajouter un
          </button>
        </p>
      )}
    </ProfilSectionCard>
  );
}
