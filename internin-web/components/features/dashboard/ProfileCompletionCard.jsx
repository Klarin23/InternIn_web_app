"use client";
// Carte "Profil" complète : photo, nom, université, niveau, compétences,
// statut du CV, pourcentage de complétude, bouton d'action. Coins 20px,
// ombre douce, léger dégradé de fond — cohérent avec la direction "premium"
// demandée pour l'espace étudiant. Icônes Lucide (déjà utilisées ailleurs
// dans l'app : auth, profil, marketing, onboarding).

import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, FileCheck2, FileX2, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ProfileCompletionCard({ profile, derniereFormation }) {
  const { t } = useTranslation();
  const score = profile?.scoreCompletudeProfil ?? 0;
  const initiale = (profile?.prenom?.charAt(0) || "?").toUpperCase();
  const competences = profile?.competences || [];
  const competencesAffichees = competences.slice(0, 4);
  const resteCompetences = competences.length - competencesAffichees.length;
  const aUnCv = Boolean(profile?.cvUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -3,
        boxShadow: "0 16px 32px -12px rgba(17, 24, 39, 0.14)",
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-[20px] border border-border bg-linear-to-br from-card to-primary/[0.03] p-6 shadow-[0_6px_20px_-8px_rgba(17,24,39,0.10)]"
    >
      <div className="flex items-center gap-3.5">
        {profile?.photoProfilUrl ? (
          <img
            src={profile.photoProfilUrl}
            alt={profile.prenom}
            className="h-14 w-14 rounded-full border-2 border-primary/20 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {initiale}
          </div>
        )}
        <div className="min-w-0">
          <h5 className="truncate text-sm font-semibold text-foreground">
            {profile?.prenom} {profile?.nom}
          </h5>
          {(derniereFormation?.nomUniversite || derniereFormation?.diplome) && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              {[
                derniereFormation?.diplome &&
                  `${derniereFormation.diplome}${derniereFormation.anneeEtude ? ` · ${t("dashboard.profileCard.yearLabel", { n: derniereFormation.anneeEtude })}` : ""}`,
                derniereFormation?.nomUniversite,
              ]
                .filter(Boolean)
                .join(" — ")}
            </p>
          )}
        </div>
      </div>

      {competencesAffichees.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {competencesAffichees.map((c) => (
            <span
              key={c.idCompetence}
              className="rounded-full bg-secondary-foreground/10 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
            >
              {c.nom}
            </span>
          ))}
          {resteCompetences > 0 && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              +{resteCompetences}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs">
        {aUnCv ? (
          <>
            <FileCheck2 className="h-4 w-4 text-green-600" />
            <span className="text-muted-foreground">
              {t("dashboard.profileCard.cvUploaded")}
            </span>
          </>
        ) : (
          <>
            <FileX2 className="h-4 w-4 text-destructive" />
            <span className="text-muted-foreground">
              {t("dashboard.profileCard.noCv")}
            </span>
          </>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {t("dashboard.profileCard.profileCompleted")}
        </span>
        <span className="font-bold text-primary">{score}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-primary to-secondary-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
        />
      </div>

      <Link
        href="/profil"
        className="mt-5 flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        {t("dashboard.profileCard.completeProfile")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
