"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import {
  FiInbox,
  FiEye,
  FiStar,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import StatCard from "@/components/features/dashboard-entreprise/StatCard";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";

export default function CandidaturesDashboard({ candidatures, entretiens }) {
  const { t } = useTranslation();
  const compte = (statut) =>
    (candidatures || []).filter((c) => c.statut === statut).length;

  const entretiensPlanifies = (entretiens || []).filter(
    (e) => e.statut === "planifie",
  ).length;

  const cartes = [
    {
      icon: FiInbox,
      value: compte("soumise"),
      label: t("entrepriseSpace.candidatures.statNew"),
      color: "bg-primary/10 text-primary",
      highlight: true,
    },
    {
      icon: FiEye,
      value: compte("consultee"),
      label: t("entrepriseSpace.candidatures.statViewed"),
      color: "bg-info/10 text-blue-700",
    },
    {
      icon: FiStar,
      value: compte("preselectionnee"),
      label: t("entrepriseSpace.candidatures.statPreselected"),
      color: "bg-accent/40 text-amber-700",
    },
    {
      icon: FiCalendar,
      value: entretiensPlanifies,
      label: t("entrepriseSpace.candidatures.statInterviews"),
      color: "bg-[#EDE9FE] text-[#6D28D9]",
    },
    {
      icon: FiCheckCircle,
      value: compte("acceptee"),
      label: t("entrepriseSpace.candidatures.statAccepted"),
      color: "bg-success/10 text-green-700",
    },
    {
      icon: FiXCircle,
      value: compte("rejetee"),
      label: t("entrepriseSpace.candidatures.statRejected"),
      color: "bg-destructive/10 text-destructive",
    },
  ];

  return (
    <Stagger className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cartes.map((c) => (
        <StaggerItem key={c.label} className="h-full">
          <StatCard
            icon={c.icon}
            value={c.value}
            label={c.label}
            color={c.color}
            highlight={c.highlight}
          />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
