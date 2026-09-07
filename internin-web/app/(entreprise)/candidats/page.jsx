"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { FiLoader, FiInbox, FiSearch, FiList, FiColumns } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Input } from "@/components/ui/input";
import CandidaturesFiltres from "@/components/features/candidats/CandidaturesFiltres";
import CandidaturesDashboard from "@/components/features/candidats/CandidaturesDashboard";
import CandidatureRow from "@/components/features/candidats/CandidatureRow";
import CandidatsKanban from "@/components/features/candidats/CandidatsKanban";
import CandidatDetailDialog from "@/components/features/candidats/CandidatDetailDialog";
import ActionsATraiterPanel from "@/components/features/candidats/ActionsATraiterPanel";
import { useCandidaturesEntreprise } from "@/lib/queries/useCandidaturesEntreprise";
import { useEntretiensEntreprise } from "@/lib/queries/useEntretiens";
import { useCandidaturesFraiches } from "@/lib/hooks/useCandidaturesFraiches";

// Statuts d'entretien à signaler dans la liste (nécessitent une action ou
// une attention de l'entreprise)
const STATUTS_ENTRETIEN_A_SIGNALER = ["planifie", "reprogramme", "valide"];

// Seules les reprogrammations exigent une action entreprise immédiate
const STATUT_ACTION_REQUISE = "reprogramme";

export default function CandidatsPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const idOffreUrl = searchParams.get("idOffre") || undefined;

  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [candidatOuvert, setCandidatOuvert] = useState(null);
  const [vue, setVue] = useState("kanban");

  const { data: candidatures, isLoading } =
    useCandidaturesEntreprise(idOffreUrl);
  const { data: entretiens } = useEntretiensEntreprise();
  const candidaturesFraiches = useCandidaturesFraiches(candidatures);

  // Entretiens "à signaler" dans le tableau (reprogrammation/validation en
  // attente) — affichage spécifique du tableau uniquement.
  const entretienASignalerParCandidature = useMemo(() => {
    const map = {};
    (entretiens || []).forEach((e) => {
      if (STATUTS_ENTRETIEN_A_SIGNALER.includes(e.statut)) {
        map[e.idCandidature] = e;
      }
    });
    return map;
  }, [entretiens]);

  // Tous les entretiens, peu importe leur statut — nécessaire au Kanban
  // pour savoir si une candidature "présélectionnée" a déjà un entretien
  // actif (donc doit apparaître dans la colonne "Entretien").
  const entretienParCandidature = useMemo(() => {
    const map = {};
    (entretiens || []).forEach((e) => {
      map[e.idCandidature] = e;
    });
    return map;
  }, [entretiens]);

  // Demandes de reprogrammation nécessitant une action de l'entreprise
  const demandesATraiter = useMemo(() => {
    return (entretiens || []).filter((e) => e.statut === STATUT_ACTION_REQUISE);
  }, [entretiens]);

  const nbATraiter = demandesATraiter.length;

  // Filtre effectif dérivé : évite setState dans un useEffect
  const filtreEffectif =
    filtre === "a_traiter" && nbATraiter === 0 ? "tous" : filtre;

  const filtrees = useMemo(() => {
    return (candidatures || []).filter((c) => {
      const matchRecherche =
        !recherche ||
        `${c.prenom} ${c.nom}`.toLowerCase().includes(recherche.toLowerCase());

      if (!matchRecherche) return false;

      if (filtreEffectif === "a_traiter") {
        return (
          entretienASignalerParCandidature[c.idCandidature]?.statut ===
          STATUT_ACTION_REQUISE
        );
      }

      const matchStatut =
        filtreEffectif === "tous" || c.statut === filtreEffectif;
      return matchStatut;
    });
  }, [candidatures, filtreEffectif, recherche, entretienASignalerParCandidature]);

  // Compteurs pour la barre de navigation des filtres (sur l'ensemble non filtré par statut)
  const compteursFiltres = useMemo(() => {
    const list = candidatures || [];
    const count = (statut) => list.filter((c) => c.statut === statut).length;
    return {
      tous: list.length,
      soumise: count("soumise"),
      consultee: count("consultee"),
      preselectionnee: count("preselectionnee"),
      acceptee: count("acceptee"),
      rejetee: count("rejetee"),
      retiree: count("retiree"),
    };
  }, [candidatures]);

  const totalCandidats = candidatures?.length ?? 0;
  const enEntretien =
    candidatures?.filter((c) => c.statut === "preselectionnee").length ?? 0;

  function handleTraiter(demande) {
    // Ouvrir directement la fiche candidat associée à l'entretien
    const candidature = (candidatures || []).find(
      (c) => c.idCandidature === demande.idCandidature,
    );
    if (candidature) {
      setCandidatOuvert(candidature);
    } else {
      // Fallback : construire un objet minimal compatible avec le dialog
      // si la candidature n'est pas encore dans le cache (cas rare).
      setCandidatOuvert({
        idCandidature: demande.idCandidature,
        prenom: demande.prenom,
        nom: demande.nom,
        photoProfilUrl: demande.photoProfilUrl,
        titreOffre: demande.titreOffre,
        statut: "preselectionnee",
      });
    }
  }

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: t("entrepriseSpace.candidatures.title") }]}
        subtitle={t("entrepriseSpace.candidatures.subtitle")}
        refreshKeys={["candidaturesEntreprise", "entretiensEntreprise"]}
      />
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t("entrepriseSpace.candidatures.title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t(
              totalCandidats > 1
                ? "entrepriseSpace.candidatures.summaryCandidatesOther"
                : "entrepriseSpace.candidatures.summaryCandidatesOne",
              { count: totalCandidats },
            )} 
            · {t("entrepriseSpace.candidatures.summaryInInterview", { count: enEntretien })}
            {nbATraiter > 0 && (
              <>
                 
                · 
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  {t("entrepriseSpace.candidatures.summaryToHandle", { count: nbATraiter })}
                </span>
              </>
            )}
          </p>
        </div>

        <CandidaturesDashboard
          candidatures={candidatures}
          entretiens={entretiens}
        />

        {/* Section À traiter — visible uniquement s'il y a des actions */}
        <AnimatePresence>
          {nbATraiter > 0 && (
            <ActionsATraiterPanel
              key="actions-a-traiter"
              demandes={demandesATraiter}
              onTraiter={handleTraiter}
            />
          )}
        </AnimatePresence>

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-262.5 flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("entrepriseSpace.candidatures.searchPlaceholder")}
              className="h-10 rounded-full pl-10"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <CandidaturesFiltres
              value={filtre}
              onChange={setFiltre}
              nbATraiter={nbATraiter}
              compteurs={compteursFiltres}
            />

            <div className="flex items-center gap-1 rounded-sm border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setVue("liste")}
                className={`flex h-8 w-8 items-center justify-center rounded-sm ${vue === "liste" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                title={t("entrepriseSpace.candidatures.viewList")}
              >
                <FiList className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setVue("kanban")}
                className={`flex h-8 w-8 items-center justify-center rounded-sm ${vue === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                title={t("entrepriseSpace.candidatures.viewKanban")}
              >
                <FiColumns className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {!isLoading && vue === "kanban" && (
          <CandidatsKanban
            candidatures={filtrees}
            entretienParCandidature={entretienParCandidature}
            entretienASignalerParCandidature={
              entretienASignalerParCandidature
            }
            candidaturesFraiches={candidaturesFraiches}
            onOpen={setCandidatOuvert}
          />
        )}

        {!isLoading && vue === "liste" && (
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <div className="grid grid-cols-[1.6fr_1.2fr_1fr_0.8fr_0.9fr_0.9fr] gap-3 border-b border-border bg-muted/40 px-2 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <span>{t("entrepriseSpace.candidatures.colCandidate")}</span>
              <span>{t("entrepriseSpace.candidatures.colUniversity")}</span>
              <span>{t("entrepriseSpace.candidatures.colOffer")}</span>
              <span>{t("entrepriseSpace.candidatures.colStatus")}</span>
              <span>{t("entrepriseSpace.candidatures.colCompleteness")}</span>
              <span>{t("entrepriseSpace.candidatures.colDate")}</span>
            </div>

            {filtrees.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <FiInbox className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  {t("entrepriseSpace.candidatures.emptyNoMatch")}
                </p>
              </div>
            )}

            <AnimatePresence>
              {filtrees.map((c, i) => (
                <CandidatureRow
                  key={c.idCandidature}
                  candidature={c}
                  index={i}
                  onOpen={setCandidatOuvert}
                  entretienASignaler={
                    entretienASignalerParCandidature[c.idCandidature]
                  }
                  estNouvelle={candidaturesFraiches.has(c.idCandidature)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CandidatDetailDialog
        candidature={candidatOuvert}
        onClose={() => setCandidatOuvert(null)}
      />
    </>
  );
}
