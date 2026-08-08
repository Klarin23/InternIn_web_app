"use client";

import { useState } from "react";
import {
  FiEye,
  FiCheckSquare,
  FiStar,
  FiFileText,
  FiMessageSquare,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import ApercuTab from "./tabs/ApercuTab";
import TachesTab from "./tabs/TachesTab";
import EvaluationTab from "./tabs/EvaluationTab";
import RapportsTab from "./tabs/RapportsTab";
import MessagesTab from "./tabs/MessagesTab";
import TerminerStageDialog from "@/components/features/stage/TerminerStageDialog";
import SignalerDialog from "./SignalerDialog";
import { useEvaluations } from "@/lib/queries/useEvaluations";
import {
  AVATAR_COLORS,
  getAvancement,
  getMoyenneDerniereEvaluation,
  getStatutAffichage,
  STATUT_CONFIG,
} from "./stageUtils";

const TABS = [
  { value: "apercu", label: "Aperçu", icon: FiEye },
  { value: "taches", label: "Tâches", icon: FiCheckSquare },
  { value: "evaluation", label: "Évaluation", icon: FiStar },
  { value: "rapports", label: "Rapports", icon: FiFileText },
  { value: "messages", label: "Messages", icon: FiMessageSquare },
];

export default function StagiaireDetailPanel({ stage, index }) {
  const [tab, setTab] = useState("apercu");
  const couleur = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const { data: evaluations } = useEvaluations(stage.idStage);
  const moyenne = getMoyenneDerniereEvaluation(evaluations);
  const statutAffichage = getStatutAffichage(stage, moyenne);
  const config = STATUT_CONFIG[statutAffichage];
  const avancement = getAvancement(stage);

  return (
    <div className="rounded-md border border-border bg-card p-5">
      {/* En-tête : avatar, nom, badge de statut juste à côté du nom */}
      <div className="mb-4 flex items-center gap-3">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: couleur }}
        >
          {stage.prenom?.charAt(0)}
          {stage.nom?.charAt(0)}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">
              {stage.prenom} {stage.nom}
            </h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs ${config.color}`}
            >
              {config.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{stage.titrePoste}</p>
        </div>
      </div>

      {/* Infos persistantes : dates, tuteur, université — visibles quel que soit l'onglet actif */}
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
          <FiCalendar className="h-3.5 w-3.5" />
          {stage.dateDebut} → {stage.dateFinPrevue}
        </span>
        {stage.nomTuteur && (
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <FiUser className="h-3.5 w-3.5" />
            Tuteur : {stage.nomTuteur}
          </span>
        )}
        <span className="rounded-full bg-muted px-3 py-1.5">
          {stage.nomUniversite || "Université non précisée"}
        </span>
      </div>

      {/* Barre de progression du stage */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progression du stage</span>
          <span className="font-semibold text-foreground">{avancement}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${config.bar}`}
            style={{ width: `${avancement}%` }}
          />
        </div>
      </div>

      {/* Onglets */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`flex flex-shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
              tab === t.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "apercu" && <ApercuTab stage={stage} />}
      {tab === "taches" && <TachesTab />}
      {tab === "evaluation" && <EvaluationTab stage={stage} />}
      {tab === "rapports" && <RapportsTab />}
      {tab === "messages" && <MessagesTab />}

      {/* Boutons persistants — visibles peu importe l'onglet sélectionné */}
      {stage.statut === "actif" && (
        <div className="mt-6 flex flex-col gap-2.5 border-t border-border pt-5 sm:flex-row">
          <TerminerStageDialog
            idStage={stage.idStage}
            stagiaireNom={`${stage.prenom} ${stage.nom}`}
          />
          <SignalerDialog idStage={stage.idStage} />
        </div>
      )}
    </div>
  );
}
