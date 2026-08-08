"use client";
// Contenu du tableau de bord stagiaire, extrait de l'ancienne page pour
// être réutilisable depuis la route partagée /tableau-de-bord.

import { FiLoader } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import WelcomeBanner from "./WelcomeBanner";
import QuickStatsGrid from "./QuickStatsGrid";
import CitationDuJour from "./CitationDuJour";
import QuickActionsStagiaire from "./QuickActionsStagiaire";
import ProfileCompletionCard from "./ProfileCompletionCard";
import ProchaineEtapeCard from "./ProchaineEtapeCard";
import ActiviteTimeline from "./ActiviteTimeline";
import OffresRecommandeesCard from "./OffresRecommandeesCard";
import EvolutionCandidaturesCard from "./EvolutionCandidaturesCard";
import CalendrierCard from "./CalendrierCard";
import DernieresCandidaturesCard from "./DernieresCandidaturesCard";
import ProchainEntretienCard from "./ProchainEntretienCard";
import CoachIACard from "./CoachIACard";
import { useStagiaireProfile } from "@/lib/queries/useStagiaireProfile";
import { useMesCandidatures } from "@/lib/queries/useMesCandidatures";
import { useMesEntretiens } from "@/lib/queries/useEntretiens";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUTS_ENTRETIEN_A_VENIR = [
  "planifie",
  "valide",
  "confirme",
  "reprogramme",
];

export default function StagiaireDashboardContent() {
  const { t } = useTranslation();
  const { data: profile, isLoading, isError } = useStagiaireProfile();
  const { data: candidatures } = useMesCandidatures();
  const { data: entretiens } = useMesEntretiens();

  // "Niveau" affiché dans le Hero = diplôme + année d'étude de la formation
  // la plus récente (formations est trié par idFormation, pas par date : on
  // prend la dernière entrée déclarée par le stagiaire).
  function formaterNiveau(formation) {
    if (!formation) return null;
    return [
      formation.diplome,
      formation.anneeEtude &&
        t("dashboard.profileCard.yearLabel", { n: formation.anneeEtude }),
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const entretiensAVenir = [...(entretiens || [])]
    .filter(
      (e) =>
        STATUTS_ENTRETIEN_A_VENIR.includes(e.statut) &&
        new Date(e.dateHeure) > new Date(),
    )
    .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));

  const derniereFormation =
    profile?.formations?.[profile.formations.length - 1];

  return (
    <>
      <AppHeader title={t("pages.dashboard")} />
      <div className="space-y-8 px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            {t("dashboard.loading")}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">{t("dashboard.loadError")}</p>
        )}

        {profile && (
          <>
            <WelcomeBanner
              prenom={profile.prenom}
              nomEtablissement={derniereFormation?.nomUniversite}
              niveau={formaterNiveau(derniereFormation)}
              score={profile.scoreCompletudeProfil ?? 0}
              photoProfilUrl={profile.photoProfilUrl}
              emailVerifie={profile.emailVerifie}
            />

            <QuickStatsGrid />

            <CitationDuJour />

            <QuickActionsStagiaire />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-6">
                <DernieresCandidaturesCard
                  candidatures={candidatures}
                  entretiens={entretiens}
                />
                <OffresRecommandeesCard profil={profile} />
                <ActiviteTimeline />
              </div>
              <div className="space-y-6">
                <ProfileCompletionCard
                  profile={profile}
                  derniereFormation={derniereFormation}
                />
                <ProchaineEtapeCard profil={profile} />
                <ProchainEntretienCard entretien={entretiensAVenir[0]} />
                <CalendrierCard />
                <EvolutionCandidaturesCard />
                <CoachIACard />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
