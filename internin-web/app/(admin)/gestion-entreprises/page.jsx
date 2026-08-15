"use client";

import { useMemo, useState } from "react";
import { FiLoader, FiBriefcase, FiCheck } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import EntrepriseFiltresTabs from "@/components/features/gestion-entreprises/EntrepriseFiltresTabs";
import EntrepriseDetailPanel from "@/components/features/gestion-entreprises/EntrepriseDetailPanel";
import { useToutesEntreprises } from "@/lib/queries/useToutesEntreprises";
import { useChangerStatutCompteEntreprise } from "@/lib/queries/useChangerStatutCompteEntreprise";
import { useVerifierEntreprise } from "@/lib/queries/useVerifierEntreprise";

// Un badge par ligne : la suspension du compte prime sur le statut de
// vérification (une entreprise vérifiée peut ensuite être suspendue).
function getBadge(e) {
  if (e.statutCompte === "suspendu") {
    return { label: "Suspendu", className: "bg-muted text-muted-foreground" };
  }
  if (e.statutVerification === "verifiee") {
    return { label: "Vérifié", className: "bg-primary/10 text-primary" };
  }
  if (e.statutVerification === "rejetee") {
    return {
      label: "Rejetée",
      className: "bg-destructive/10 text-destructive",
    };
  }
  return { label: "En attente", className: "bg-warning/10 text-warning" };
}

// Code de référence court dérivé de l'UUID réel (les identifiants ne sont
// pas séquentiels côté base de données, contrairement à la maquette).
function codeEntreprise(idEntreprise) {
  return `ENT-${idEntreprise.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EntrepriseRow({
  entreprise,
  isSelected,
  onSelect,
  verifierMutation,
  statutMutation,
}) {
  const badge = getBadge(entreprise);
  const isPending =
    (verifierMutation.isPending &&
      verifierMutation.variables?.id === entreprise.idEntreprise) ||
    (statutMutation.isPending &&
      statutMutation.variables?.id === entreprise.idEntreprise);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(entreprise.idEntreprise)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(entreprise.idEntreprise);
        }
      }}
      className={`flex w-full cursor-pointer flex-col gap-3 rounded-md border p-4 text-left transition ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
          <FiBriefcase className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {entreprise.nomEntreprise}
            </h3>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {badge.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {entreprise.ville} · Depuis {formatDate(entreprise.dateCreation)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-primary">
          {codeEntreprise(entreprise.idEntreprise)} · {entreprise.nbDocuments}{" "}
          document{entreprise.nbDocuments > 1 ? "s" : ""}
        </span>

        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {entreprise.statutCompte === "suspendu" ? (
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              className="h-7 rounded-sm px-2 text-xs"
              onClick={() =>
                statutMutation.mutate({
                  id: entreprise.idEntreprise,
                  statutCompte: "actif",
                })
              }
            >
              {isPending ? (
                <FiLoader className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Réactiver
            </Button>
          ) : entreprise.statutVerification === "en_attente" ? (
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              className="h-7 rounded-sm bg-success px-2 text-xs text-white hover:bg-success/90"
              onClick={() =>
                verifierMutation.mutate({
                  id: entreprise.idEntreprise,
                  statutVerification: "verifiee",
                })
              }
            >
              {isPending ? (
                <FiLoader className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FiCheck className="h-3.5 w-3.5" />
              )}
              Vérifier
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              className="h-7 rounded-sm border-destructive/40 px-2 text-xs text-destructive hover:bg-destructive/5"
              onClick={() =>
                statutMutation.mutate({
                  id: entreprise.idEntreprise,
                  statutCompte: "suspendu",
                })
              }
            >
              {isPending ? (
                <FiLoader className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Suspendre
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EntreprisesAdminPage() {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [selectedId, setSelectedId] = useState(null);

  const { data: entreprises, isLoading } = useToutesEntreprises(recherche);
  const verifierMutation = useVerifierEntreprise();
  const statutMutation = useChangerStatutCompteEntreprise();

  const counts = useMemo(() => {
    const c = { en_attente: 0, verifiee: 0, rejetee: 0 };
    (entreprises || []).forEach((e) => {
      if (c[e.statutVerification] !== undefined) c[e.statutVerification]++;
    });
    return c;
  }, [entreprises]);

  const entreprisesFiltrees = (entreprises || []).filter(
    (e) => filtre === "tous" || e.statutVerification === filtre,
  );

  const selected =
    entreprisesFiltrees.find((e) => e.idEntreprise === selectedId) ||
    entreprisesFiltrees[0] ||
    null;

  return (
    <>
      <AppHeader
        title="Entreprises"
        subtitle="Vérification et gestion des entreprises partenaires"
        searchValue={recherche}
        onSearchChange={setRecherche}
        refreshKeys={["toutesEntreprises", "adminStats"]}
      />

      <div className="px-6 py-6">
        <div className="mb-6">
          <EntrepriseFiltresTabs
            value={filtre}
            onChange={setFiltre}
            counts={counts}
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {entreprisesFiltrees.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FiBriefcase className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucune entreprise trouvée
            </p>
          </div>
        )}

        {entreprisesFiltrees.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
            <div className="space-y-3">
              {entreprisesFiltrees.map((e) => (
                <EntrepriseRow
                  key={e.idEntreprise}
                  entreprise={e}
                  isSelected={selected?.idEntreprise === e.idEntreprise}
                  onSelect={setSelectedId}
                  verifierMutation={verifierMutation}
                  statutMutation={statutMutation}
                />
              ))}
            </div>

            {selected && (
              <EntrepriseDetailPanel
                entreprise={selected}
                badge={getBadge(selected)}
                verifierMutation={verifierMutation}
                statutMutation={statutMutation}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
