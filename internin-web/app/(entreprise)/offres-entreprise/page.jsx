"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import {
  FiLoader,
  FiBriefcase,
  FiXCircle,
  FiUsers,
  FiCalendar,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import OffresToolbar from "@/components/features/offres-entreprise/OffresToolbar";
import OffreCardEntreprise from "@/components/features/offres-entreprise/OffreCardEntreprise";
import CreerOffreCard from "@/components/features/offres-entreprise/CreerOffreCard";
import OffreFormDialog from "@/components/features/offres-entreprise/OffreFormDialog";
import { useMesOffres } from "@/lib/queries/useMesOffres";
import { useEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";
import StatCard from "@/components/features/dashboard-entreprise/StatCard";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { useEntretiensEntreprise } from "@/lib/queries/useEntretiens";
import { useCandidaturesEntreprise } from "@/lib/queries/useCandidaturesEntreprise";
import { AnimatePresence, motion } from "framer-motion";
import OffresViewToggle from "@/components/features/offres-entreprise/OffresViewToggle";
import OffreListRow from "@/components/features/offres-entreprise/OffreListRow";
import ActionsRapidesBanner from "@/components/features/offres-entreprise/ActionsRapidesBanner";

// Une offre "publie" dont la date limite de candidature est dépassée est
// considérée "Expirée" à l'affichage — ce n'est pas un statut stocké en
// base (le vrai statut reste "publie"), juste une lecture dérivée.
function estExpiree(offre) {
  return (
    offre.statut === "publie" &&
    offre.dateLimiteCandidature &&
    new Date(offre.dateLimiteCandidature) < new Date()
  );
}

function getVueSnapshot() {
  const saved = localStorage.getItem("offres-vue-preference");
  return saved === "liste" ? "liste" : "grille";
}
function getVueServerSnapshot() {
  return "grille"; // valeur rendue côté serveur, avant que localStorage soit lisible
}
function subscribeVue(callback) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function OffresEntreprisePage() {
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("tous");
  const [departement, setDepartement] = useState("tous");
  const [tri, setTri] = useState("recent");
  const [dialog, setDialog] = useState({ open: false, idOffre: null });
  const vue = useSyncExternalStore(subscribeVue, getVueSnapshot, getVueServerSnapshot);
  

  // ... dans le composant :


  function handleChangeVue(v) {
    localStorage.setItem("offres-vue-preference", v);
    window.dispatchEvent(new Event("storage")); // force useSyncExternalStore à relire la valeur immédiatement
  }

  const { data: offres, isLoading } = useMesOffres();
  const { data: profile } = useEntrepriseProfile();
    const peutGererStages = profile?.statutVerification === "verifiee";
  const { data: entretiens } = useEntretiensEntreprise();
  const { data: candidatures } = useCandidaturesEntreprise();

  const candidatsParOffre = useMemo(() => {
    const map = {};
    (candidatures || [])
      .slice()
      .sort((a, b) => new Date(b.dateCandidature) - new Date(a.dateCandidature))
      .forEach((c) => {
        (map[c.idOffre] ??= []).push(c);
      });
    return map;
  }, [candidatures]);

  const seuilPopulaire = useMemo(() => {
  if (!offres || offres.length === 0) return 10;
  const moyenne =
    offres.reduce((sum, o) => sum + o.nombreCandidatures, 0) / offres.length;
    return Math.max(5, Math.round(moyenne * 1.5));
  }, [offres]);

  const departements = useMemo(
    () => [
      ...new Set((offres || []).map((o) => o.departement).filter(Boolean)),
    ],
    [offres],
  );

  const offresFiltrees = useMemo(() => {
    let result = [...(offres || [])];

    if (statut === "expire") {
      result = result.filter(estExpiree);
    } else if (statut !== "tous") {
      result = result.filter((o) => o.statut === statut && !estExpiree(o));
    }

    if (departement !== "tous") {
      result = result.filter((o) => o.departement === departement);
    }

    if (recherche.trim()) {
      const q = recherche.toLowerCase();
      result = result.filter((o) => o.titre.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      const dA = new Date(a.datePublication || a.dateCreation || 0);
      const dB = new Date(b.datePublication || b.dateCreation || 0);
      return tri === "recent" ? dB - dA : dA - dB;
    });

    return result;
  }, [offres, statut, departement, recherche, tri]);

  const offresActives =
    offres?.filter((o) => o.statut === "publie").length ?? 0;
  const totalCandidatures =
    offres?.reduce((sum, o) => sum + o.nombreCandidatures, 0) ?? 0;
  
  const offresExpirees = offres?.filter(estExpiree).length ?? 0;
  const entretiensPlanifies =
    entretiens?.filter((e) => e.statut === "planifie").length ?? 0;

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: profile?.nomEntreprise || "Entreprise" },
          { label: "Offres de stage" },
        ]}
        subtitle="Publiez et gérez vos offres de stage"
        refreshKeys={["mesOffres", "entretiensEntreprise", "candidaturesEntreprise"]}
      />
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Offres de stage
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {offresActives} offre{offresActives > 1 ? "s" : ""} active
            {offresActives > 1 ? "s" : ""} · {totalCandidatures} candidature
            {totalCandidatures > 1 ? "s" : ""}
          </p>
        </div>

        <Stagger className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem className="h-full">
            <StatCard
              icon={FiBriefcase}
              value={offresActives}
              label="Offres actives"
              color="bg-success/10 text-green-700"
            />
          </StaggerItem>
          <StaggerItem className="h-full">
            <StatCard
              icon={FiXCircle}
              value={offresExpirees}
              label="Offres expirées"
              color="bg-destructive/10 text-destructive"
            />
          </StaggerItem>
          <StaggerItem className="h-full">
            <StatCard
              icon={FiUsers}
              value={totalCandidatures}
              label="Total des candidatures"
              color="bg-primary/10 text-primary"
              highlight
            />
          </StaggerItem>
          <StaggerItem className="h-full">
            <StatCard
              icon={FiCalendar}
              value={entretiensPlanifies}
              label="Entretiens planifiés"
              color="bg-accent/40 text-amber-700"
            />
          </StaggerItem>
        </Stagger>
        <ActionsRapidesBanner
          offres={offres}
          candidatures={candidatures}
          entretiens={entretiens}
        />

        <OffresToolbar
          recherche={recherche}
          onRechercheChange={setRecherche}
          statut={statut}
          onStatutChange={setStatut}
          departement={departement}
          onDepartementChange={setDepartement}
          departements={departements}
          tri={tri}
          onTriChange={setTri}
          onNouvelleOffre={() => {
            if (!peutGererStages) return;
            setDialog({ open: true, idOffre: null });
          }}
          peutCreerOffre={peutGererStages}
          vue={vue}
          onVueChange={handleChangeVue}
        />

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {offres && (
          <div
            className={
              vue === "grille"
                ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }
          >
            <AnimatePresence mode="popLayout">
              {offresFiltrees.map((offre, index) => (
                <motion.div
                  key={offre.idOffre}
                  layout
                  initial={{ opacity: 0, y: -28 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: index * 0.05,
                      duration: 0.4,
                      ease: "easeOut",
                    },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.92,
                    transition: { duration: 0.25, ease: "easeIn" },
                  }}
                >
                  {vue === "grille" ? (
                    <OffreCardEntreprise
                      offre={offre}
                      candidatsRecents={candidatsParOffre[offre.idOffre] || []}
                      seuilPopulaire={seuilPopulaire}
                      onEdit={(id) => setDialog({ open: true, idOffre: id })}
                    />
                  ) : (
                    <OffreListRow
                      offre={offre}
                      candidatsRecents={candidatsParOffre[offre.idOffre] || []}
                      seuilPopulaire={seuilPopulaire}
                      onEdit={(id) => setDialog({ open: true, idOffre: id })}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {vue === "grille" && (
              <CreerOffreCard
                disabled={!peutGererStages}
                onClick={() => {
                  if (!peutGererStages) return;
                  setDialog({ open: true, idOffre: null });
                }}
              />
            )}
          </div>
        )}

        {offres && offresFiltrees.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aucune offre ne correspond à ces critères.
          </p>
        )}
      </div>

      <OffreFormDialog
        open={dialog.open}
        idOffre={dialog.idOffre}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </>
  );
}
