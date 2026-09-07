"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, LayoutGrid, List, CalendarDays } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import EntretienCardEntreprise from "@/components/features/entretiens/EntretienCardEntreprise";
import EntretiensHeaderStats from "@/components/features/entretiens/EntretiensHeaderStats";
import EntretiensFiltersBar from "@/components/features/entretiens/EntretiensFiltersBar";
import EntretiensSkeleton from "@/components/features/entretiens/EntretiensSkeleton";
import EntretiensAgenda from "@/components/features/entretiens/EntretiensAgenda";
import EntretiensCalendrier from "@/components/features/entretiens/EntretiensCalendrier";
import ProchainEntretienHighlightEntreprise from "@/components/features/entretiens/ProchainEntretienHighlightEntreprise";
import { useEntretiensEntreprise } from "@/lib/queries/useEntretiens";
import {
  STATUTS_PASSES,
  matchFiltreEntretien,
} from "@/lib/entretiens/statut";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUTS_VISIBLES = [
  "planifie",
  "valide",
  "confirme",
  "reprogramme",
  "termine",
  "annule",
  "absent",
];

function matchRechercheEntreprise(entretien, recherche) {
  if (!recherche?.trim()) return true;
  const q = recherche.trim().toLowerCase();
  const nom = `${entretien.prenom || ""} ${entretien.nom || ""}`.toLowerCase();
  return (
    nom.includes(q) ||
    entretien.titreOffre?.toLowerCase().includes(q) ||
    false
  );
}

function EmptyStateEntreprise() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center"
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
        <Calendar className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">
        {t("interviews.entreprise.emptyTitle")}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {t("interviews.entreprise.emptyDesc")}
      </p>
      <Link
        href="/candidats"
        className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {t("interviews.entreprise.viewApplications")}
      </Link>
    </motion.div>
  );
}

export default function EntretiensEntreprisePage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { data: entretiens, isLoading, isError } = useEntretiensEntreprise();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("toutes");
  const [vue, setVue] = useState("cartes");
  const [maintenant] = useState(() => Date.now());

  const VUES = [
    { valeur: "cartes", label: t("interviews.entreprise.viewCards"), Icon: LayoutGrid },
    { valeur: "agenda", label: t("interviews.entreprise.viewAgenda"), Icon: List },
    { valeur: "calendrier", label: t("interviews.entreprise.viewCalendar"), Icon: CalendarDays },
  ];

  const entretiensConfirmes = useMemo(() => {
    return (entretiens || [])
      .filter((e) => STATUTS_VISIBLES.includes(e.statut))
      .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
  }, [entretiens]);

  const { prochain, aVenir, termines } = useMemo(() => {
    const actifs = entretiensConfirmes.filter(
      (e) => !STATUTS_PASSES.includes(e.statut),
    );
    const passes = entretiensConfirmes.filter((e) =>
      STATUTS_PASSES.includes(e.statut),
    );
    return {
      prochain: actifs[0] || null,
      aVenir: actifs,
      termines: passes,
    };
  }, [entretiensConfirmes]);

  const aujourdhui = useMemo(() => {
    const auj = new Date(maintenant).toDateString();
    return aVenir.filter(
      (e) => new Date(e.dateHeure).toDateString() === auj,
    );
  }, [aVenir, maintenant]);

  const compteursFiltres = useMemo(() => {
    const list = entretiensConfirmes;
    return {
      a_venir: list.filter((e) => matchFiltreEntretien(e, "a_venir", maintenant))
        .length,
      aujourdhui: list.filter((e) =>
        matchFiltreEntretien(e, "aujourdhui", maintenant),
      ).length,
      termines: list.filter((e) => matchFiltreEntretien(e, "termines", maintenant))
        .length,
      annules: list.filter((e) => matchFiltreEntretien(e, "annules", maintenant))
        .length,
      offres_en_attente: list.filter((e) =>
        matchFiltreEntretien(e, "offres_en_attente", maintenant),
      ).length,
      offres_acceptees: list.filter((e) =>
        matchFiltreEntretien(e, "offres_acceptees", maintenant),
      ).length,
      offres_refusees: list.filter((e) =>
        matchFiltreEntretien(e, "offres_refusees", maintenant),
      ).length,
    };
  }, [entretiensConfirmes, maintenant]);

  const listeFiltree = useMemo(() => {
    return entretiensConfirmes
      .filter((e) => e.idEntretien !== prochain?.idEntretien)
      .filter(
        (e) =>
          matchFiltreEntretien(e, filtre, maintenant) &&
          matchRechercheEntreprise(e, recherche),
      );
  }, [entretiensConfirmes, prochain, filtre, recherche, maintenant]);

  const aVenirFiltres = listeFiltree.filter(
    (e) => !STATUTS_PASSES.includes(e.statut),
  );
  const terminesFiltres = listeFiltree.filter((e) =>
    STATUTS_PASSES.includes(e.statut),
  );
  const aujourdhuiFiltres = aVenirFiltres.filter(
    (e) =>
      new Date(e.dateHeure).toDateString() ===
      new Date(maintenant).toDateString(),
  );
  const aVenirSansAujourdhui = aVenirFiltres.filter(
    (e) =>
      new Date(e.dateHeure).toDateString() !==
      new Date(maintenant).toDateString(),
  );

  const aDesEntretiens = entretiensConfirmes.length > 0;

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: t("interviews.entreprise.breadcrumb") }]}
        subtitle={t("interviews.entreprise.pageSubtitle")}
        refreshKeys={["entretiensEntreprise"]}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6">
        {isLoading && <EntretiensSkeleton />}

        {isError && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {t("interviews.entreprise.loadError")}
          </p>
        )}

        {!isLoading && !isError && (
          <>
            <EntretiensHeaderStats
              entretiens={entretiensConfirmes}
              maintenant={maintenant}
            />

            {!aDesEntretiens ? (
              <EmptyStateEntreprise />
            ) : (
              <>
                {prochain && (
                  <ProchainEntretienHighlightEntreprise
                    entretien={prochain}
                    maintenant={maintenant}
                  />
                )}

                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      {t("interviews.entreprise.allInterviews")}
                    </h3>
                    <div className="flex gap-1 self-start rounded-xl bg-muted p-1 sm:self-auto">
                      {VUES.map((v) => (
                        <button
                          key={v.valeur}
                          type="button"
                          onClick={() => setVue(v.valeur)}
                          aria-pressed={vue === v.valeur}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                            vue === v.valeur
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <v.Icon className="size-3.5" />
                          <span className="hidden sm:inline">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <EntretiensFiltersBar
                    recherche={recherche}
                    onRechercheChange={setRecherche}
                    filtreActif={filtre}
                    onFiltreChange={setFiltre}
                    compteurs={compteursFiltres}
                  />
                </div>

                {vue === "cartes" && (
                  <div className="space-y-8">
                    {listeFiltree.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                        {t("interviews.entreprise.noMatch")}{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setFiltre("toutes");
                            setRecherche("");
                          }}
                          className="font-semibold text-primary hover:underline"
                        >
                          {t("interviews.entreprise.showAll")}
                        </button>
                      </p>
                    ) : (
                      <>
                        {aujourdhuiFiltres.length > 0 && (
                          <SectionCartes
                            titre={t("interviews.entreprise.sectionToday")}
                            count={aujourdhuiFiltres.length}
                            accent
                          >
                            {aujourdhuiFiltres.map((e, i) => (
                              <EntretienCardEntreprise
                                key={e.idEntretien}
                                entretien={e}
                                maintenant={maintenant}
                                index={i}
                              />
                            ))}
                          </SectionCartes>
                        )}

                        {aVenirSansAujourdhui.length > 0 && (
                          <SectionCartes
                            titre={t("interviews.entreprise.sectionUpcoming")}
                            count={aVenirSansAujourdhui.length}
                          >
                            {aVenirSansAujourdhui.map((e, i) => (
                              <EntretienCardEntreprise
                                key={e.idEntretien}
                                entretien={e}
                                maintenant={maintenant}
                                index={i}
                              />
                            ))}
                          </SectionCartes>
                        )}

                        {terminesFiltres.length > 0 && (
                          <SectionCartes
                            titre={t("interviews.entreprise.sectionCompleted")}
                            count={terminesFiltres.length}
                          >
                            {terminesFiltres.map((e, i) => (
                              <EntretienCardEntreprise
                                key={e.idEntretien}
                                entretien={e}
                                maintenant={maintenant}
                                index={i}
                              />
                            ))}
                          </SectionCartes>
                        )}
                      </>
                    )}
                  </div>
                )}

                {vue === "agenda" && (
                  <EntretiensAgenda
                    entretiens={listeFiltree}
                    maintenant={maintenant}
                    onVoirDetails={() => {}}
                  />
                )}

                {vue === "calendrier" && (
                  <EntretiensCalendrier
                    entretiens={listeFiltree}
                    maintenant={maintenant}
                    CardComponent={EntretienCardEntreprise}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

function SectionCartes({ titre, count, children, accent = false }) {
  return (
    <section>
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        {titre}
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
            accent
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {count}
        </span>
      </h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        {children}
      </div>
    </section>
  );
}
