"use client";

import { useState, useMemo } from "react";
import { FiLoader, FiUsers } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import StagiaireFiltresTabs from "@/components/features/suivi-stagiaires/StagiaireFiltresTabs";
import StagiaireListItem from "@/components/features/suivi-stagiaires/StagiaireListItem";
import StagiaireDetailPanel from "@/components/features/suivi-stagiaires/StagiaireDetailPanel";
import { useMesStages } from "@/lib/queries/useStages";

export default function SuiviStagiairesPage() {
  const { data: stages, isLoading } = useMesStages();
  const [filtre, setFiltre] = useState("tous");
  const [selectedId, setSelectedId] = useState(null);
  const [statutsCalcules, setStatutsCalcules] = useState({});

  const handleStatutCalcule = (idStage, statut) => {
    setStatutsCalcules((prev) =>
      prev[idStage] === statut ? prev : { ...prev, [idStage]: statut },
    );
  };

  const counts = useMemo(() => {
    const c = { en_cours: 0, fin_proche: 0, alerte: 0, termine: 0 };
    Object.values(statutsCalcules).forEach((s) => {
      if (c[s] !== undefined) c[s]++;
    });
    return c;
  }, [statutsCalcules]);

  const stagesFiltres = (stages || []).filter(
    (s) => filtre === "tous" || statutsCalcules[s.idStage] === filtre,
  );

  const selected =
    (stages || []).find((s) => s.idStage === selectedId) ||
    stagesFiltres[0] ||
    null;
  const selectedIndex = (stages || []).findIndex(
    (s) => s.idStage === selected?.idStage,
  );

  return (
    <>
      <AppHeader breadcrumb={[{ label: "Suivi des stagiaires" }]} />
      <div className="px-6 py-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Suivi des stagiaires
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {stages?.length ?? 0} stagiaire
              {(stages?.length ?? 0) > 1 ? "s" : ""} actif
              {(stages?.length ?? 0) > 1 ? "s" : ""}
              {counts.alerte > 0 && ` · ${counts.alerte} alerte(s)`}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <StagiaireFiltresTabs
            value={filtre}
            onChange={setFiltre}
            counts={counts}
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {stages && stages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FiUsers className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucun stagiaire actif pour l&apos;instant
            </p>
          </div>
        )}

        {stages && stages.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
            <div className="space-y-3">
              {(stages || []).map((s, i) => (
                <StagiaireListItem
                  key={s.idStage}
                  stage={s}
                  index={i}
                  isSelected={selected?.idStage === s.idStage}
                  onClick={() => setSelectedId(s.idStage)}
                  onStatutCalcule={handleStatutCalcule}
                />
              ))}
            </div>

            {selected && (
              <StagiaireDetailPanel
                stage={selected}
                index={Math.max(selectedIndex, 0)}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
