"use client";

import { useState } from "react";
import { FiLoader, FiUsers } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTousUtilisateurs } from "@/lib/queries/useTousUtilisateurs";
import { useChangerStatutCompteUtilisateur } from "@/lib/queries/useChangerStatutCompteUtilisateur";

const ONGLETS = [
  { value: undefined, label: "Tous les utilisateurs" },
  { value: "stagiaire", label: "Étudiant" },
  { value: "entreprise", label: "Recruteur" },
  { value: "universite", label: "Coordinateur" },
];

const ROLE_INFO = {
  stagiaire: { label: "Étudiant", className: "bg-success/10 text-success" },
  entreprise: { label: "Recruteur", className: "bg-primary/10 text-primary" },
  universite: {
    label: "Coordinateur",
    className: "bg-warning/10 text-amber-700",
  },
};

// Code de référence court dérivé de l'UUID réel (les identifiants ne sont
// pas séquentiels côté base de données, contrairement à la maquette) —
// même convention que codeEntreprise() dans gestion-entreprises/page.jsx.
function codeUtilisateur(idUtilisateur) {
  return `USR-${idUtilisateur.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

function initiales(nom) {
  const mots = nom.trim().split(/\s+/);
  const premiere = mots[0]?.[0] || "?";
  const seconde = mots[1]?.[0] || "";
  return (premiere + seconde).toUpperCase();
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// La suspension du compte prime sur tout. Ensuite : pour une entreprise ou
// une université, le statut affiché est celui de LEUR organisation
// (statutVerification vérifié par un admin) — un recruteur est "Vérifié"
// parce que son entreprise l'est, peu importe son propre email. Les
// étudiants n'ont pas de statutVerification dédié dans le schéma, donc on
// retombe sur emailVerifie pour eux, seul indicateur disponible.
function getStatut(utilisateur) {
  if (utilisateur.statutCompte === "suspendu") {
    return { label: "Suspendu", className: "bg-muted text-muted-foreground" };
  }

  if (utilisateur.role === "entreprise" || utilisateur.role === "universite") {
    if (utilisateur.statutVerification === "verifiee") {
      return { label: "Vérifié", className: "bg-primary/10 text-primary" };
    }
    if (utilisateur.statutVerification === "rejetee") {
      return {
        label: "Rejeté",
        className: "bg-destructive/10 text-destructive",
      };
    }
    return { label: "En attente", className: "bg-warning/10 text-amber-700" };
  }

  if (utilisateur.emailVerifie) {
    return { label: "Vérifié", className: "bg-primary/10 text-primary" };
  }
  return { label: "En attente", className: "bg-warning/10 text-amber-700" };
}

function LigneUtilisateur({ utilisateur, onVoirProfil, statutMutation }) {
  const role = ROLE_INFO[utilisateur.role];
  const statut = getStatut(utilisateur);
  const isPending =
    statutMutation.isPending &&
    statutMutation.variables?.id === utilisateur.idUtilisateur;
  const estSuspendu = utilisateur.statutCompte === "suspendu";

  return (
    <tr className="border-b border-border/60 last:border-0 transition hover:bg-primary/[0.06]">
      <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-primary">
        {codeUtilisateur(utilisateur.idUtilisateur)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initiales(utilisateur.nom)}
          </div>
          <span className="truncate font-medium text-foreground">
            {utilisateur.nom}
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {utilisateur.email}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${role.className}`}
        >
          {role.label}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
        {utilisateur.organisation}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {formatDate(utilisateur.dateCreation)}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statut.className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statut.label}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-sm"
            onClick={() => onVoirProfil(utilisateur)}
          >
            Profil
          </Button>
          <Button
            type="button"
            variant={estSuspendu ? "default" : "outline"}
            size="sm"
            disabled={isPending}
            className={
              estSuspendu
                ? "rounded-sm"
                : "rounded-sm border-destructive/40 text-destructive hover:bg-destructive/5"
            }
            onClick={() =>
              statutMutation.mutate({
                id: utilisateur.idUtilisateur,
                statutCompte: estSuspendu ? "actif" : "suspendu",
              })
            }
          >
            {isPending ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : estSuspendu ? (
              "Réactiver"
            ) : (
              "Suspendre"
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function UtilisateursPage() {
  const [recherche, setRecherche] = useState("");
  const [onglet, setOnglet] = useState(undefined);
  const [profilOuvert, setProfilOuvert] = useState(null);

  const { data: utilisateurs, isLoading } = useTousUtilisateurs({
    recherche,
    role: onglet,
  });
  const statutMutation = useChangerStatutCompteUtilisateur();

  const resultats = utilisateurs?.length ?? 0;

  return (
    <>
      <AppHeader
        title="Utilisateurs"
        subtitle="Comptes étudiants, entreprises et coordinateurs"
        searchValue={recherche}
        onSearchChange={setRecherche}
      />

      <div className="px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {ONGLETS.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setOnglet(o.value)}
                className={`rounded-sm border px-4 py-2 text-sm font-medium transition ${
                  onglet === o.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {!isLoading && (
            <span className="text-sm text-muted-foreground">
              {resultats} résultat{resultats > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {utilisateurs && utilisateurs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FiUsers className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucun utilisateur trouvé
            </p>
          </div>
        )}

        {utilisateurs && utilisateurs.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-linear-to-r from-blue-600/75 to-blue-600/80">
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    ID
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    Nom
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    Email
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    Rôle
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    Organisation
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    Inscription
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    Statut
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="[&>tr:nth-child(even)]:bg-muted/40">
                {utilisateurs.map((u) => (
                  <LigneUtilisateur
                    key={u.idUtilisateur}
                    utilisateur={u}
                    onVoirProfil={setProfilOuvert}
                    statutMutation={statutMutation}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={!!profilOuvert}
        onOpenChange={(open) => !open && setProfilOuvert(null)}
      >
        <DialogContent>
          {profilOuvert && (
            <>
              <DialogHeader>
                <DialogTitle>{profilOuvert.nom}</DialogTitle>
                <DialogDescription>
                  {codeUtilisateur(profilOuvert.idUtilisateur)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">
                    {profilOuvert.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rôle</span>
                  <span className="font-medium text-foreground">
                    {ROLE_INFO[profilOuvert.role].label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organisation</span>
                  <span className="font-medium text-foreground">
                    {profilOuvert.organisation}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inscription</span>
                  <span className="font-medium text-foreground">
                    {formatDate(profilOuvert.dateCreation)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span className="font-medium text-foreground">
                    {getStatut(profilOuvert).label}
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
