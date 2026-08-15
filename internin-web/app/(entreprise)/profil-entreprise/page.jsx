"use client";

import { useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import AppHeader from "@/components/layout/AppHeader";
import { useEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";
import EntrepriseProfilHeader from "@/components/features/profil-entreprise/EntrepriseProfilHeader";
import EntrepriseProfilSkeleton from "@/components/features/profil-entreprise/EntrepriseProfilSkeleton";
import InformationsContactSection from "@/components/features/profil-entreprise/InformationsContactSection";
import EditProfilEntrepriseDialog from "@/components/features/profil-entreprise/EditProfilEntrepriseDialog";
import AProposSection from "@/components/features/profil-entreprise/AProposSection";
import DomainesActiviteSection from "@/components/features/profil-entreprise/DomainesActiviteSection";
import OpportunitesStageSection from "@/components/features/profil-entreprise/OpportunitesStageSection";
import CompletudeCard from "@/components/features/profil-entreprise/CompletudeCard";

// Petit wrapper pour la cascade d'entrée des sections (voir délais dans la
// spec : Informations 80ms, Description 140ms, Domaines 200ms, Stats 260ms)
function SectionAnimee({ delay, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export default function ProfilEntreprisePage() {
  const { data: profil, isLoading } = useEntrepriseProfile();
  const [editionOuverte, setEditionOuverte] = useState(false);

  return (
    // reducedMotion="user" : Framer Motion respecte automatiquement le
    // réglage système "prefers-reduced-motion" et retire les animations
    // de transformation (translations, scale...) pour les personnes qui
    // l'ont activé, sans avoir à dupliquer la logique dans chaque composant.
    <MotionConfig reducedMotion="user">
      <AppHeader
        title="Mon profil"
        subtitle="Informations publiques de votre entreprise"
      />
      <div className="px-6 py-6">
        {isLoading && <EntrepriseProfilSkeleton />}

        {profil && (
          <div className="space-y-6">
            <EntrepriseProfilHeader
              profil={profil}
              onModifier={() => setEditionOuverte(true)}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-6">
                <SectionAnimee delay={0.14}>
                  <AProposSection
                    profil={profil}
                    onModifier={() => setEditionOuverte(true)}
                  />
                </SectionAnimee>
                <SectionAnimee delay={0.2}>
                  <DomainesActiviteSection
                    profil={profil}
                    onModifier={() => setEditionOuverte(true)}
                  />
                </SectionAnimee>
                <SectionAnimee delay={0.26}>
                  <OpportunitesStageSection />
                </SectionAnimee>
              </div>

              <div className="space-y-6">
                <SectionAnimee delay={0.08}>
                  <InformationsContactSection
                    profil={profil}
                    onModifier={() => setEditionOuverte(true)}
                  />
                </SectionAnimee>
                <SectionAnimee delay={0.32}>
                  <CompletudeCard profil={profil} />
                </SectionAnimee>
              </div>
            </div>
          </div>
        )}

        <EditProfilEntrepriseDialog
          open={editionOuverte}
          onOpenChange={setEditionOuverte}
          profil={profil}
        />
      </div>
    </MotionConfig>
  );
}
