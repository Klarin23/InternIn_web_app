"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState } from "react";
import {
  FiLinkedin,
  FiGlobe,
  FiMapPin,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiStar,
  FiCode,
  FiTarget,
  FiUser,
  FiAward,
} from "react-icons/fi";
import { SidePanel } from "@/components/ui/side-panel";
import StatutSelect from "./StatutSelect";
import PlanifierEntretienDialog from "@/components/features/entretiens/PlanifierEntretienDialog";
import FaireOffreDialog from "@/components/features/entretiens/FaireOffreDialog";
import RejeterCandidatDialog from "@/components/features/entretiens/RejeterCandidatDialog";
import EntretienStatutPanel from "@/components/features/entretiens/EntretienStatutPanel";
import { MOTIFS_RETRAIT_LABELS } from "@/lib/candidatures/statut";
import HistoriqueOffresFinales from "@/components/features/entretiens/HistoriqueOffresFinales";
import { useEntretiensEntreprise } from "@/lib/queries/useEntretiens";
import CandidatureTimeline from "./CandidatureTimeline";
import EvaluationRapide from "./EvaluationRapide";
import NotesPrivees from "./NotesPrivees";
import { safeHref } from "@/lib/utils/urlValidation";


const OFFRE_FINALE_MESSAGES = {
  en_attente: {
    textKey: "entrepriseSpace.candidatures.finalOfferPending",
    className: "bg-[#FEF3C7] text-[#B45309]",
  },
  approuve: {
    textKey: "entrepriseSpace.candidatures.finalOfferApproved",
    className: "bg-success/10 text-green-700",
  },
};

// Statuts d'entretien qui bloquent toute nouvelle planification tant qu'ils
// ne sont pas résolus (cf. règle "un seul entretien actif par candidature"
// appliquée côté API dans entretiens.service.js -> createEntretien).
const STATUTS_ENTRETIEN_ACTIFS = [
  "planifie",
  "valide",
  "confirme",
  "reprogramme",
];

export default function CandidatDetailDialog({ candidature, onClose }) {
  const { t, locale } = useTranslation();
  const [showLettre, setShowLettre] = useState(false);
  const { data: entretiens } = useEntretiensEntreprise();

  if (!candidature) return null;

  // On identifie l'entretien lié à CETTE candidature précisément (par id,
  // pas par nom/titre qui pourraient se dupliquer entre plusieurs candidats).
  const entretiensCandidature = entretiens?.filter(
    (e) => e.idCandidature === candidature.idCandidature,
  );
  const entretienTermine = entretiensCandidature?.find(
    (e) => e.statut === "termine",
  );
  const entretienActif = entretiensCandidature?.find((e) =>
    STATUTS_ENTRETIEN_ACTIFS.includes(e.statut),
  );

 return (
   <SidePanel
     open={!!candidature}
     onClose={onClose}
     title={`${candidature.prenom} ${candidature.nom}`}
   >
     <div className="space-y-5">
       <div className="flex items-center gap-3">
         <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-bold text-primary-foreground">
           {candidature.photoProfilUrl ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img
               src={candidature.photoProfilUrl}
               alt=""
               className="h-full w-full object-cover"
             />
           ) : (
             `${candidature.prenom?.[0] || ""}${candidature.nom?.[0] || ""}`
           )}
         </div>
         <div>
           <p className="font-semibold text-foreground">
             {candidature.prenom} {candidature.nom}
           </p>
           <p className="text-sm text-muted-foreground">
             {candidature.diplome || t("entrepriseSpace.candidatures.formationFallback")}
           </p>
         </div>
       </div>

       <div className="space-y-4 py-2">
         <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
           <FiMapPin className="h-3.5 w-3.5" />
           {candidature.ville}, {candidature.pays} ·{" "}
           {candidature.nomUniversite || t("entrepriseSpace.candidatures.universityFallback")}
         </p>
         <p className="inline-block rounded-full bg-[#CCFBF1] px-2.5 py-1 text-sm font-semibold text-[#0F766E]">
           {t("entrepriseSpace.candidatures.appliedFor", { title: candidature.titreOffre })}
         </p>

         <div className="flex flex-wrap gap-2">
           {candidature.linkedinUrl && safeHref(candidature.linkedinUrl) && (
             <a
               href={safeHref(candidature.linkedinUrl)}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/70"
             >
               <FiLinkedin className="h-3.5 w-3.5" />
               LinkedIn
             </a>
           )}
           {candidature.portfolioUrl && safeHref(candidature.portfolioUrl) && (
             <a
               href={safeHref(candidature.portfolioUrl)}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/70"
             >
               <FiGlobe className="h-3.5 w-3.5" />
               Portfolio
             </a>
           )}
         </div>

         {candidature.lettreMotivation && (
           <div>
             <button
               type="button"
               onClick={() => setShowLettre((v) => !v)}
               className="text-xs font-semibold text-secondary hover:underline"
             >
               {showLettre ? t("entrepriseSpace.candidatures.hideCover") : t("entrepriseSpace.candidatures.showCover")}
             </button>
             {showLettre && (
               <p className="mt-2 rounded-sm bg-muted/50 p-3 text-sm text-muted-foreground">
                 {candidature.lettreMotivation}
               </p>
             )}
           </div>
         )}

         {/* Profil enrichi : remplace avantageusement le CV tout en gardant
             les coordonnées personnelles masquées tant que le stage n'a pas commencé. */}
         <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
           <div className="border-b border-border/70 bg-muted/20 px-4 py-3.5">
             <div className="flex items-center gap-2.5">
               <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                 <FiUser className="h-4 w-4" />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-foreground">
                   {t("entrepriseSpace.candidatures.enrichedProfile")}
                 </h4>
                 <p className="text-[11px] text-muted-foreground">
                   {t("entrepriseSpace.candidatures.enrichedProfileHint")}
                 </p>
               </div>
             </div>
           </div>

           <div className="divide-y divide-border/60">
             {/* Compétences */}
             <div className="p-4">
               <div className="mb-3 flex items-center justify-between gap-3">
                 <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground">
                   <FiCode className="h-3.5 w-3.5 text-primary" />
                   {t("entrepriseSpace.candidatures.skills")}
                 </h5>
                 {candidature.competences?.length > 0 && (
                   <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                     {candidature.competences.length}
                   </span>
                 )}
               </div>
               {candidature.competences?.length > 0 ? (
                 <div className="flex flex-wrap gap-1.5">
                   {candidature.competences.map((c) => (
                     <span key={c} className="rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-foreground">
                       {c}
                     </span>
                   ))}
                 </div>
               ) : (
                 <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                   {t("entrepriseSpace.candidatures.noSkills")}
                 </p>
               )}
             </div>

             {/* Formation */}
             <div className="p-4">
               <h5 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground">
                 <FiBookOpen className="h-3.5 w-3.5 text-secondary" />
                 {t("entrepriseSpace.candidatures.academicPath")}
               </h5>
               {candidature.formations?.length > 0 ? (
                 <div className="space-y-3">
                   {candidature.formations.map((formation, i) => (
                     <div key={i} className="relative rounded-xl border border-border/60 bg-muted/20 p-3.5">
                       <div className="flex items-start gap-3">
                         <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                           <FiAward className="h-3.5 w-3.5" />
                         </div>
                         <div className="min-w-0 flex-1 space-y-1">
                           <p className="text-sm font-semibold text-foreground">
                             {formation.diplome || t("entrepriseSpace.candidatures.formationFallback")}
                           </p>
                           {formation.nomUniversite && (
                             <p className="text-xs font-medium text-foreground">{formation.nomUniversite}</p>
                           )}
                           {(formation.faculte || formation.departement) && (
                             <p className="text-xs text-muted-foreground">
                               {[formation.faculte, formation.departement].filter(Boolean).join(" · ")}
                             </p>
                           )}
                           <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                             {formation.typeFormation === "en_cours" && (
                               <span className="font-medium text-secondary">
                                 {t("entrepriseSpace.candidatures.currentTraining")}
                               </span>
                             )}
                             {formation.anneeEtude != null && formation.typeFormation === "en_cours" && (
                               <span>{t("entrepriseSpace.candidatures.yearOfStudy", { year: formation.anneeEtude })}</span>
                             )}
                             {formation.anneeObtention != null && formation.typeFormation === "obtenue" && (
                               <span>{formation.anneeObtention}</span>
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                   {t("entrepriseSpace.candidatures.noEducation")}
                 </p>
               )}
             </div>

             {/* Qualités */}
             <div className="p-4">
               <h5 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground">
                 <FiStar className="h-3.5 w-3.5 text-amber-500" />
                 {t("entrepriseSpace.candidatures.qualities")}
               </h5>
               {candidature.qualites?.length > 0 ? (
                 <div className="flex flex-wrap gap-1.5">
                   {candidature.qualites.map((q, i) => (
                     <span key={i} className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-2.5 py-1.5 text-xs font-medium text-foreground">
                       {q}
                     </span>
                   ))}
                 </div>
               ) : (
                 <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                   {t("entrepriseSpace.candidatures.noQualities")}
                 </p>
               )}
             </div>

             {/* Expériences */}
             <div className="p-4">
               <h5 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground">
                 <FiBriefcase className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                 {t("entrepriseSpace.candidatures.professionalExperience")}
               </h5>
               {candidature.experiencesProfessionnelles?.length > 0 ? (
                 <div className="space-y-3">
                   {candidature.experiencesProfessionnelles.map((e, i) => (
                     <div key={i} className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                       <p className="text-sm font-semibold text-foreground">{e.poste}</p>
                       {e.entreprise && <p className="text-xs font-medium text-muted-foreground">{e.entreprise}</p>}
                       <p className="mt-1 text-[11px] text-muted-foreground">
                         {[e.dateDebut, e.enCours ? t("entrepriseSpace.candidatures.current") : e.dateFin].filter(Boolean).join(" — ")}
                       </p>
                       {e.description && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-muted-foreground">{e.description}</p>}
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                   {t("entrepriseSpace.candidatures.noExperience")}
                 </p>
               )}
             </div>

             {/* Langues */}
             <div className="p-4">
               <h5 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground">
                 <FiGlobe className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                 {t("entrepriseSpace.candidatures.languages")}
               </h5>
               {candidature.langues?.length > 0 ? (
                 <div className="space-y-2">
                   {candidature.langues.map((langue, i) => (
                     <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                       <span className="text-xs font-medium text-foreground">{langue.nom}</span>
                       {langue.niveau && (
                         <span className="text-[11px] text-muted-foreground">
                           {t(`stagiaireSpace.profile.levels.${langue.niveau}`) || langue.niveau}
                         </span>
                       )}
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                   {t("entrepriseSpace.candidatures.noLanguages")}
                 </p>
               )}
             </div>

             {/* Présentation / objectif */}
             {(candidature.titreProfessionnel || candidature.presentation || candidature.objectifProfessionnel) && (
               <div className="p-4">
                 <h5 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground">
                   <FiTarget className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                   {t("entrepriseSpace.candidatures.professionalProfile")}
                 </h5>
                 <div className="space-y-3">
                   {candidature.titreProfessionnel && (
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t("entrepriseSpace.candidatures.jobTitle")}</p>
                       <p className="mt-1 text-sm font-semibold text-foreground">{candidature.titreProfessionnel}</p>
                     </div>
                   )}
                   {candidature.presentation && (
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t("entrepriseSpace.candidatures.presentation")}</p>
                       <p className="mt-1 whitespace-pre-line text-xs leading-5 text-muted-foreground">{candidature.presentation}</p>
                     </div>
                   )}
                   {candidature.objectifProfessionnel && (
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t("entrepriseSpace.candidatures.professionalObjective")}</p>
                       <p className="mt-1 whitespace-pre-line text-xs leading-5 text-muted-foreground">{candidature.objectifProfessionnel}</p>
                     </div>
                   )}
                 </div>
               </div>
             )}
           </div>
         </section>

         <div>
           <h5 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
             {t("entrepriseSpace.candidatures.quickEval")}
           </h5>
           <EvaluationRapide idCandidature={candidature.idCandidature} />
         </div>

         <div>
           <h5 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
             {t("entrepriseSpace.candidatures.privateNotes")}
           </h5>
           <NotesPrivees idCandidature={candidature.idCandidature} />
         </div>

         <div>
           <h5 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
             {t("entrepriseSpace.candidatures.timeline")}
           </h5>
           <CandidatureTimeline idCandidature={candidature.idCandidature} />
         </div>

         <div>
           <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
             {t("entrepriseSpace.candidatures.contactInfo")}
           </h5>
           {candidature.coordonneesDisponibles && (candidature.email || candidature.telephone) ? (
             <div className="space-y-1 text-sm text-foreground">
               {candidature.email && (
                 <p className="flex items-center gap-1.5">
                   <FiMail className="h-3.5 w-3.5 text-muted-foreground" />
                   {candidature.email}
                 </p>
               )}
               {candidature.telephone && (
                 <p className="flex items-center gap-1.5">
                   <FiPhone className="h-3.5 w-3.5 text-muted-foreground" />
                   {candidature.telephone}
                 </p>
               )}
             </div>
           ) : (
             <p className="rounded-sm bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
               {t("entrepriseSpace.candidatures.contactHidden")}
             </p>
           )}
         </div>

         {/* Section dédiée au retrait (visible uniquement si retirée) */}
         {candidature.statut === "retiree" && (
           <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
             <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
               {t("entrepriseSpace.candidatures.withdrawalSection")}
             </p>
             <p className="mt-2 text-sm font-semibold text-foreground">
               {t("entrepriseSpace.candidatures.withdrawnByCandidate")}
             </p>
             {candidature.dateRetrait && (
               <div className="mt-3">
                 <p className="text-xs font-medium text-muted-foreground">{t("entrepriseSpace.candidatures.date")}</p>
                 <p className="mt-0.5 text-sm text-foreground">
                   {new Date(candidature.dateRetrait).toLocaleString(locale === "en" ? "en-GB" : "fr-FR", {
                     day: "numeric",
                     month: "long",
                     year: "numeric",
                     hour: "2-digit",
                     minute: "2-digit",
                   })}
                 </p>
               </div>
             )}
             {(MOTIFS_RETRAIT_LABELS[candidature.motifRetraitCode] ||
               candidature.motifRetraitCommentaire) && (
               <div className="mt-3">
                 <p className="text-xs font-medium text-muted-foreground">{t("entrepriseSpace.candidatures.reason")}</p>
                 <p className="mt-0.5 text-sm text-foreground">
                   {MOTIFS_RETRAIT_LABELS[candidature.motifRetraitCode] ||
                     candidature.motifRetraitCommentaire}
                 </p>
               </div>
             )}
             {candidature.motifRetraitCommentaire &&
               candidature.motifRetraitCode === "OTHER" && (
                 <div className="mt-3">
                   <p className="text-xs font-medium text-muted-foreground">
                     {t("entrepriseSpace.candidatures.candidateComment")}
                   </p>
                   <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                     {candidature.motifRetraitCommentaire}
                   </p>
                 </div>
               )}
             {candidature.motifRetraitCommentaire &&
               candidature.motifRetraitCode &&
               candidature.motifRetraitCode !== "OTHER" && (
                 <div className="mt-3">
                   <p className="text-xs font-medium text-muted-foreground">
                     {t("entrepriseSpace.candidatures.candidateComment")}
                   </p>
                   <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                     {candidature.motifRetraitCommentaire}
                   </p>
                 </div>
               )}
           </div>
         )}

         <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
           {candidature.statut !== "retiree" && candidature.statut !== "acceptee" && (
           <StatutSelect
             idCandidature={candidature.idCandidature}
             statutActuel={candidature.statut}
           />
           )}

           {entretienTermine &&
           !entretienTermine.idOffreFinale &&
           candidature.statut !== "rejetee" && candidature.statut !== "retiree" ? (
             <>
               <FaireOffreDialog
                 idEntretien={entretienTermine.idEntretien}
                 candidatNom={`${candidature.prenom} ${candidature.nom}`}
               />
               <RejeterCandidatDialog
                 idEntretien={entretienTermine.idEntretien}
                 candidatNom={`${candidature.prenom} ${candidature.nom}`}
               />
             </>
           ) : !entretienActif &&
             !entretienTermine &&
             candidature.statut === "preselectionnee" && candidature.statut !== "retiree" ? (
             <PlanifierEntretienDialog
               idCandidature={candidature.idCandidature}
               candidatNom={`${candidature.prenom} ${candidature.nom}`}
               candidatPhoto={candidature.photoProfilUrl}
               offreTitre={candidature.titreOffre}
             />
           ) : !entretienActif && !entretienTermine ? (
             <p className="text-xs text-muted-foreground">
               {t("entrepriseSpace.candidatures.preselectToInterview")}
             </p>
           ) : null}
         </div>

         {/* Candidat rejeté après l'entretien -> message envoyé, plus d'action possible */}
         {entretienTermine &&
           !entretienTermine.idOffreFinale &&
           candidature.statut === "rejetee" && (
             <p className="rounded-sm bg-destructive/10 p-3 text-xs font-medium text-destructive">
               {t("entrepriseSpace.candidatures.rejectedNotified")}
             </p>
           )}

         {/* Un entretien est en cours (planifié, validé, reprogrammé ou
              confirmé) : on affiche son état et les actions possibles au lieu
              de proposer d'en créer un second. */}
         {entretienActif && (
           <EntretienStatutPanel
             entretien={entretienActif}
             candidatNom={`${candidature.prenom} ${candidature.nom}`}
           />
         )}

         {/* Entretien terminé mais pas encore d'offre finale active : on
              rappelle les tentatives précédemment rejetées, s'il y en a. */}
         {entretienTermine &&
           !entretienTermine.idOffreFinale &&
           candidature.statut !== "rejetee" && (
             <HistoriqueOffresFinales
               idEntretien={entretienTermine.idEntretien}
             />
           )}

         {/* Une offre finale est déjà en cours de traitement pour cet
              entretien : on affiche où elle en est plutôt que de proposer
              d'en soumettre une nouvelle. */}
         {entretienTermine?.idOffreFinale && (
           <p
             className={`rounded-sm p-3 text-xs font-medium ${OFFRE_FINALE_MESSAGES[entretienTermine.statutValidationPlateforme]?.className}`}
           >
             {(() => {
               const msg =
                 OFFRE_FINALE_MESSAGES[
                   entretienTermine.statutValidationPlateforme
                 ];
               return msg?.textKey ? t(msg.textKey) : msg?.text || null;
             })()}
           </p>
         )}

         {!entretienTermine && (
           <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
             <FiBriefcase className="h-3.5 w-3.5" />
             {t("entrepriseSpace.candidatures.finalOfferRequiresInterview")}
           </p>
         )}
       </div>
     </div>
   </SidePanel>
 );
}