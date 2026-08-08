"use client";

import { use } from "react";
import { FiLoader, FiFileText, FiEye, FiDownload } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import ProfilSectionCard from "@/components/features/profil/ProfilSectionCard";
import DetailStagiaireHeader from "@/components/features/detail-stagiaire/DetailStagiaireHeader";
import DetailStagiaireTabs from "@/components/features/detail-stagiaire/DetailStagiaireTabs";
import HistoriqueStage from "@/components/features/detail-stagiaire/HistoriqueStage";
import { useDetailStagiaire } from "@/lib/queries/useSuperviseur";

const MODE_TRAVAIL_LABELS = {
  presentiel: "Présentiel",
  distanciel: "Distanciel",
  hybride: "Hybride",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function ConventionStatutLigne({ label, valide }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground">{label}</span>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          valide ? "bg-success/10 text-green-700" : "bg-muted text-muted-foreground"
        }`}
      >
        {valide ? "Validé" : "En attente"}
      </span>
    </div>
  );
}

export default function DetailStagiairePage({ params }) {
  const { idStage } = use(params);
  const { data, isLoading, error } = useDetailStagiaire(idStage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <FiLoader className="h-5 w-5 animate-spin" />
        Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-16 text-center text-sm text-destructive">
        {error.message}
      </div>
    );
  }

  const { stagiaire, formation, universite, offre, convention, stage, historique } = data;

  return (
    <>
      <AppHeader breadcrumb={[{ label: "Mes stagiaires", href: "/mes-stagiaires" }, { label: `${stagiaire.prenom} ${stagiaire.nom}` }]} />
      <div className="px-6 py-6">
        <DetailStagiaireHeader stagiaire={stagiaire} stage={stage} />
        <div className="mt-6">
          <DetailStagiaireTabs idStage={idStage} />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ProfilSectionCard title="Informations personnelles">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-right text-foreground">{stagiaire.email || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Téléphone</dt>
                <dd className="text-right text-foreground">{stagiaire.telephone || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Ville</dt>
                <dd className="text-right text-foreground">{stagiaire.ville || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Pays</dt>
                <dd className="text-right text-foreground">{stagiaire.pays || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Date de naissance</dt>
                <dd className="text-right text-foreground">
                  {stagiaire.dateNaissance ? formatDate(stagiaire.dateNaissance) : "—"}
                </dd>
              </div>
            </dl>
          </ProfilSectionCard>

          <ProfilSectionCard title="Formation & Université">
            {formation ? (
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Diplôme</dt>
                  <dd className="text-right text-foreground">{formation.diplome || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Faculté / département</dt>
                  <dd className="text-right text-foreground">
                    {formation.faculte || formation.departement || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Année d&apos;étude</dt>
                  <dd className="text-right text-foreground">{formation.anneeEtude || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Université</dt>
                  <dd className="text-right text-foreground">
                    {universite?.nom || formation.nomUniversite || "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Formation non renseignée.</p>
            )}
          </ProfilSectionCard>

          <ProfilSectionCard title="CV">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 p-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <FiFileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate text-sm text-foreground">
                  {stagiaire.cvUrl ? "CV du stagiaire" : "Aucun CV importé"}
                </span>
              </div>
              {stagiaire.cvUrl && (
                <div className="flex flex-shrink-0 items-center gap-1">
                  <a
                    href={stagiaire.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <FiEye className="h-3.5 w-3.5" />
                    Voir
                  </a>
                  <a
                    href={stagiaire.cvUrl}
                    download
                    className="flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <FiDownload className="h-3.5 w-3.5" />
                    Télécharger
                  </a>
                </div>
              )}
            </div>
          </ProfilSectionCard>

          <ProfilSectionCard title="Offre de stage">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Poste</dt>
                <dd className="text-right text-foreground">{offre.titre || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Département</dt>
                <dd className="text-right text-foreground">{offre.departement || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Secteur</dt>
                <dd className="text-right text-foreground">{offre.secteurActivite || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Mode de travail</dt>
                <dd className="text-right text-foreground">
                  {MODE_TRAVAIL_LABELS[offre.modeTravail] || offre.modeTravail || "—"}
                </dd>
              </div>
            </dl>
            {offre.description && (
              <p className="mt-3 border-t border-border/60 pt-3 text-sm text-muted-foreground">
                {offre.description}
              </p>
            )}
          </ProfilSectionCard>

          <ProfilSectionCard title="Objectifs du stage">
            <p className="text-sm text-foreground">
              {stage.objectifsApprentissage || "Aucun objectif renseigné à la création de l'offre."}
            </p>
          </ProfilSectionCard>

          <ProfilSectionCard title="Convention">
            <div className="space-y-2.5">
              <ConventionStatutLigne label="Acceptée par l'entreprise" valide={convention.accepteeParEntreprise} />
              <ConventionStatutLigne label="Acceptée par le stagiaire" valide={convention.accepteeParStagiaire} />
              <ConventionStatutLigne label="Validée par l'université" valide={convention.valideeParUniversite} />
            </div>
          </ProfilSectionCard>

          <ProfilSectionCard title="Dates du stage">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Date de début</dt>
                <dd className="text-right text-foreground">{formatDate(stage.dateDebut)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Date de fin prévue</dt>
                <dd className="text-right text-foreground">{formatDate(stage.dateFinPrevue)}</dd>
              </div>
              {stage.dateFinReelle && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Date de fin réelle</dt>
                  <dd className="text-right text-foreground">{formatDate(stage.dateFinReelle)}</dd>
                </div>
              )}
            </dl>
          </ProfilSectionCard>

          <ProfilSectionCard title="Historique du stage">
            <HistoriqueStage historique={historique} />
          </ProfilSectionCard>
        </div>
      </div>
    </>
  );
}