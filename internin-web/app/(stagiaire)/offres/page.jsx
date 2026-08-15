"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AppHeader from "@/components/layout/AppHeader";
import OffreCard from "@/components/features/offres/OffreCard";
import OffreCardSkeleton from "@/components/features/offres/OffreCardSkeleton";
import OffresEmptyState from "@/components/features/offres/OffresEmptyState";
import OffresFiltres from "@/components/features/offres/OffresFiltres";
import { useOffres } from "@/lib/queries/useOffres";
import { useMesCandidatures } from "@/lib/queries/useMesCandidatures";
import { estNouvelle } from "@/lib/constants/offres";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { markOffresAsSeen } from "@/lib/navigation/useNavItems";

const SEUIL_NOUVEAU_MS = 7 * 24 * 60 * 60 * 1000;

export default function OffresPage() {
  const { t } = useTranslation();
  const [recherche, setRecherche] = useState("");
  const [secteurActif, setSecteurActif] = useState(undefined);
  const [villeActive, setVilleActive] = useState(undefined);
  const [modeActif, setModeActif] = useState(undefined);
  const [remunerationActive, setRemunerationActive] = useState(undefined);
  const [vue, setVue] = useState("grille");
  const userId = useAuthStore((s) => s.user?.idUtilisateur);

    useEffect(() => {
      markOffresAsSeen(userId);
    }, [userId]);

  // Un seul appel, filtré uniquement par le texte recherché : les pastilles/
  // menus de filtres restent stables (calculés sur ce même jeu de données)
  // même après en avoir sélectionné un — tout le filtrage supplémentaire se
  // fait ensuite côté client.
  const {
    data: offres,
    isLoading,
    isError,
  } = useOffres({ recherche: recherche || undefined });

  // Candidatures déjà envoyées par l'étudiant : permet d'afficher un statut
  // sur la carte au lieu de laisser croire qu'il faut encore postuler.
  // Même source de données que la page de détail (useCandidatureStatut),
  // mais chargée une seule fois pour toute la liste plutôt qu'offre par offre.
  const { data: mesCandidatures } = useMesCandidatures();
  const candidaturesParOffre = useMemo(() => {
    const map = new Map();
    (mesCandidatures || []).forEach((c) => map.set(c.idOffre, c));
    return map;
  }, [mesCandidatures]);

  const secteurs = useMemo(() => {
    if (!offres) return [];
    return [
      ...new Set(offres.map((o) => o.secteurActivite).filter(Boolean)),
    ].sort();
  }, [offres]);

  const villes = useMemo(() => {
    if (!offres) return [];
    return [
      ...new Set(offres.map((o) => o.villeEntreprise).filter(Boolean)),
    ].sort();
  }, [offres]);

  const offresAffichees = useMemo(() => {
    if (!offres) return offres;
    return offres.filter((o) => {
      if (secteurActif && o.secteurActivite !== secteurActif) return false;
      if (villeActive && o.villeEntreprise !== villeActive) return false;
      if (modeActif && o.modeTravail !== modeActif) return false;
      if (remunerationActive && o.remunerationType !== remunerationActive)
        return false;
      return true;
    });
  }, [offres, secteurActif, villeActive, modeActif, remunerationActive]);

  // `Date.now()` est un appel impur : on ne peut pas l'invoquer directement
  // pendant le rendu (React Compiler le refuse, car ça produirait des
  // résultats instables d'un rendu à l'autre). On le fige donc une seule
  // fois, au montage de la page, via l'initialiseur paresseux de useState —
  // exactement le pattern recommandé pour ce genre de valeur (Date.now,
  // Math.random, etc.). Le badge "Nouveau" reste correct pour la durée de
  // la session ; un simple rechargement de page suffit à le rafraîchir.
  const [maintenant] = useState(() => Date.now());

  const nbNouvelles = useMemo(() => {
    if (!offres) return 0;
    return offres.filter((o) => estNouvelle(o.datePublication, maintenant))
      .length;
  }, [offres, maintenant]);

  const nbFiltresActifs = [
    secteurActif,
    villeActive,
    modeActif,
    remunerationActive,
  ].filter(Boolean).length;

  function reinitialiserFiltres() {
    setSecteurActif(undefined);
    setVilleActive(undefined);
    setModeActif(undefined);
    setRemunerationActive(undefined);
    setRecherche("");
  }

  return (
    <>
      <AppHeader
        title={t("offersPage.header.title")}
        subtitle={t("offersPage.header.subtitle")}
        refreshKeys={["offres", "mesCandidatures"]}
      />
      <div className="px-6 py-6">
        <OffresFiltres
          recherche={recherche}
          onRechercheChange={setRecherche}
          secteurs={secteurs}
          secteurActif={secteurActif}
          onSecteurChange={setSecteurActif}
          villes={villes}
          villeActive={villeActive}
          onVilleChange={setVilleActive}
          modeActif={modeActif}
          onModeChange={setModeActif}
          remunerationActive={remunerationActive}
          onRemunerationChange={setRemunerationActive}
          vue={vue}
          onVueChange={setVue}
        />

        {!isLoading && offresAffichees && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <AnimatePresence mode="wait">
              <motion.span
                key={offresAffichees.length}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="font-semibold text-foreground"
              >
                {t(
                  offresAffichees.length > 1
                    ? "offersPage.count.availablePlural"
                    : "offersPage.count.available",
                  { n: offresAffichees.length },
                )}
              </motion.span>
            </AnimatePresence>
            {nbNouvelles > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {t(
                  nbNouvelles > 1
                    ? "offersPage.count.newPlural"
                    : "offersPage.count.new",
                  { n: nbNouvelles },
                )}
              </span>
            )}
            {nbFiltresActifs > 0 && (
              <span className="text-xs">
                ·{" "}
                {t(
                  nbFiltresActifs > 1
                    ? "offersPage.count.filtersActivePlural"
                    : "offersPage.count.filtersActive",
                  { n: nbFiltresActifs },
                )}
              </span>
            )}
          </div>
        )}

        {isLoading && (
          <div
            className={
              vue === "liste"
                ? "flex flex-col gap-4"
                : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <OffreCardSkeleton key={i} vue={vue} index={i} />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            {t("offersPage.loadError")}
          </p>
        )}

        {!isLoading && offresAffichees && offresAffichees.length === 0 && (
          <OffresEmptyState
            onReset={reinitialiserFiltres}
            hasFiltres={Boolean(recherche) || nbFiltresActifs > 0}
          />
        )}

        {!isLoading && offresAffichees && offresAffichees.length > 0 && (
          <motion.div
            layout
            className={
              vue === "liste"
                ? "flex flex-col gap-4"
                : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            <AnimatePresence initial={false}>
              {offresAffichees.map((offre, index) => (
                <OffreCard
                  key={offre.idOffre}
                  offre={offre}
                  vue={vue}
                  index={index}
                  candidature={candidaturesParOffre.get(offre.idOffre)}
                  isNew={estNouvelle(offre.datePublication, maintenant)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </>
  );
}
