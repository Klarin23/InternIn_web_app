"use client";
// Page « Entreprises » — espace Université (refonte premium).
// Données réelles uniquement via useEntreprisesUniversite + useInvitationsEnvoyees.

import { useMemo, useState } from "react";
import {
  FiBriefcase,
  FiUsers,
  FiActivity,
  FiStar,
  FiLoader,
  FiMapPin,
  FiMail,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { useEntreprisesUniversite } from "@/lib/queries/useEntreprisesUniversite";
import { useInvitationsEnvoyees } from "@/lib/queries/usePartenariats";
import DecouvrirEntreprisesTab from "@/components/features/universite/DecouvrirEntreprisesTab";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

function initiales(nom) {
  const mots = String(nom || "")
    .trim()
    .split(/\s+/);
  return ((mots[0]?.[0] || "?") + (mots[1]?.[0] || "")).toUpperCase();
}

function verificationClass(statut) {
  if (statut === "verifiee")
    return "bg-teal-500/10 text-teal-700 dark:text-teal-300";
  if (statut === "en_attente")
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (statut === "rejetee") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function KpiItem({ value, label, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden />
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-foreground">
        {value ?? 0}
      </p>
    </div>
  );
}

function statusLabel(statut, t) {
  if (statut === "verifiee") return t("universiteSpace.companies.status.verified");
  if (statut === "en_attente") return t("universiteSpace.companies.status.pending");
  if (statut === "rejetee") return t("universiteSpace.companies.status.rejected");
  return null;
}

function LigneEntreprise({ entreprise, t }) {
  const label = statusLabel(entreprise.statutVerification, t);
  return (
    <tr className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-xs font-bold text-teal-700 dark:text-teal-300">
            {initiales(entreprise.nomEntreprise)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {entreprise.nomEntreprise}
            </p>
            {entreprise.secteurActivite ? (
              <p className="truncate text-xs text-muted-foreground">
                {entreprise.secteurActivite}
              </p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground">
        {entreprise.ville ? (
          <span className="inline-flex items-center gap-1">
            <FiMapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {entreprise.ville}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3.5 text-center text-sm font-semibold tabular-nums text-foreground">
        {entreprise.nbEtudiants ?? 0}
      </td>
      <td className="px-4 py-3.5 text-center">
        {entreprise.stagesActifs > 0 ? (
          <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
            {entreprise.stagesActifs}{" "}
            {entreprise.stagesActifs > 1
              ? t("universiteSpace.companies.activeOther")
              : t("universiteSpace.companies.activeOne")}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-center text-sm font-semibold tabular-nums text-foreground">
        {entreprise.noteMoyenne != null ? `${entreprise.noteMoyenne}/20` : "—"}
      </td>
      <td className="px-4 py-3.5">
        {label ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              verificationClass(entreprise.statutVerification),
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            {label}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground">
        {entreprise.contactPrincipal ? (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {entreprise.contactPrincipal.nom}
            </p>
            {entreprise.contactPrincipal.email ? (
              <p className="flex items-center gap-1 truncate text-xs">
                <FiMail className="h-3 w-3 shrink-0" aria-hidden />
                {entreprise.contactPrincipal.email}
              </p>
            ) : null}
          </div>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

function EntrepriseCard({ entreprise, t }) {
  const label = statusLabel(entreprise.statutVerification, t);
  return (
    <article className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-sm font-bold text-teal-700 dark:text-teal-300">
          {initiales(entreprise.nomEntreprise)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {entreprise.nomEntreprise}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {[entreprise.secteurActivite, entreprise.ville]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            </div>
            {label ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  verificationClass(entreprise.statutVerification),
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                {label}
              </span>
            ) : null}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/40 px-2 py-2">
              <p className="text-sm font-bold tabular-nums text-foreground">
                {entreprise.nbEtudiants ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t("universiteSpace.companies.headers.students")}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 px-2 py-2">
              <p className="text-sm font-bold tabular-nums text-foreground">
                {entreprise.stagesActifs ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t("universiteSpace.companies.headers.internships")}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 px-2 py-2">
              <p className="text-sm font-bold tabular-nums text-foreground">
                {entreprise.noteMoyenne != null ? entreprise.noteMoyenne : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t("universiteSpace.companies.headers.rating")}
              </p>
            </div>
          </div>
          {entreprise.contactPrincipal?.nom ? (
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {entreprise.contactPrincipal.nom}
              </span>
              {entreprise.contactPrincipal.email
                ? ` · ${entreprise.contactPrincipal.email}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-8 w-56 rounded-md bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/60" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-muted/40" />
    </div>
  );
}

export default function EntreprisesUniversitePage() {
  const { t } = useTranslation();
  const [recherche, setRecherche] = useState("");
  const [ongletActif, setOngletActif] = useState("reseau");

  const {
    data: entreprises,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEntreprisesUniversite(recherche);

  const { data: invitationsEnvoyees } = useInvitationsEnvoyees();

  const invitationsEnAttente = useMemo(() => {
    const list = Array.isArray(invitationsEnvoyees)
      ? invitationsEnvoyees
      : invitationsEnvoyees?.data || [];
    return list.filter((i) => i?.statut === "en_attente").length;
  }, [invitationsEnvoyees]);

  const stats = useMemo(() => {
    const list = Array.isArray(entreprises) ? entreprises : [];
    const etudiantsPlaces = list.reduce(
      (s, e) => s + (Number(e.nbEtudiants) || 0),
      0,
    );
    const stagesActifs = list.reduce(
      (s, e) => s + (Number(e.stagesActifs) || 0),
      0,
    );
    const notes = list
      .map((e) => e.noteMoyenne)
      .filter((n) => n != null && !Number.isNaN(Number(n)));
    const noteMoyenne =
      notes.length > 0
        ? Math.round(
            (notes.reduce((a, b) => a + Number(b), 0) / notes.length) * 10,
          ) / 10
        : null;
    return {
      partenaires: list.length,
      etudiantsPlaces,
      stagesActifs,
      noteMoyenne,
    };
  }, [entreprises]);

  return (
    <>
      <AppHeader
        breadcrumb={[
          {
            label:
              t("universiteSpace.companies.breadcrumb") ||
              t("universiteSpace.companies.title"),
          },
        ]}
        refreshKeys={[
          "entreprisesUniversite",
          "entreprises-decouvrir",
          "invitations-envoyees",
        ]}
      />

      <div className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("universiteSpace.companies.title")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              {t("universiteSpace.companies.subtitlePremium") ||
                t("universiteSpace.companies.subtitle")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="self-start rounded-lg"
            aria-label={t("universiteSpace.companies.refresh")}
          >
            <FiRefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            />
            {t("universiteSpace.companies.refresh")}
          </Button>
        </header>

        <div
          className="inline-flex rounded-xl border border-border/80 bg-muted/40 p-1"
          role="tablist"
          aria-label={t("universiteSpace.companies.tabsAria")}
        >
          {[
            {
              id: "reseau",
              label:
                t("universiteSpace.companies.tabs.partners") ||
                t("universiteSpace.companies.tabNetwork"),
            },
            {
              id: "decouvrir",
              label:
                t("universiteSpace.companies.tabs.discover") ||
                t("universiteSpace.companies.tabDiscover"),
            },
          ].map((tab) => {
            const active = ongletActif === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setOngletActif(tab.id)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {ongletActif === "decouvrir" ? (
          <DecouvrirEntreprisesTab />
        ) : (
          <>
            {isLoading && <PageSkeleton />}

            {isError && !isLoading && (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-6">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <FiAlertCircle className="h-4 w-4 shrink-0" />
                  {error?.message || t("universiteSpace.companies.loadError")}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >
                  <FiRefreshCw className="h-3.5 w-3.5" />
                  {t("universiteSpace.companies.retry")}
                </Button>
              </div>
            )}

            {!isLoading && !isError && (
              <>
                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <KpiItem
                    value={stats.partenaires}
                    label={t("universiteSpace.companies.partnersCount")}
                    icon={FiBriefcase}
                  />
                  <KpiItem
                    value={stats.etudiantsPlaces}
                    label={t("universiteSpace.companies.studentsPlaced")}
                    icon={FiUsers}
                  />
                  <KpiItem
                    value={stats.stagesActifs}
                    label={t("universiteSpace.companies.activeInternships")}
                    icon={FiActivity}
                  />
                  <KpiItem
                    value={
                      stats.noteMoyenne != null
                        ? `${stats.noteMoyenne}/20`
                        : "—"
                    }
                    label={t("universiteSpace.companies.averageRating")}
                    icon={FiStar}
                  />
                </section>

                {invitationsEnAttente > 0 && (
                  <section className="rounded-2xl border border-amber-500/25 bg-amber-500/6 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-800 dark:text-amber-200">
                      {t("universiteSpace.companies.todoLabel")}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-card/80 px-4 py-3">
                        <FiClock
                          className="h-4 w-4 text-amber-600 dark:text-amber-400"
                          aria-hidden
                        />
                        <div>
                          <p className="text-lg font-bold tabular-nums text-foreground">
                            {invitationsEnAttente}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {invitationsEnAttente > 1
                              ? t(
                                  "universiteSpace.companies.todoInvitationsOther",
                                )
                              : t(
                                  "universiteSpace.companies.todoInvitationsOne",
                                )}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        onClick={() => setOngletActif("decouvrir")}
                      >
                        {t("universiteSpace.companies.todoViewDiscover")}
                      </Button>
                    </div>
                  </section>
                )}

                <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">
                        {t("universiteSpace.companies.networkTitle")}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("universiteSpace.companies.networkSubtitle")}
                      </p>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                      <FiSearch
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                      <input
                        type="search"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder={t(
                          "universiteSpace.discoverCompanies.searchPlaceholder",
                        )}
                        aria-label={t(
                          "universiteSpace.discoverCompanies.searchPlaceholder",
                        )}
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/15"
                      />
                    </div>
                  </div>

                  {isFetching && (!entreprises || entreprises.length === 0) && (
                    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                      <FiLoader className="h-5 w-5 animate-spin" />
                      {t("universiteSpace.companies.loading")}
                    </div>
                  )}

                  {entreprises && entreprises.length === 0 && !isFetching && (
                    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <FiBriefcase className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {recherche
                          ? t("universiteSpace.companies.emptySearch")
                          : t("universiteSpace.companies.empty")}
                      </p>
                      <p className="max-w-sm text-xs text-muted-foreground">
                        {recherche
                          ? t("universiteSpace.companies.emptySearchDesc")
                          : t("universiteSpace.companies.emptyDescription")}
                      </p>
                      {!recherche && (
                        <Button
                          type="button"
                          size="sm"
                          className="mt-1 rounded-lg"
                          onClick={() => setOngletActif("decouvrir")}
                        >
                          <FiSearch className="h-3.5 w-3.5" />
                          {t("universiteSpace.companies.tabs.discover")}
                        </Button>
                      )}
                    </div>
                  )}

                  {entreprises && entreprises.length > 0 && (
                    <>
                      <div className="space-y-3 p-4 md:hidden">
                        {entreprises.map((e) => (
                          <EntrepriseCard
                            key={e.idEntreprise}
                            entreprise={e}
                            t={t}
                          />
                        ))}
                      </div>
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-border/60 bg-muted/40">
                              <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("universiteSpace.companies.headers.company")}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("universiteSpace.companies.headers.city")}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t(
                                  "universiteSpace.companies.headers.students",
                                )}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t(
                                  "universiteSpace.companies.headers.internships",
                                )}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("universiteSpace.companies.headers.rating")}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("universiteSpace.companies.headers.status")}
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("universiteSpace.companies.headers.contact")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {entreprises.map((e) => (
                              <LigneEntreprise
                                key={e.idEntreprise}
                                entreprise={e}
                                t={t}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
