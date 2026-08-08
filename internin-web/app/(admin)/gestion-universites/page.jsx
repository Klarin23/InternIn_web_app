"use client";

import { useState } from "react";
import { FiLoader, FiCheck } from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa6";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToutesUniversites } from "@/lib/queries/useToutesUniversites";
import { useChangerStatutCompteUniversite } from "@/lib/queries/useChangerStatutCompteUniversite";
import { useVerifierUniversite } from "@/lib/queries/useVerifierUniversite";

// Un badge par ligne : la suspension du compte prime sur le statut de
// vérification (une université vérifiée peut ensuite être suspendue).
function getBadge(u) {
  if (u.statutCompte === "suspendu") {
    return { label: "Suspendu", className: "bg-muted text-muted-foreground" };
  }
  if (u.statutVerification === "verifiee") {
    return { label: "Vérifié", className: "bg-primary/10 text-primary" };
  }
  if (u.statutVerification === "rejetee") {
    return {
      label: "Rejetée",
      className: "bg-destructive/10 text-destructive",
    };
  }
  return { label: "En attente", className: "bg-warning/10 text-warning" };
}

// Code de référence court dérivé de l'UUID réel (les identifiants ne sont
// pas séquentiels côté base de données, contrairement à la maquette).
function codeUniversite(idUniversite) {
  return `UNI-${idUniversite.replace(/-/g, "").slice(0, 3).toUpperCase()}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function UniversiteRow({
  universite,
  onVoirDossier,
  verifierMutation,
  statutMutation,
}) {
  const badge = getBadge(universite);
  const isPending =
    (verifierMutation.isPending &&
      verifierMutation.variables?.id === universite.idUniversite) ||
    (statutMutation.isPending &&
      statutMutation.variables?.id === universite.idUniversite);

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FaGraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-foreground">
              {universite.nomUniversite}
            </h3>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {badge.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {universite.emailOfficiel}
            {universite.pays ? ` · ${universite.pays}` : ""} · Depuis{" "}
            {formatDate(universite.dateCreation)}
          </p>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center gap-5 sm:gap-6">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">
            {universite.nbDocuments}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Documents
          </p>
        </div>

        <span className="text-xs font-medium text-primary">
          {codeUniversite(universite.idUniversite)}
        </span>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-sm"
            onClick={() => onVoirDossier(universite)}
          >
            Dossier
          </Button>

          {universite.statutCompte === "suspendu" ? (
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              className="rounded-sm"
              onClick={() =>
                statutMutation.mutate({
                  id: universite.idUniversite,
                  statutCompte: "actif",
                })
              }
            >
              {isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : null}
              Réactiver
            </Button>
          ) : universite.statutVerification === "en_attente" ? (
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              className="rounded-sm bg-success text-white hover:bg-success/90"
              onClick={() =>
                verifierMutation.mutate({
                  id: universite.idUniversite,
                  statutVerification: "verifiee",
                })
              }
            >
              {isPending ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiCheck className="h-4 w-4" />
              )}
              Vérifier
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/5"
              onClick={() =>
                statutMutation.mutate({
                  id: universite.idUniversite,
                  statutCompte: "suspendu",
                })
              }
            >
              {isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : null}
              Suspendre
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UniversitesAdminPage() {
  const [recherche, setRecherche] = useState("");
  const [dossierOuvert, setDossierOuvert] = useState(null);

  const { data: universites, isLoading } = useToutesUniversites(recherche);
  const verifierMutation = useVerifierUniversite();
  const statutMutation = useChangerStatutCompteUniversite();

  return (
    <>
      <AppHeader
        title="Universités"
        subtitle="Vérification et gestion des universités partenaires"
        searchValue={recherche}
        onSearchChange={setRecherche}
      />

      <div className="px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {universites && universites.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FaGraduationCap className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucune université trouvée
            </p>
          </div>
        )}

        {universites && universites.length > 0 && (
          <div className="space-y-3">
            {universites.map((u) => (
              <UniversiteRow
                key={u.idUniversite}
                universite={u}
                onVoirDossier={setDossierOuvert}
                verifierMutation={verifierMutation}
                statutMutation={statutMutation}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!dossierOuvert}
        onOpenChange={(open) => !open && setDossierOuvert(null)}
      >
        <DialogContent>
          {dossierOuvert && (
            <>
              <DialogHeader>
                <DialogTitle>{dossierOuvert.nomUniversite}</DialogTitle>
                <DialogDescription>
                  {codeUniversite(dossierOuvert.idUniversite)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">
                    {dossierOuvert.emailOfficiel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pays</span>
                  <span className="font-medium text-foreground">
                    {dossierOuvert.pays || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membre depuis</span>
                  <span className="font-medium text-foreground">
                    {formatDate(dossierOuvert.dateCreation)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Documents déposés
                  </span>
                  <span className="font-medium text-foreground">
                    {dossierOuvert.nbDocuments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span className="font-medium text-foreground">
                    {getBadge(dossierOuvert).label}
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
