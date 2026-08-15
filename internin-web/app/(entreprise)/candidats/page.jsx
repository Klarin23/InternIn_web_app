"use client";

import { useState } from "react";
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
import { useCandidaturesEntreprise } from "@/lib/queries/useCandidaturesEntreprise";
import { useEntretiensEntreprise } from "@/lib/queries/useEntretiens";
import { useCandidaturesFraiches } from "@/lib/hooks/useCandidaturesFraiches";

// Statuts d'entretien à signaler dans la liste (nécessitent une action ou
// une attention de l'entreprise)
const STATUTS_ENTRETIEN_A_SIGNALER = ["planifie", "reprogramme", "valide"];

export default function CandidatsPage() {
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
  const entretienASignalerParCandidature = {};
  entretiens?.forEach((e) => {
    if (STATUTS_ENTRETIEN_A_SIGNALER.includes(e.statut)) {
      entretienASignalerParCandidature[e.idCandidature] = e;
    }
  });

  // Tous les entretiens, peu importe leur statut — nécessaire au Kanban
  // pour savoir si une candidature "présélectionnée" a déjà un entretien
  // actif (donc doit apparaître dans la colonne "Entretien").
  const entretienParCandidature = {};
  entretiens?.forEach((e) => {
    entretienParCandidature[e.idCandidature] = e;
  });

  const filtrees = (candidatures || []).filter((c) => {
    const matchStatut = filtre === "tous" || c.statut === filtre;
    const matchRecherche =
      !recherche ||
      `${c.prenom} ${c.nom}`.toLowerCase().includes(recherche.toLowerCase());
    return matchStatut && matchRecherche;
  });

  const totalCandidats = candidatures?.length ?? 0;
  const enEntretien =
    candidatures?.filter((c) => c.statut === "preselectionnee").length ?? 0;

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: "Candidatures" }]}
        subtitle="Gérez les candidatures reçues sur vos offres"
        refreshKeys={["candidaturesEntreprise", "entretiensEntreprise"]}
      />
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Candidatures</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalCandidats} candidat{totalCandidats > 1 ? "s" : ""} ·{" "}
            {enEntretien} en entretien
          </p>
        </div>

        <CandidaturesDashboard
          candidatures={candidatures}
          entretiens={entretiens}
        />

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-262.5 flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un candidat..."
              className="h-10 rounded-full pl-10"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <CandidaturesFiltres value={filtre} onChange={setFiltre} />

            <div className="flex items-center gap-1 rounded-sm border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setVue("liste")}
                className={`flex h-8 w-8 items-center justify-center rounded-sm ${vue === "liste" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                title="Vue liste"
              >
                <FiList className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setVue("kanban")}
                className={`flex h-8 w-8 items-center justify-center rounded-sm ${vue === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                title="Vue Kanban"
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
            candidaturesFraiches={candidaturesFraiches}
            onOpen={setCandidatOuvert}
          />
        )}

        {!isLoading && vue === "liste" && (
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <div className="grid grid-cols-[1.6fr_1.2fr_1fr_0.8fr_0.9fr_0.9fr] gap-3 border-b border-border bg-muted/40 px-2 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <span>Candidat</span>
              <span>Université</span>
              <span>Offre</span>
              <span>Statut</span>
              <span>Complétude</span>
              <span>Date</span>
            </div>

            {filtrees.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <FiInbox className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Aucun candidat ne correspond
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
