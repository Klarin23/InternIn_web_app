"use client";

import ProfilSectionCard from "@/components/features/profil/ProfilSectionCard";

export default function DomainesActiviteSection({ profil, onModifier }) {
  return (
    <ProfilSectionCard title="Domaines d'activité" onEdit={onModifier}>
      {profil.secteurActivite ? (
        <span className="inline-block rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary">
          {profil.secteurActivite}
        </span>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucun domaine renseigné.{" "}
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
