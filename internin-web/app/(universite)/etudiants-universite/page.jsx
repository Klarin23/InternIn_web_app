"use client";
// Page "Étudiants" de l'espace université — recrée la maquette fournie.
//
// Écarts assumés vis-à-vis de la maquette, aucune donnée n'est inventée :
// - Colonne "Superviseur" = contact CÔTÉ ENTREPRISE (stages.idContactSuperviseur),
//   pas un tuteur académique interne (cette fonctionnalité n'existe pas encore).
// - "Année" = année d'obtention si connue, sinon année d'étude déclarée
//   (pas de notion de "promotion 2024-2025" en base).
// - "Note" = moyenne des 6 critères d'évaluation hebdomadaire (échelle 1-5)
//   du stage le plus pertinent, ramenée sur 20. "—" si pas encore évalué.
// - Les boutons "Exporter", "Filtres" et "+ Inscrire" sont désactivés : ces
//   fonctionnalités n'existent pas encore côté backend.

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  FiUsers,
  FiBriefcase,
  FiClock,
  FiAward,
  FiLoader,
  FiDownload,
  FiFilter,
  FiUserPlus,
  FiMapPin,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { useEtudiantsUniversite } from "@/lib/queries/useEtudiantsUniversite";
import RattachementUniversitePanel from "@/components/features/rattachement/RattachementUniversitePanel";

const ONGLETS = [
  { value: undefined, labelKey: "all" },
  { value: "en_stage", labelKey: "internship" },
  { value: "sans_stage", labelKey: "noInternship" },
  { value: "diplome", labelKey: "graduated" },
];

const STATUT_INFO = {
  en_stage: { labelKey: "internship", className: "bg-primary/10 text-primary" },
  sans_stage: {
    labelKey: "noInternship",
    className: "bg-warning/10 text-amber-700",
  },
  diplome: { labelKey: "graduated", className: "bg-secondary/10 text-secondary" },
};

function initiales(nomComplet) {
  const mots = nomComplet.trim().split(/\s+/);
  return ((mots[0]?.[0] || "?") + (mots[1]?.[0] || "")).toUpperCase();
}

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

function LigneEtudiant({ etudiant }) {
  const statut = STATUT_INFO[etudiant.statut];
  const annee = etudiant.anneeObtention || etudiant.anneeEtude || "—";

  return (
    <tr className="border-b border-border/60 last:border-0 transition hover:bg-primary/[0.06]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initiales(etudiant.nomComplet)}
          </div>
          <span className="truncate font-medium text-foreground">
            {etudiant.nomComplet}
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {etudiant.filiere || "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {annee}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {etudiant.superviseur || "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
        {etudiant.entreprise || "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {etudiant.ville ? (
          <span className="flex items-center gap-1">
            <FiMapPin className="h-3.5 w-3.5" />
            {etudiant.ville}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-foreground">
        {etudiant.note != null ? `${etudiant.note}/20` : "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statut.className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {t(`universiteSpace.students.status.${statut.labelKey}`)}
        </span>
      </td>
    </tr>
  );
}

export default function EtudiantsUniversitePage() {
  const { t } = useTranslation();
  const [recherche, setRecherche] = useState("");
  const [onglet, setOnglet] = useState(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useEtudiantsUniversite({
    recherche,
    statut: onglet,
    page,
    parPage: 8,
  });

  const stats = data?.stats;
  const etudiants = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <AppHeader
        title={t("universiteSpace.students.title")}
        subtitle={
          stats ? t("universiteSpace.students.registeredSubtitle", { count: stats.totalInscrits }) : undefined
        }
        refreshKeys={["etudiantsUniversite"]}
      />

      <div className="space-y-6 px-6 py-6">
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            title={t("universiteSpace.students.comingSoon")}
          >
            <FiDownload className="h-4 w-4" />
            {t("universiteSpace.students.export")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            title={t("universiteSpace.students.comingSoon")}
          >
            <FiFilter className="h-4 w-4" />
            {t("universiteSpace.students.filters")}
          </Button>
          <a
            href="#rattachement-universitaire"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <FiUserPlus className="h-4 w-4" />
            {t("universityLinking.university.inviteTitle")}
          </a>
        </div>

        <div id="rattachement-universitaire">
          <RattachementUniversitePanel
            onChanged={() => {
              setPage(1);
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FiUsers}
            label={t("universiteSpace.students.total")}
            value={stats ? stats.totalInscrits : "…"}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            icon={FiBriefcase}
            label={t("universiteSpace.students.internship")}
            value={stats ? stats.enStage : "…"}
            color="bg-success/10 text-green-700"
          />
          <StatCard
            icon={FiClock}
            label={t("universiteSpace.students.noInternship")}
            value={stats ? stats.sansStage : "…"}
            color="bg-warning/10 text-amber-700"
          />
          <StatCard
            icon={FiAward}
            label={t("universiteSpace.students.recentGraduates")}
            value={stats ? stats.diplomesRecents : "…"}
            color="bg-secondary/10 text-secondary"
          />
        </div>

        <div className="rounded-md border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div className="flex flex-wrap gap-2">
              {ONGLETS.map((o) => (
                <button
                  key={t(`universiteSpace.students.tabs.${o.labelKey}`)}
                  type="button"
                  onClick={() => {
                    setOnglet(o.value);
                    setPage(1);
                  }}
                  className={`rounded-sm border px-4 py-2 text-sm font-medium transition ${
                    onglet === o.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t(`universiteSpace.students.tabs.${o.labelKey}`)}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPage(1);
              }}
              placeholder={t("universiteSpace.students.searchPlaceholder")}
              className="w-56 rounded-full border border-border bg-muted px-3.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <FiLoader className="h-5 w-5 animate-spin" />
              {t("universiteSpace.students.loading")}
            </div>
          )}

          {!isLoading && etudiants.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <FiUsers className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {t("universiteSpace.students.empty")}
              </p>
            </div>
          )}

          {!isLoading && etudiants.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/60">
                    {[
                      t("universiteSpace.students.headers.student"),
                      t("universiteSpace.students.headers.field"),
                      t("universiteSpace.students.headers.year"),
                      t("universiteSpace.students.headers.supervisor"),
                      t("universiteSpace.students.headers.company"),
                      t("universiteSpace.students.headers.city"),
                      t("universiteSpace.students.headers.rating"),
                      t("universiteSpace.students.headers.status"),
                    ].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {etudiants.map((e) => (
                    <LigneEtudiant key={e.idStagiaire} etudiant={e} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
              <span>
                {t("universiteSpace.students.page", { page: pagination.page, totalPages: pagination.totalPages })} — {t("universiteSpace.students.studentsCount", { count: pagination.total })}
              </span>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t("universiteSpace.students.previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("universiteSpace.students.next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}