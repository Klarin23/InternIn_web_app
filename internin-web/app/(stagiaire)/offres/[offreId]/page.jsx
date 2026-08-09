"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiTarget,
  FiZap,
  FiCpu,
  FiBriefcase,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { useOffre } from "@/lib/queries/useOffre";
import { useCandidatureStatut } from "@/lib/queries/useCandidatureStatut";
import { parseCompetences, estNouvelle } from "@/lib/constants/offres";
import PostulerDialog from "@/components/features/offres/PostulerDialog";
import OffreDetailHero from "@/components/features/offres/detail/OffreDetailHero";
import OffreInfosGrid from "@/components/features/offres/detail/OffreInfosGrid";
import OffreSection from "@/components/features/offres/detail/OffreSection";
import OffreCandidatureSidebar from "@/components/features/offres/detail/OffreCandidatureSidebar";
import OffreDetailSkeleton from "@/components/features/offres/detail/OffreDetailSkeleton";
import OffreNotFound from "@/components/features/offres/detail/OffreNotFound";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Délais de la cascade d'apparition des sections (en secondes), tel que
// demandé : Hero → Informations → Description → Responsabilités →
// Compétences → Entreprise.
const DELAIS = {
  infos: 0.08,
  description: 0.16,
  responsabilites: 0.24,
  competences: 0.32,
  entreprise: 0.4,
};

export default function OffreDetailPage() {
  const { t } = useTranslation();
  const { offreId } = useParams();
  const { data: offre, isLoading, isError } = useOffre(offreId);
  const { data: candidatureStatut } = useCandidatureStatut(offreId);
  // Même pattern que sur la page liste : `Date.now()` est impur et ne peut
  // pas être appelé directement pendant le rendu (React Compiler).
  const [maintenant] = useState(() => Date.now());

  const candidature = candidatureStatut?.candidature || null;
  const competencesBadges = offre
    ? parseCompetences(offre.competencesRequises, 12)
    : [];

  return (
    <>
      <AppHeader title={t("offersPage.detail.title")} />
      <div className="mx-auto max-w-280 p-4 pb-24 sm:p-6 lg:pb-6">
        {isLoading && <OffreDetailSkeleton />}

        {isError && <OffreNotFound />}

        {offre && (
          <div className="space-y-6">
            <OffreDetailHero
              offre={offre}
              isNew={estNouvelle(offre.datePublication, maintenant)}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
              {/* Colonne principale */}
              <div className="space-y-6 lg:col-span-2">
                <OffreInfosGrid offre={offre} delay={DELAIS.infos} />

                <OffreSection
                  icon={FiFileText}
                  title={t("offersPage.detail.description")}
                  delay={DELAIS.description}
                >
                  <p>{offre.description}</p>
                </OffreSection>

                {offre.responsabilites && (
                  <OffreSection
                    icon={FiTarget}
                    title={t("offersPage.detail.responsibilities")}
                    delay={DELAIS.responsabilites}
                  >
                    <p>{offre.responsabilites}</p>
                  </OffreSection>
                )}

                {competencesBadges.length > 0 && (
                  <OffreSection
                    icon={FiCpu}
                    title={t("offersPage.detail.requiredSkills")}
                    delay={DELAIS.competences}
                  >
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {competencesBadges.map((c) => (
                        <span
                          key={c}
                          className="rounded-sm border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </OffreSection>
                )}

                {offre.opportunitesApprentissage && (
                  <OffreSection
                    icon={FiZap}
                    title={t("offersPage.detail.learningOpportunities")}
                    delay={DELAIS.competences}
                  >
                    <p>{offre.opportunitesApprentissage}</p>
                  </OffreSection>
                )}

                {offre.aPropos && (
                  <OffreSection
                    icon={FiBriefcase}
                    title={t("offersPage.detail.aboutCompany", {
                      company: offre.nomEntreprise,
                    })}
                    delay={DELAIS.entreprise}
                  >
                    <p>{offre.aPropos}</p>
                  </OffreSection>
                )}
              </div>

              {/* Sidebar sticky */}
              <OffreCandidatureSidebar
                offre={offre}
                offreId={offreId}
                candidature={candidature}
                delay={DELAIS.infos}
              />
            </div>
          </div>
        )}
      </div>

      {/* Barre d'action fixe mobile — uniquement tant que l'étudiant n'a pas
          encore candidaté : une fois la candidature envoyée, l'action
          principale disparaît pour ne pas encombrer l'écran inutilement. */}
      {offre && !candidature && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-sm lg:hidden"
        >
          <div className="mx-auto max-w-280">
            <PostulerDialog
              idOffre={offreId}
              offreTitle={offre.titre}
              offre={offre}
            />
          </div>
        </motion.div>
      )}
    </>
  );
}
