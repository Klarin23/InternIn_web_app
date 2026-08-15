"use client";
// Page "Statistiques" de l'espace université — vue détaillée qui réutilise
// les mêmes agrégats que le tableau de bord (via getStatistiquesUniversite,
// qui les enrichit) et les mêmes cartes de graphique déjà construites pour
// lui (RepartitionStagesCard, EvolutionConventionsCard), pour rester
// cohérent visuellement plutôt que de dupliquer des graphiques différents.
//
// Écarts assumés (aucune donnée inventée) :
// - "Note moyenne" = même calcul que sur les pages Étudiants/Entreprises
//   (moyenne des 6 critères d'évaluation hebdomadaire, ramenée sur 20).
// - "Répartition par durée" n'a que 3 valeurs réelles (1/2/3 mois) — pas de
//   granularité plus fine, le schéma ne la porte pas.
// - "Top entreprises partenaires" reprend le même classement (par nombre
//   d'étudiants placés) que la page Entreprises, limité aux 5 premières.

import {
  FiLoader,
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiAward,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import RepartitionStagesCard from "@/components/features/dashboard-universite/RepartitionStagesCard";
import EvolutionConventionsCard from "@/components/features/dashboard-universite/EvolutionConventionsCard";
import { useStatistiquesUniversite } from "@/lib/queries/useStatistiquesUniversite";

const DUREE_LABEL = {
  "1_mois": "1 mois",
  "2_mois": "2 mois",
  "3_mois": "3 mois",
  non_renseignee: "Non renseignée",
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

export default function StatistiquesPage() {
  const { data: stats, isLoading } = useStatistiquesUniversite();

  const dureeEntries = stats ? Object.entries(stats.repartitionDureeStage) : [];
  const totalDuree = dureeEntries.reduce((s, [, v]) => s + v, 0) || 1;

  return (
    <>
      <AppHeader
        title="Statistiques"
        subtitle="Vue détaillée de l'activité de stages"
        refreshKeys={["universiteStats"]}
      />

      <div className="space-y-6 px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={FiUsers}
                value={stats.etudiantsInscrits}
                label="Étudiants inscrits"
                color="bg-primary/10 text-primary"
              />
              <StatCard
                icon={FiBriefcase}
                value={stats.entreprisesPartenaires}
                label="Entreprises partenaires"
                color="bg-secondary/10 text-secondary"
              />
              <StatCard
                icon={FiFileText}
                value={stats.conventionsActives}
                label="Conventions actives"
                color="bg-success/10 text-green-700"
              />
              <StatCard
                icon={FiAward}
                value={
                  stats.noteMoyenneGlobale != null
                    ? `${stats.noteMoyenneGlobale}/20`
                    : "—"
                }
                label="Note moyenne des stagiaires"
                color="bg-warning/10 text-amber-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <EvolutionConventionsCard depotsParMois={stats.depotsParMois} />
              <RepartitionStagesCard repartition={stats.repartitionStatuts} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-md border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-bold text-foreground">
                  Répartition par durée de stage
                </h3>
                {dureeEntries.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Aucune convention pour l&apos;instant.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {dureeEntries.map(([cle, valeur]) => (
                      <div key={cle}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">
                            {DUREE_LABEL[cle] || cle}
                          </span>
                          <span className="font-bold text-foreground">
                            {valeur}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(valeur / totalDuree) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-md border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-bold text-foreground">
                  Top entreprises partenaires
                </h3>
                {stats.topEntreprises.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Aucune entreprise partenaire pour l&apos;instant.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {stats.topEntreprises.map((e) => (
                      <li
                        key={e.idEntreprise}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium text-foreground">
                          {e.nomEntreprise}
                        </span>
                        <span className="text-muted-foreground">
                          {e.nbEtudiants} étudiant{e.nbEtudiants > 1 ? "s" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
