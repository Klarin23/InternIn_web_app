"use client";
// Carte d'un candidat : infos essentielles + lettre de motivation dépliable
// + liens CV/LinkedIn/portfolio + sélecteur de statut.

import { useState } from "react";
import { FiMapPin, FiFileText, FiLinkedin, FiGlobe, FiChevronDown } from "react-icons/fi";
import StatutSelect from "./StatutSelect";
import PlanifierEntretienDialog from "@/components/features/entretiens/PlanifierEntretienDialog";

export default function CandidatCard({ candidature }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">
            {candidature.prenom?.charAt(0)}
            {candidature.nom?.charAt(0)}
          </div>
          <div>
            <h5 className="font-semibold text-foreground">
              {candidature.prenom} {candidature.nom}
            </h5>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <FiMapPin className="h-3 w-3" />
              {candidature.ville}, {candidature.pays}
            </p>
            <p className="mt-1.5 inline-block rounded-full bg-[#CCFBF1] px-2.5 py-0.5 text-xs font-semibold text-[#0F766E]">
              Postule pour : {candidature.titreOffre}
            </p>
          </div>
        </div>
        <PlanifierEntretienDialog
          idCandidature={candidature.idCandidature}
          candidatNom={`${candidature.prenom} ${candidature.nom}`}
          candidatPhoto={candidature.photoProfilUrl}
          offreTitre={candidature.titreOffre}
        />
        <StatutSelect
          idCandidature={candidature.idCandidature}
          statutActuel={candidature.statut}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <a
          href={candidature.cvUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-foreground hover:bg-muted/70"
        >
          <FiFileText className="h-3.5 w-3.5" />
          Voir le CV
        </a>
        {candidature.linkedinUrl && (
          <a
            href={candidature.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-foreground hover:bg-muted/70"
          >
            <FiLinkedin className="h-3.5 w-3.5" />
            LinkedIn
          </a>
        )}
        {candidature.portfolioUrl && (
          <a
            href={candidature.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-foreground hover:bg-muted/70"
          >
            <FiGlobe className="h-3.5 w-3.5" />
            Portfolio
          </a>
        )}
      </div>

      {candidature.lettreMotivation && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
          >
            <FiChevronDown
              className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`}
            />
            {expanded
              ? "Masquer la lettre de motivation"
              : "Voir la lettre de motivation"}
          </button>
          {expanded && (
            <p className="mt-2 rounded-sm bg-muted/50 p-3 text-sm text-muted-foreground">
              {candidature.lettreMotivation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}