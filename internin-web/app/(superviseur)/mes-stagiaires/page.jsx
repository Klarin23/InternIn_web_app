"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FiUsers,
  FiSearch,
  FiX,
  FiBriefcase,
  FiClock,
  FiCheckCircle,
  FiArrowDown,
  FiList,
  FiBarChart2,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import StagiaireCard from "@/components/features/mes-stagiaires/StagiaireCard";
import VueComparative from "@/components/features/mes-stagiaires/VueComparative";
import { SupervisionProvider } from "@/lib/supervision/SupervisionContext";
import { useMesStagiaires } from "@/lib/queries/useSuperviseur";
import { cn } from "@/lib/utils";

const JOURS_ALERTE_FIN_STAGE = 30;

const FILTRES = [
  { valeur: "tous", label: "Tous" },
  { valeur: "en_cours", label: "En cours" },
  { valeur: "bientot_termine", label: "Bientôt terminé" },
  { valeur: "termine", label: "Terminé" },
];

const OPTIONS_TRI = [
  { valeur: "nom", label: "Nom (A→Z)" },
  { valeur: "progression", label: "Progression" },
  { valeur: "activite", label: "Dernière activité" },
];

function estBientotTermine(s) {
  if (s.statutStage !== "actif") return false;
  const dansTrenteJours = new Date();
  dansTrenteJours.setDate(dansTrenteJours.getDate() + JOURS_ALERTE_FIN_STAGE);
  return new Date(s.dateFinPrevue) <= dansTrenteJours;
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border bg-card p-5"
        >
          <div className="mb-4 flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-40 rounded bg-muted" />
            </div>
          </div>
          <div className="mb-4 space-y-2">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-3 w-36 rounded bg-muted" />
          </div>
          <div className="mb-3 h-6 w-20 rounded-full bg-muted" />
          <div className="mb-4 h-2 w-full rounded-full bg-muted" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 rounded-md bg-muted" />
            <div className="h-8 rounded-md bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MesStagiairesPageContent() {
  const { data: stagiaires, isLoading } = useMesStagiaires();
  const [vueActive, setVueActive] = useState("liste");
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [tri, setTri] = useState("nom");
  const reduceMotion = useReducedMotion();

  const stats = useMemo(() => {
    const list = stagiaires || [];
    return {
      total: list.length,
      enCours: list.filter((s) => s.statutStage === "actif").length,
      bientot: list.filter((s) => estBientotTermine(s)).length,
      termines: list.filter((s) => s.statutStage === "termine").length,
    };
  }, [stagiaires]);

  const compteursFiltre = useMemo(() => {
    const list = stagiaires || [];
    return {
      tous: list.length,
      en_cours: list.filter((s) => s.statutStage === "actif").length,
      bientot_termine: list.filter((s) => estBientotTermine(s)).length,
      termine: list.filter((s) => s.statutStage === "termine").length,
    };
  }, [stagiaires]);

  const resultats = useMemo(() => {
    if (!stagiaires) return [];
    const rechercheNormalisee = recherche.trim().toLowerCase();
    let liste = stagiaires.filter((s) => {
      if (rechercheNormalisee) {
        const nomComplet = `${s.prenom} ${s.nom}`.toLowerCase();
        if (!nomComplet.includes(rechercheNormalisee)) return false;
      }
      if (filtre === "en_cours") return s.statutStage === "actif";
      if (filtre === "bientot_termine") return estBientotTermine(s);
      if (filtre === "termine") return s.statutStage === "termine";
      return true;
    });
    liste = [...liste].sort((a, b) => {
      if (tri === "progression") return b.progression - a.progression;
      if (tri === "activite") {
        const dateA = a.derniereActivite ? new Date(a.derniereActivite) : 0;
        const dateB = b.derniereActivite ? new Date(b.derniereActivite) : 0;
        return dateB - dateA;
      }
      return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`);
    });
    return liste;
  }, [stagiaires, recherche, filtre, tri]);

  function resetFiltres() {
    setRecherche("");
    setFiltre("tous");
  }

  const miniStats = [
    {
      label: "Total",
      value: stats.total,
      icon: FiUsers,
      className: "text-primary bg-primary/10",
    },
    {
      label: "En cours",
      value: stats.enCours,
      icon: FiBriefcase,
      className: "text-secondary bg-secondary/10",
    },
    {
      label: "Bientôt terminés",
      value: stats.bientot,
      icon: FiClock,
      className: "text-amber-700 bg-amber-500/15 dark:text-amber-400",
    },
    {
      label: "Terminés",
      value: stats.termines,
      icon: FiCheckCircle,
      className: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-400",
    },
  ];

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: "Mes stagiaires" }]}
        subtitle="Stagiaires que vous encadrez actuellement"
        refreshKeys={["mesStagiaires"]}
      />

      <div className="px-4 py-6 sm:px-6">
        <div className="mb-6">
          <div
            className="inline-flex rounded-xl border border-border bg-muted/40 p-1"
            role="tablist"
            aria-label="Choisir la vue"
          >
            <button
              type="button"
              role="tab"
              aria-selected={vueActive === "liste"}
              onClick={() => setVueActive("liste")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                vueActive === "liste"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <FiList className="h-4 w-4" />
              Liste
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={vueActive === "comparaison"}
              onClick={() => setVueActive("comparaison")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                vueActive === "comparaison"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <FiBarChart2 className="h-4 w-4" />
              Comparaison
            </button>
          </div>
        </div>

        {vueActive === "comparaison" ? (
          <VueComparative stagiaires={stagiaires || []} isLoading={isLoading} />
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Mes stagiaires
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats.total} stagiaire{stats.total > 1 ? "s" : ""} sous votre
                  supervision
                </p>
                {!isLoading && stats.total > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {miniStats.map((s) => (
                      <div
                        key={s.label}
                        className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-1.5 shadow-sm"
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-md ${s.className}`}
                        >
                          <s.icon className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {s.label}
                          </p>
                          <p className="text-sm font-bold tabular-nums text-foreground">
                            {s.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative w-full sm:w-auto">
                <FiArrowDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={tri}
                  onChange={(e) => setTri(e.target.value)}
                  aria-label="Trier les stagiaires"
                  className="h-11 w-full appearance-none rounded-xl border border-border bg-card pl-9 pr-8 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-56"
                >
                  {OPTIONS_TRI.map((o) => (
                    <option key={o.valeur} value={o.valeur}>
                      Trier par : {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative w-full lg:max-w-sm">
                <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher un stagiaire..."
                  className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm text-foreground shadow-sm placeholder:text-muted-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <AnimatePresence>
                  {recherche && (
                    <motion.button
                      type="button"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setRecherche("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label="Effacer la recherche"
                    >
                      <FiX className="h-4 w-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative -mx-1 overflow-x-auto px-1 pb-0.5">
                <div
                  className="inline-flex min-w-min gap-1 rounded-xl border border-border bg-muted/40 p-1"
                  role="tablist"
                  aria-label="Filtrer les stagiaires"
                >
                  {FILTRES.map((f) => {
                    const actif = filtre === f.valeur;
                    const count = compteursFiltre[f.valeur] ?? 0;
                    return (
                      <button
                        key={f.valeur}
                        type="button"
                        role="tab"
                        aria-selected={actif}
                        onClick={() => setFiltre(f.valeur)}
                        className={`relative z-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                          actif
                            ? "text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {actif && (
                          <motion.span
                            layoutId={reduceMotion ? undefined : "filtre-pill"}
                            className="absolute inset-0 -z-10 rounded-lg bg-primary shadow-sm"
                            transition={{ duration: 0.2, ease: "easeOut" }}
                          />
                        )}
                        {f.label}
                        <span
                          className={`ml-1.5 tabular-nums ${
                            actif
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {isLoading && <SkeletonCards />}

            {stagiaires && stagiaires.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FiUsers className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Aucun stagiaire affecté
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Les stagiaires qui vous seront attribués apparaîtront ici.
                </p>
              </div>
            )}

            {stagiaires && stagiaires.length > 0 && resultats.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FiSearch className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Aucun résultat pour ces critères
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Essayez de modifier la recherche ou le filtre actif.
                </p>
                <button
                  type="button"
                  onClick={resetFiltres}
                  className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
                >
                  Effacer les filtres
                </button>
              </div>
            )}

            {resultats.length > 0 && (
              <motion.div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                initial={reduceMotion ? false : "hidden"}
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.04 },
                  },
                }}
              >
                {resultats.map((s, i) => (
                  <StagiaireCard key={s.idStage} stagiaire={s} index={i} />
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </>
  );
}


export default function MesStagiairesPage() {
  return (
    <SupervisionProvider>
      <MesStagiairesPageContent />
    </SupervisionProvider>
  );
}
