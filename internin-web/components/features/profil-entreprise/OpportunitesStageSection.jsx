"use client";

import { FiFileText, FiSend, FiUserCheck, FiAward } from "react-icons/fi";
import StatCard from "@/components/features/dashboard-entreprise/StatCard";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { useMesOffres } from "@/lib/queries/useMesOffres";
import { useCandidaturesEntreprise } from "@/lib/queries/useCandidaturesEntreprise";

export default function OpportunitesStageSection() {
  const { data: offres } = useMesOffres();
  const { data: candidatures } = useCandidaturesEntreprise();

  const offresActives =
    offres?.filter((o) => o.statut === "publie").length ?? 0;
  const offresPublieesTotal =
    offres?.filter((o) => o.datePublication).length ?? 0;
  const candidaturesRecues = candidatures?.length ?? 0;
  const stagiairesRecrutes =
    candidatures?.filter((c) => c.statut === "acceptee").length ?? 0;

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-foreground">
        Opportunités de stage
      </h2>
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem className="h-full">
          <StatCard
            icon={FiFileText}
            value={offresActives}
            label="Offres actives"
            color="bg-success/10 text-green-700"
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            icon={FiSend}
            value={offresPublieesTotal}
            label="Offres publiées au total"
            color="bg-primary/10 text-primary"
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            icon={FiUserCheck}
            value={candidaturesRecues}
            label="Candidatures reçues"
            color="bg-info/10 text-blue-700"
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            icon={FiAward}
            value={stagiairesRecrutes}
            label="Stagiaires recrutés"
            color="bg-accent/40 text-amber-700"
          />
        </StaggerItem>
      </Stagger>
    </div>
  );
}
