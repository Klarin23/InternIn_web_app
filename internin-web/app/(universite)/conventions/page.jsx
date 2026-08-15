"use client";
// Page "Conventions" de l'espace université.
//
// Écarts assumés vis-à-vis d'une maquette générique (aucune donnée
// inventée) :
// - Le schéma ne porte pas de statut de refus distinct sur une convention
//   (seulement 3 booléens : acceptée par l'entreprise / le stagiaire /
//   approuvée par la plateforme). Le statut affiché est donc calculé :
//   "En attente" tant que les 3 accords ne sont pas réunis, sinon calqué
//   sur l'état réel du stage (actif/terminé/interrompu).
// - "Valider" est une validation administrative INTERNE à l'université
//   (pour ses propres dossiers) : elle ne conditionne pas la création du
//   stage, qui reste déclenchée uniquement par les 3 accords existants.
// - Le PDF généré est un récapitulatif simple à usage de suivi — il ne
//   remplace pas la convention signée entre les parties.

import { useState } from "react";
import {
  FiLoader,
  FiFileText,
  FiCheck,
  FiX,
  FiClock,
  FiDownload,
  FiShield,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { useConventionsUniversite } from "@/lib/queries/useConventionsUniversite";
import { useValiderConvention } from "@/lib/queries/useValiderConvention";
import { useGenererPdfConvention } from "@/lib/queries/useGenererPdfConvention";

const ONGLETS = [
  { value: undefined, label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "active", label: "Actives" },
  { value: "terminee", label: "Terminées" },
];

const STATUT_INFO = {
  en_attente: {
    label: "En attente",
    className: "bg-warning/10 text-amber-700",
  },
  active: { label: "Active", className: "bg-primary/10 text-primary" },
  terminee: { label: "Terminée", className: "bg-muted text-muted-foreground" },
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

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EtapeSignature({ ok, label }) {
  return (
    <span
      className={`flex items-center gap-1 text-xs ${ok ? "text-success" : "text-muted-foreground"}`}
    >
      {ok ? (
        <FiCheck className="h-3.5 w-3.5" />
      ) : (
        <FiClock className="h-3.5 w-3.5" />
      )}
      {label}
    </span>
  );
}

function LigneConvention({ convention }) {
  const statut = STATUT_INFO[convention.statut];
  const validerMutation = useValiderConvention();
  const pdfMutation = useGenererPdfConvention();

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-foreground">
            {convention.intitulePoste}
          </h3>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statut.className}`}
          >
            {statut.label}
          </span>
          {convention.valideeParUniversite && (
            <span className="flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-bold text-secondary">
              <FiShield className="h-3 w-3" />
              Validée université
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {convention.nomEtudiant} — {convention.nomEntreprise}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Début : {formatDate(convention.dateDebut)}
          {convention.dureeStage
            ? ` · ${convention.dureeStage.replace(/_/g, " ")}`
            : ""}
        </p>
      </div>

      <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:items-end">
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <EtapeSignature
            ok={convention.accepteeParEntreprise}
            label="Entreprise"
          />
          <EtapeSignature
            ok={convention.accepteeParStagiaire}
            label="Étudiant"
          />
          <EtapeSignature
            ok={convention.approuveeParPlateforme}
            label="Plateforme"
          />
        </div>

        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pdfMutation.isPending}
            onClick={() => pdfMutation.mutate(convention.idConvention)}
          >
            {pdfMutation.isPending ? (
              <FiLoader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FiDownload className="h-3.5 w-3.5" />
            )}
            PDF
          </Button>
          <Button
            type="button"
            size="sm"
            variant={convention.valideeParUniversite ? "outline" : "default"}
            disabled={validerMutation.isPending}
            onClick={() =>
              validerMutation.mutate({
                idConvention: convention.idConvention,
                valider: !convention.valideeParUniversite,
              })
            }
          >
            {convention.valideeParUniversite ? (
              <>
                <FiX className="h-3.5 w-3.5" />
                Retirer la validation
              </>
            ) : (
              <>
                <FiCheck className="h-3.5 w-3.5" />
                Valider
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ConventionsPage() {
  const [recherche, setRecherche] = useState("");
  const [onglet, setOnglet] = useState(undefined);

  const { data, isLoading } = useConventionsUniversite({
    recherche,
    statut: onglet,
  });
  const conventions = data?.data || [];
  const stats = data?.stats;

  return (
    <>
      <AppHeader
        title="Conventions"
        subtitle="Suivi des conventions de stage"
        searchValue={recherche}
        onSearchChange={setRecherche}
        refreshKeys={["conventionsUniversite"]}
      />

      <div className="space-y-6 px-6 py-6">
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              icon={FiFileText}
              value={stats.total}
              label="Total"
              color="bg-primary/10 text-primary"
            />
            <StatCard
              icon={FiClock}
              value={stats.enAttente}
              label="En attente"
              color="bg-warning/10 text-amber-700"
            />
            <StatCard
              icon={FiCheck}
              value={stats.actives}
              label="Actives"
              color="bg-success/10 text-green-700"
            />
            <StatCard
              icon={FiX}
              value={stats.terminees}
              label="Terminées"
              color="bg-muted text-muted-foreground"
            />
            <StatCard
              icon={FiShield}
              value={stats.valideesUniversite}
              label="Validées université"
              color="bg-secondary/10 text-secondary"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {ONGLETS.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => setOnglet(o.value)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                onglet === o.value
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border bg-white text-muted-foreground hover:bg-muted"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {!isLoading && conventions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FiFileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucune convention trouvée
            </p>
          </div>
        )}

        {conventions.length > 0 && (
          <div className="space-y-3">
            {conventions.map((c) => (
              <LigneConvention key={c.idConvention} convention={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
