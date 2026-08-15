"use client";
// Centre de gestion des entretiens — refonte UI/UX + animations.
// Aucune logique métier réécrite : mêmes hooks, mêmes statuts, mêmes
// mutations (voir EntretienCardStagiaire.jsx et lib/entretiens/statut.js).

import { useMemo, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import EntretiensHeaderStats from "@/components/features/entretiens/EntretiensHeaderStats";
import ProchainEntretienHighlight from "@/components/features/entretiens/ProchainEntretienHighlight";
import EntretienCardStagiaire from "@/components/features/entretiens/EntretienCardStagiaire";
import EntretienDetailsDrawer from "@/components/features/entretiens/EntretienDetailsDrawer";
import EntretiensHistorique from "@/components/features/entretiens/EntretiensHistorique";
import EntretiensAgenda from "@/components/features/entretiens/EntretiensAgenda";
import EntretiensCalendrier from "@/components/features/entretiens/EntretiensCalendrier";
import EntretiensFiltersBar from "@/components/features/entretiens/EntretiensFiltersBar";
import EntretiensSkeleton from "@/components/features/entretiens/EntretiensSkeleton";
import EntretiensEmptyState from "@/components/features/entretiens/EntretiensEmptyState";
import { useMesEntretiens } from "@/lib/queries/useEntretiens";
import { useMesCandidatures } from "@/lib/queries/useMesCandidatures";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  STATUTS_PASSES,
  matchFiltreEntretien,
  matchRechercheEntretien,
} from "@/lib/entretiens/statut";

export default function EntretiensPage() {
  const { t } = useTranslation();
  const [idEntretienOuvert, setIdEntretienOuvert] = useState(null);
  const [vue, setVue] = useState("cartes");
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("a_venir");
  // Figé au montage (initialiseur paresseux) : Date.now() n'est appelé
  // qu'une seule fois, pas à chaque rendu.
  const [maintenant] = useState(() => Date.now());

  const { data: entretiens, isLoading, isError } = useMesEntretiens();
  const { data: candidatures } = useMesCandidatures();

  const { prochain, aVenir } = useMemo(() => {
    const actifs = [...(entretiens || [])]
      .filter((e) => !STATUTS_PASSES.includes(e.statut))
      .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
    return { prochain: actifs[0] || null, aVenir: actifs };
  }, [entretiens]);

  const autresAVenir = prochain ? aVenir.slice(1) : aVenir;
  const aDesEntretiens = (entretiens?.length ?? 0) > 0;
  const aDesCandidatures = (candidatures?.length ?? 0) > 0;

  const listeFiltree = useMemo(() => {
    return (entretiens || [])
      .filter((e) => e.idEntretien !== prochain?.idEntretien)
      .filter(
        (e) =>
          matchFiltreEntretien(e, filtre, maintenant) &&
          matchRechercheEntretien(e, recherche),
      );
  }, [entretiens, prochain, filtre, recherche, maintenant]);

  return (
    <>
      <AppHeader
        title={t("interviews.pageTitle")}
        subtitle={t("interviews.pageSubtitle")}
        refreshKeys={["mesEntretiens", "mesCandidatures"]}
      />
      <div className="space-y-6 px-6 py-6">
        {isLoading && <EntretiensSkeleton />}

        {isError && (
          <p className="text-sm text-destructive">{t("interviews.error")}</p>
        )}

        {entretiens && (
          <>
            <EntretiensHeaderStats
              entretiens={entretiens}
              maintenant={maintenant}
            />

            {!aDesEntretiens ? (
              <EntretiensEmptyState aDesCandidatures={aDesCandidatures} />
            ) : (
              <>
                {prochain && (
                  <ProchainEntretienHighlight
                    entretien={prochain}
                    maintenant={maintenant}
                    onVoirDetails={(e) => setIdEntretienOuvert(e.idEntretien)}
                  />
                )}

                {entretiens.length > (prochain ? 1 : 0) && (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-bold text-foreground">
                        {t("interviews.views.all")}
                      </h3>
                      <div className="flex gap-1 self-start rounded-sm bg-muted p-1 sm:self-auto">
                        {[
                          {
                            valeur: "cartes",
                            label: t("interviews.views.cards"),
                          },
                          {
                            valeur: "agenda",
                            label: t("interviews.views.agenda"),
                          },
                          {
                            valeur: "calendrier",
                            label: t("interviews.views.calendar"),
                          },
                        ].map((v) => (
                          <button
                            key={v.valeur}
                            type="button"
                            onClick={() => setVue(v.valeur)}
                            className={`rounded-sm px-2.5 py-1 text-xs font-semibold transition-colors active:scale-95 ${
                              vue === v.valeur
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground"
                            }`}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <EntretiensFiltersBar
                      recherche={recherche}
                      onRechercheChange={setRecherche}
                      filtreActif={filtre}
                      onFiltreChange={setFiltre}
                    />

                    {listeFiltree.length === 0 ? (
                      <p className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                        {t("interviews.filters.noResult")}{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setFiltre("toutes");
                            setRecherche("");
                          }}
                          className="font-semibold text-[#14b8a6] hover:underline"
                        >
                          {t("interviews.filters.showAll")}
                        </button>
                      </p>
                    ) : (
                      <>
                        {vue === "cartes" && (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {listeFiltree.map((e, i) => (
                              <EntretienCardStagiaire
                                key={e.idEntretien}
                                entretien={e}
                                index={i}
                              />
                            ))}
                          </div>
                        )}

                        {vue === "agenda" && (
                          <EntretiensAgenda
                            entretiens={listeFiltree}
                            maintenant={maintenant}
                            onVoirDetails={(e) =>
                              setIdEntretienOuvert(e.idEntretien)
                            }
                          />
                        )}

                        {vue === "calendrier" && (
                          <EntretiensCalendrier
                            entretiens={listeFiltree}
                            maintenant={maintenant}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}

                {filtre === "a_venir" && !recherche && (
                  <EntretiensHistorique entretiens={entretiens} />
                )}
              </>
            )}
          </>
        )}
      </div>

      <EntretienDetailsDrawer
        entretien={
          entretiens?.find((e) => e.idEntretien === idEntretienOuvert) || null
        }
        onClose={() => setIdEntretienOuvert(null)}
      />
    </>
  );
}
