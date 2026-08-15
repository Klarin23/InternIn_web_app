"use client";
// Centre de suivi des candidatures — refonte UI/UX + animations.
// Aucune donnée/logique métier réécrite : mêmes hooks, mêmes statuts,
// mêmes routes. Voir lib/candidatures/statut.js pour la logique partagée
// (déplacée depuis ce fichier, inchangée).

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppHeader from "@/components/layout/AppHeader";
import CandidaturesStatsRow from "@/components/features/candidatures/CandidaturesStatsRow";
import CandidaturesFiltersBar from "@/components/features/candidatures/CandidaturesFiltersBar";
import CandidatureCard from "@/components/features/candidatures/CandidatureCard";
import CandidatureSuiviDrawer from "@/components/features/candidatures/CandidatureSuiviDrawer";
import CandidaturesSkeleton from "@/components/features/candidatures/CandidaturesSkeleton";
import CandidaturesEmptyState from "@/components/features/candidatures/CandidaturesEmptyState";
import { useMesCandidatures } from "@/lib/queries/useMesCandidatures";
import { useMesEntretiens } from "@/lib/queries/useEntretiens";
import { useMesOffresFinales } from "@/lib/queries/useOffresFinales";
import OffresFinalesRecues from "@/components/features/offres-finales/OffresFinalesRecues";
import { matchFiltre, matchRecherche } from "@/lib/candidatures/statut";
import { useTranslation } from "@/lib/i18n/useTranslation";

const OPTIONS_TRI = [
  {
    valeur: "recentes",
    labelKey: "candidatures.sort.recent",
  },
  {
    valeur: "anciennes",
    labelKey: "candidatures.sort.oldest",
  },
  {
    valeur: "entreprise",
    labelKey: "candidatures.sort.company",
  },
];

export default function CandidaturesPage() {
   const { t, locale } = useTranslation();

  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("toutes");
  const [tri, setTri] = useState("recentes");
  const [candidatureOuverte, setCandidatureOuverte] = useState(null);
  // Figé au montage (initialiseur paresseux) : Date.now() n'est appelé
  // qu'une seule fois, pas à chaque rendu.
  const [maintenant] = useState(() => Date.now());

  const { data: candidatures, isLoading, isError } = useMesCandidatures();
  const { data: entretiens } = useMesEntretiens();
  const { data: offresFinales } = useMesOffresFinales();

  function offreFinalePour(candidature) {
    return offresFinales?.find(
      (o) => o.idCandidature === candidature.idCandidature,
    );
  }

  const resultats = useMemo(() => {
    let liste = (candidatures || []).filter(
      (c) => matchFiltre(c, entretiens, filtre) && matchRecherche(c, recherche),
    );

    liste = [...liste].sort((a, b) => {
      if (tri === "anciennes")
        return new Date(a.dateCandidature) - new Date(b.dateCandidature);
      if (tri === "entreprise")
        return a.nomEntreprise.localeCompare(b.nomEntreprise);
      return new Date(b.dateCandidature) - new Date(a.dateCandidature); // recentes
    });

    return liste;
  }, [candidatures, entretiens, filtre, recherche, tri]);

  const aDesCandidatures = (candidatures?.length ?? 0) > 0;

  return (
    <>
      <AppHeader
        title={t("candidatures.pageTitle")}
        subtitle={t("candidatures.pageSubtitle")}
        refreshKeys={["mesCandidatures", "mesEntretiens", "mesOffresFinales"]}
      />
      <div className="space-y-6 px-6 py-6">
        <OffresFinalesRecues />

        {/* En-tête animé */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-end justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {t("candidatures.pageTitle")}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {t("candidatures.pageSubtitle")}
            </p>
          </div>
          {aDesCandidatures && (
            <span className="hidden text-sm font-semibold text-muted-foreground sm:block">
              {candidatures.length === 1
                ? t("candidatures.countOne", {
                    n: candidatures.length,
                  })
                : t("candidatures.countMany", {
                    n: candidatures.length,
                  })}
            </span>
          )}
        </motion.div>

        {isLoading && <CandidaturesSkeleton />}

        {isError && (
          <p className="text-sm text-destructive">
            {t("candidatures.loadError")}
          </p>
        )}

        {candidatures && !aDesCandidatures && (
          <CandidaturesEmptyState variante="aucune" />
        )}

        {candidatures && aDesCandidatures && (
          <>
            <CandidaturesStatsRow
              candidatures={candidatures}
              entretiens={entretiens}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CandidaturesFiltersBar
                recherche={recherche}
                onRechercheChange={setRecherche}
                filtreActif={filtre}
                onFiltreChange={setFiltre}
              />
              <select
                value={tri}
                onChange={(e) => setTri(e.target.value)}
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground sm:w-auto"
              >
                {OPTIONS_TRI.map((o) => (
                  <option key={o.valeur} value={o.valeur}>
                    {t("candidatures.sort.prefix")} {t(o.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {resultats.length === 0 ? (
              <CandidaturesEmptyState
                variante="filtre"
                onReinitialiser={() => {
                  setFiltre("toutes");
                  setRecherche("");
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {resultats.map((c, i) => (
                    <CandidatureCard
                      key={c.idCandidature}
                      candidature={c}
                      entretiens={entretiens}
                      offreFinale={offreFinalePour(c)}
                      maintenant={maintenant}
                      index={i}
                      onVoirSuivi={setCandidatureOuverte}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      <CandidatureSuiviDrawer
        candidature={candidatureOuverte}
        entretiens={entretiens}
        offreFinale={
          candidatureOuverte ? offreFinalePour(candidatureOuverte) : null
        }
        onClose={() => setCandidatureOuverte(null)}
      />
    </>
  );
}
