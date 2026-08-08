"use client";

import { useState } from "react";
import {
  FiFileText,
  FiLinkedin,
  FiGlobe,
  FiMapPin,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiBookOpen,
} from "react-icons/fi";
import { SidePanel } from "@/components/ui/side-panel";
import StatutSelect from "./StatutSelect";
import PlanifierEntretienDialog from "@/components/features/entretiens/PlanifierEntretienDialog";
import FaireOffreDialog from "@/components/features/entretiens/FaireOffreDialog";
import RejeterCandidatDialog from "@/components/features/entretiens/RejeterCandidatDialog";
import EntretienStatutPanel from "@/components/features/entretiens/EntretienStatutPanel";
import HistoriqueOffresFinales from "@/components/features/entretiens/HistoriqueOffresFinales";
import { useEntretiensEntreprise } from "@/lib/queries/useEntretiens";
import CandidatureTimeline from "./CandidatureTimeline";
import { useSignalerConsultationCv } from "@/lib/queries/useCandidaturesEntreprise";
import EvaluationRapide from "./EvaluationRapide";
import NotesPrivees from "./NotesPrivees";
import HistoriqueComplet from "./HistoriqueComplet";


const OFFRE_FINALE_MESSAGES = {
  en_attente: {
    text: "Offre finale en attente de validation par l'administration",
    className: "bg-[#FEF3C7] text-[#B45309]",
  },
  approuve: {
    text: "Offre finale validée — le candidat a été notifié",
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
  const signalerCv = useSignalerConsultationCv();
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
         <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-bold text-primary-foreground">
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
             {candidature.diplome || "Formation non précisée"}
           </p>
         </div>
       </div>

       <div className="space-y-4 py-2">
         <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
           <FiMapPin className="h-3.5 w-3.5" />
           {candidature.ville}, {candidature.pays} ·{" "}
           {candidature.nomUniversite || "Université non précisée"}
         </p>
         <p className="inline-block rounded-full bg-[#CCFBF1] px-2.5 py-1 text-sm font-semibold text-[#0F766E]">
           Postule pour : {candidature.titreOffre}
         </p>

         <div className="flex flex-wrap gap-2">
           <a
             href={candidature.cvUrl}
             target="_blank"
             rel="noopener noreferrer"
             onClick={() => signalerCv.mutate(candidature.idCandidature)}
             className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/70"
           >
             <FiFileText className="h-3.5 w-3.5" />
             Voir le CV
           </a>
           {candidature.linkedinUrl && (
             <a
               href={candidature.linkedinUrl}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/70"
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
               {showLettre ? "Masquer" : "Voir"} la lettre de motivation
             </button>
             {showLettre && (
               <p className="mt-2 rounded-sm bg-muted/50 p-3 text-sm text-muted-foreground">
                 {candidature.lettreMotivation}
               </p>
             )}
           </div>
         )}

         {candidature.competences?.length > 0 && (
           <div>
             <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
               Compétences
             </h5>
             <div className="flex flex-wrap gap-1.5">
               {candidature.competences.map((c) => (
                 <span
                   key={c}
                   className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                 >
                   {c}
                 </span>
               ))}
             </div>
           </div>
         )}

         <div>
           <h5 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
             Évaluation rapide
           </h5>
           <EvaluationRapide idCandidature={candidature.idCandidature} />
         </div>

         <div>
           <h5 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
             Notes privées
           </h5>
           <NotesPrivees idCandidature={candidature.idCandidature} />
         </div>

         {(candidature.nomUniversite || candidature.diplome) && (
           <div>
             <h5 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
               <FiBookOpen className="h-3.5 w-3.5" />
               Parcours académique
             </h5>
             <p className="text-sm text-foreground">
               {candidature.nomUniversite}
             </p>
             <p className="text-sm text-muted-foreground">
               {candidature.diplome}
               {candidature.departement && ` · ${candidature.departement}`}
               {candidature.anneeEtude && ` · ${candidature.anneeEtude}e année`}
             </p>
           </div>
         )}

         <div>
           <h5 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
             Chronologie
           </h5>
           <CandidatureTimeline idCandidature={candidature.idCandidature} />
         </div>

         <div>
           <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
             Coordonnées
           </h5>
           {candidature.email || candidature.telephone ? (
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
               Les coordonnées du candidat seront visibles une fois l’offre de
               stage validée par votre entreprise (offre finale envoyée).
             </p>
           )}
         </div>

         <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
           <StatutSelect
             idCandidature={candidature.idCandidature}
             statutActuel={candidature.statut}
           />

           {entretienTermine &&
           !entretienTermine.idOffreFinale &&
           candidature.statut !== "rejetee" ? (
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
             candidature.statut === "preselectionnee" ? (
             <PlanifierEntretienDialog
               idCandidature={candidature.idCandidature}
               candidatNom={`${candidature.prenom} ${candidature.nom}`}
               candidatPhoto={candidature.photoProfilUrl}
               offreTitre={candidature.titreOffre}
             />
           ) : !entretienActif && !entretienTermine ? (
             <p className="text-xs text-muted-foreground">
               Présélectionnez ce candidat pour pouvoir planifier un entretien.
             </p>
           ) : null}
         </div>

         {/* Candidat rejeté après l'entretien -> message envoyé, plus d'action possible */}
         {entretienTermine &&
           !entretienTermine.idOffreFinale &&
           candidature.statut === "rejetee" && (
             <p className="rounded-sm bg-destructive/10 p-3 text-xs font-medium text-destructive">
               Candidature rejetée — un message a été envoyé au candidat pour
               l&apos;en informer.
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
             {
               OFFRE_FINALE_MESSAGES[
                 entretienTermine.statutValidationPlateforme
               ]?.text
             }
           </p>
         )}

         {!entretienTermine && (
           <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
             <FiBriefcase className="h-3.5 w-3.5" />
             Un entretien &quot;Terminé&quot; est requis avant de pouvoir faire
             une offre finale.
           </p>
         )}
       </div>
       <HistoriqueComplet idCandidature={candidature.idCandidature} />
     </div>
   </SidePanel>
 );
}