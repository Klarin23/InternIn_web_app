"use client";

import { useMemo, useState } from "react";
import { FiLoader, FiUsers, FiSearch, FiX } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import StagiaireCard from "@/components/features/mes-stagiaires/StagiaireCard";
import { useMesStagiaires } from "@/lib/queries/useSuperviseur";

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

export default function MesStagiairesPage() {
  const { data: stagiaires, isLoading } = useMesStagiaires();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [tri, setTri] = useState("nom");

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

  return (
    <>
      <AppHeader breadcrumb={[{ label: "Mes stagiaires" }]} />
      <div className="px-6 py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Mes stagiaires
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {stagiaires?.length ?? 0} stagiaire
              {(stagiaires?.length ?? 0) > 1 ? "s" : ""} sous votre supervision
            </p>
          </div>

          <select
            value={tri}
            onChange={(e) => setTri(e.target.value)}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {OPTIONS_TRI.map((o) => (
              <option key={o.valeur} value={o.valeur}>
                Trier par : {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un stagiaire..."
              className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTRES.map((f) => (
              <button
                key={f.valeur}
                type="button"
                onClick={() => setFiltre(f.valeur)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filtre === f.valeur
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {stagiaires && stagiaires.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FiUsers className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucun stagiaire ne vous est encore affecté
            </p>
          </div>
        )}

        {stagiaires && stagiaires.length > 0 && resultats.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FiSearch className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucun résultat pour ces critères
            </p>
          </div>
        )}

        {resultats.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {resultats.map((s, i) => (
              <StagiaireCard key={s.idStage} stagiaire={s} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
