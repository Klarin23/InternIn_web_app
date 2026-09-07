"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useState, useMemo, useSyncExternalStore } from "react";
import {
  FiLoader,
  FiBriefcase,
  FiXCircle,
  FiUsers,
  FiCalendar,
  FiTrendingUp,
  FiCheckCircle,
  FiTarget,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import OffresToolbar from "@/components/features/offres-entreprise/OffresToolbar";
import OffreCardEntreprise from "@/components/features/offres-entreprise/OffreCardEntreprise";
import CreerOffreCard from "@/components/features/offres-entreprise/CreerOffreCard";
import OffreFormDialog from "@/components/features/offres-entreprise/OffreFormDialog";
import { useMesOffres } from "@/lib/queries/useMesOffres";
import { useEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { useEntretiensEntreprise } from "@/lib/queries/useEntretiens";
import { useCandidaturesEntreprise } from "@/lib/queries/useCandidaturesEntreprise";
import { AnimatePresence, motion } from "framer-motion";
import OffreListRow from "@/components/features/offres-entreprise/OffreListRow";
import ActionsRapidesBanner from "@/components/features/offres-entreprise/ActionsRapidesBanner";

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
  return "grille";
}
function subscribeVue(callback) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function OffresEntreprisePage() {
  const { t } = useTranslation();
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("tous");
  const [departement, setDepartement] = useState("tous");
  const [tri, setTri] = useState("recent");
  const [dialog, setDialog] = useState({ open: false, idOffre: null });
  const vue = useSyncExternalStore(
    subscribeVue,
    getVueSnapshot,
    getVueServerSnapshot,
  );

  function handleChangeVue(v) {
    localStorage.setItem("offres-vue-preference", v);
    window.dispatchEvent(new Event("storage"));
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
    offres?.filter((o) => o.statut === "publie" && !estExpiree(o)).length ?? 0;
  const totalCandidatures =
    offres?.reduce((sum, o) => sum + (o.nombreCandidatures || 0), 0) ?? 0;
  const offresExpirees = offres?.filter(estExpiree).length ?? 0;
  const entretiensPlanifies =
    entretiens?.filter((e) => e.statut === "planifie").length ?? 0;

  // Aggregates for Recruitment Overview (from existing offre data only)
  const totalPreselectionnes =
    offres?.reduce((sum, o) => sum + (o.nombrePreselectionnes || 0), 0) ?? 0;
  const totalAcceptes =
    offres?.reduce((sum, o) => sum + (o.nombreAcceptes || 0), 0) ?? 0;
  const totalPostes =
    offres?.reduce((sum, o) => sum + (o.nombrePostes || 0), 0) ?? 0;
  const progressionGlobale =
    totalPostes > 0
      ? Math.min(100, Math.round((totalAcceptes / totalPostes) * 100))
      : 0;

  const kpis = [
    {
      icon: FiBriefcase,
      value: offresActives,
      label: t("entrepriseSpace.offers.activeOffers"),
      color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    },
    {
      icon: FiXCircle,
      value: offresExpirees,
      label: t("entrepriseSpace.offers.expiredOffers"),
      color: "bg-destructive/10 text-destructive",
    },
    {
      icon: FiUsers,
      value: totalCandidatures,
      label: t("entrepriseSpace.offers.totalApplications"),
      color: "bg-primary/10 text-primary",
      highlight: true,
    },
    {
      icon: FiCalendar,
      value: entretiensPlanifies,
      label: t("entrepriseSpace.offers.scheduledInterviews"),
      color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
  ];

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: profile?.nomEntreprise || "Entreprise" },
          { label: t("entrepriseSpace.offers.breadcrumb") },
        ]}
        subtitle={t("entrepriseSpace.offers.subtitle")}
        refreshKeys={[
          "mesOffres",
          "entretiensEntreprise",
          "candidaturesEntreprise",
        ]}
      />

      <div className="px-4 py-6 sm:px-6">
        {/* Header fort */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("entrepriseSpace.offers.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("entrepriseSpace.offers.headerDescription") ||
                "Pilotez vos recrutements et suivez la performance de chaque offre."}
            </p>
            <p className="mt-1.5 text-xs font-medium text-muted-foreground">
              {offresActives}{" "}
              {offresActives > 1
                ? t("entrepriseSpace.offers.activeCountOther", {
                    count: offresActives,
                  }).replace("{count} ", "")
                : t("entrepriseSpace.offers.activeCountOne", {
                    count: offresActives,
                  }).replace("{count} ", "")}{" "}
              · {totalCandidatures}{" "}
              {totalCandidatures > 1
                ? t("entrepriseSpace.offers.applicationsCountOther", {
                    count: totalCandidatures,
                  }).replace("{count} ", "")
                : t("entrepriseSpace.offers.applicationsCountOne", {
                    count: totalCandidatures,
                  }).replace("{count} ", "")}
            </p>
          </div>
        </div>

        {/* Zone KPI */}
        <Stagger className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.label} className="h-full">
              <div
                className={`flex h-full flex-col rounded-xl border border-border bg-card p-4 ${
                  kpi.highlight
                    ? "bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent"
                    : ""
                }`}
              >
                <div
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${kpi.color}`}
                >
                  <kpi.icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                  {kpi.value}
                </div>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  {kpi.label}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Vue d'ensemble du recrutement */}
        {(totalCandidatures > 0 || totalPostes > 0) && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiTrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                {t("entrepriseSpace.offers.recruitmentOverview") ||
                  "Vue d'ensemble du recrutement"}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FiUsers className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-lg font-bold tabular-nums text-foreground">
                    {totalCandidatures}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("entrepriseSpace.offers.applications")}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <FiTarget className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-lg font-bold tabular-nums text-foreground">
                    {totalPreselectionnes}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("entrepriseSpace.offers.preselected")}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <FiCheckCircle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-lg font-bold tabular-nums text-foreground">
                    {totalAcceptes}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("entrepriseSpace.offers.acceptedCandidates") ||
                      "Candidats retenus"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FiBriefcase className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-lg font-bold tabular-nums text-foreground">
                    {totalPostes}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("entrepriseSpace.offers.openPositions")}
                  </div>
                </div>
              </div>
            </div>

            {totalPostes > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    {t("entrepriseSpace.offers.globalProgress") ||
                      "Progression globale"}
                  </span>
                  <span className="tabular-nums font-semibold text-muted-foreground">
                    {totalAcceptes} / {totalPostes} · {progressionGlobale}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressionGlobale}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full bg-teal-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

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
            {t("entrepriseSpace.offers.loading")}
          </div>
        )}

        {offres && (
          <div
            className={
              vue === "grille"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }
          >
            <AnimatePresence mode="popLayout">
              {offresFiltrees.map((offre, index) => (
                <motion.div
                  key={offre.idOffre}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: Math.min(index * 0.04, 0.3),
                      duration: 0.3,
                      ease: "easeOut",
                    },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.2, ease: "easeIn" },
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
            {t("entrepriseSpace.offers.noMatch")}
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
