"use client";
// Page "Entreprises" de l'espace université — liste les entreprises
// partenaires (celles ayant accueilli au moins un stagiaire de cette
// université), avec des indicateurs agrégés réels par entreprise.
//
// Écarts assumés, aucune donnée n'est inventée :
// - "Contact" = contact principal général de l'entreprise (contacts_entreprise),
//   pas forcément la personne ayant supervisé un stagiaire de cette
//   université en particulier (cette granularité n'existe pas en base).
// - "Note" = moyenne de tous les critères de toutes les évaluations
//   hebdomadaires des stages liés à cette entreprise, ramenée sur 20.
//   "—" si aucun stage évalué pour l'instant.
// - Le bouton "Exporter" est désactivé : fonctionnalité pas encore construite
//   côté backend (même limite assumée que sur la page Étudiants).

import { useMemo, useState } from "react";
import {
  FiBriefcase,
  FiUsers,
  FiActivity,
  FiStar,
  FiLoader,
  FiDownload,
  FiMapPin,
  FiMail,
  FiSearch,
  FiUserCheck,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { useEntreprisesUniversite } from "@/lib/queries/useEntreprisesUniversite";
import DecouvrirEntreprisesTab from "@/components/features/universite/DecouvrirEntreprisesTab";

const STATUT_INFO = {
  verifiee: { label: "Vérifiée", className: "bg-primary/10 text-primary" },
  en_attente: {
    label: "En attente",
    className: "bg-warning/10 text-amber-700",
  },
  rejetee: {
    label: "Rejetée",
    className: "bg-destructive/10 text-destructive",
  },
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-sm ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function initiales(nom) {
  const mots = nom.trim().split(/\s+/);
  return ((mots[0]?.[0] || "?") + (mots[1]?.[0] || "")).toUpperCase();
}

function LigneEntreprise({ entreprise }) {
  const statut = STATUT_INFO[entreprise.statutVerification] || null;

  return (
    <tr className="border-b border-border/60 transition last:border-0 hover:bg-primary/[0.06]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-primary/10 text-xs font-bold text-primary">
            {initiales(entreprise.nomEntreprise)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {entreprise.nomEntreprise}
            </p>
            {entreprise.secteurActivite && (
              <p className="truncate text-xs text-muted-foreground">
                {entreprise.secteurActivite}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {entreprise.ville ? (
          <span className="flex items-center gap-1">
            <FiMapPin className="h-3.5 w-3.5" />
            {entreprise.ville}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3 text-center text-sm font-semibold text-foreground">
        {entreprise.nbEtudiants}
      </td>
      <td className="px-4 py-3 text-center">
        {entreprise.stagesActifs > 0 ? (
          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-green-700">
            {entreprise.stagesActifs} actif
            {entreprise.stagesActifs > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-sm font-semibold text-foreground">
        {entreprise.noteMoyenne != null ? `${entreprise.noteMoyenne}/20` : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {statut ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statut.className}`}
            >
              {statut.label}
            </span>
          ) : (
            "—"
          )}
          {entreprise.origine === "invitation" && (
            <span className="flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-bold text-secondary">
              <FiUserCheck className="h-3 w-3" />
              Partenariat direct
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {entreprise.contactPrincipal ? (
          <div className="min-w-0">
            <p className="truncate text-foreground">
              {entreprise.contactPrincipal.nom}
            </p>
            {entreprise.contactPrincipal.email && (
              <p className="flex items-center gap-1 truncate text-xs">
                <FiMail className="h-3 w-3 flex-shrink-0" />
                {entreprise.contactPrincipal.email}
              </p>
            )}
          </div>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

export default function EntreprisesUniversitePage() {
  const [ongletActif, setOngletActif] = useState("partenaires");
  const [recherche, setRecherche] = useState("");
  const { data: entreprises, isLoading } = useEntreprisesUniversite(recherche);

  const stats = useMemo(() => {
    if (!entreprises) return null;
    const totalEtudiants = entreprises.reduce((s, e) => s + e.nbEtudiants, 0);
    const totalActifs = entreprises.reduce((s, e) => s + e.stagesActifs, 0);
    const notes = entreprises.filter((e) => e.noteMoyenne != null);
    const noteMoyenne = notes.length
      ? Math.round(
          (notes.reduce((s, e) => s + e.noteMoyenne, 0) / notes.length) * 10,
        ) / 10
      : null;
    return {
      nbEntreprises: entreprises.length,
      totalEtudiants,
      totalActifs,
      noteMoyenne,
    };
  }, [entreprises]);

  return (
    <>
      <AppHeader
        title="Entreprises"
        subtitle="Entreprises partenaires ayant accueilli vos étudiants"
        searchValue={ongletActif === "partenaires" ? recherche : undefined}
        onSearchChange={
          ongletActif === "partenaires" ? setRecherche : undefined
        }
        refreshKeys={["entreprisesUniversite"]}
      />

      <div className="space-y-6 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-sm border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setOngletActif("partenaires")}
              className={`rounded-sm px-3.5 py-1.5 text-sm font-medium transition ${
                ongletActif === "partenaires"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Partenaires
            </button>
            <button
              type="button"
              onClick={() => setOngletActif("decouvrir")}
              className={`rounded-sm px-3.5 py-1.5 text-sm font-medium transition ${
                ongletActif === "decouvrir"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Découvrir des entreprises
            </button>
          </div>

          {ongletActif === "partenaires" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              className="rounded-sm"
            >
              <FiDownload className="h-4 w-4" />
              Exporter
            </Button>
          )}
        </div>

        {ongletActif === "decouvrir" && <DecouvrirEntreprisesTab />}

        {ongletActif === "partenaires" && (
          <>
            {stats && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={FiBriefcase}
                  label="Entreprises partenaires"
                  value={stats.nbEntreprises}
                  color="bg-primary/10 text-primary"
                />
                <StatCard
                  icon={FiUsers}
                  label="Étudiants placés"
                  value={stats.totalEtudiants}
                  color="bg-secondary/10 text-secondary"
                />
                <StatCard
                  icon={FiActivity}
                  label="Stages actifs"
                  value={stats.totalActifs}
                  color="bg-success/10 text-green-700"
                />
                <StatCard
                  icon={FiStar}
                  label="Note moyenne"
                  value={
                    stats.noteMoyenne != null ? `${stats.noteMoyenne}/20` : "—"
                  }
                  color="bg-warning/10 text-amber-700"
                />
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <FiLoader className="h-5 w-5 animate-spin" />
                Chargement...
              </div>
            )}

            {entreprises && entreprises.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <FiBriefcase className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Aucune entreprise partenaire pour l&apos;instant
                </p>
                <p className="max-w-[360px] text-xs text-muted-foreground">
                  Cette liste se remplit automatiquement dès qu&apos;un de vos
                  étudiants démarre un stage, ou dès qu&apos;une entreprise
                  accepte une invitation de partenariat.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 rounded-sm"
                  onClick={() => setOngletActif("decouvrir")}
                >
                  <FiSearch className="h-3.5 w-3.5" />
                  Découvrir des entreprises
                </Button>
              </div>
            )}

            {entreprises && entreprises.length > 0 && (
              <div className="overflow-hidden rounded-md border border-border bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3">Entreprise</th>
                      <th className="px-4 py-3">Ville</th>
                      <th className="px-4 py-3 text-center">Étudiants</th>
                      <th className="px-4 py-3 text-center">Stages</th>
                      <th className="px-4 py-3 text-center">Note</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entreprises.map((e) => (
                      <LigneEntreprise key={e.idEntreprise} entreprise={e} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
