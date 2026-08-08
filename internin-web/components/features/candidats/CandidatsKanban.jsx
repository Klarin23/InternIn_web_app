"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast } from "@/lib/store/useToastStore";
import { useUpdateCandidatureStatut } from "@/lib/queries/useCandidaturesEntreprise";
import PlanifierEntretienDialog from "@/components/features/entretiens/PlanifierEntretienDialog";
import FaireOffreDialog from "@/components/features/entretiens/FaireOffreDialog";
import KanbanColonne from "./KanbanColonne";
import KanbanCard from "./KanbanCard";
import {
  COLONNES,
  getColonneCandidature,
  STATUT_PAR_COLONNE,
} from "@/lib/utils/kanbanColonnes";

export default function CandidatsKanban({
  candidatures,
  entretienParCandidature,
  candidaturesFraiches,
  onOpen,
}) {
  const [activeId, setActiveId] = useState(null);
  const [candidatureEntretien, setCandidatureEntretien] = useState(null);
  const [entretienOffre, setEntretienOffre] = useState(null);
  const updateStatutMutation = useUpdateCandidatureStatut();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Sur tactile, un léger délai (appui ~200ms) distingue le glisser-déposer
    // d'un simple scroll de la colonne — sans ça, le doigt scrolle la page
    // au lieu de déplacer la carte.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
  );

  const parColonne = useMemo(() => {
    const groupes = Object.fromEntries(COLONNES.map((c) => [c.id, []]));
    (candidatures || []).forEach((c) => {
      const colonne = getColonneCandidature(c, entretienParCandidature);
      if (colonne) groupes[colonne].push(c);
    });
    return groupes;
  }, [candidatures, entretienParCandidature]);

  const candidatureActive = candidatures?.find(
    (c) => c.idCandidature === activeId,
  );

  function handleDragEnd({ active, over }) {
    setActiveId(null);
    if (!over) return;

    const candidature = candidatures.find((c) => c.idCandidature === active.id);
    const colonneActuelle = getColonneCandidature(
      candidature,
      entretienParCandidature,
    );
    const colonneCible = over.id;
    if (colonneCible === colonneActuelle) return;

    // Vibration légère de confirmation (silencieusement ignorée si non supportée)
    navigator.vibrate?.(25);

    if (colonneCible === "entretien") {
      if (candidature.statut !== "preselectionnee") {
        toast.info(
          "Présélectionnez d'abord ce candidat avant de planifier un entretien",
        );
        return;
      }
      setCandidatureEntretien(candidature);
      return;
    }

    if (colonneCible === "acceptees") {
      const entretien = entretienParCandidature[candidature.idCandidature];
      if (!entretien) {
        toast.info(
          "Un entretien est nécessaire avant de faire une offre à ce candidat",
        );
        return;
      }
      if (entretien.statut !== "termine") {
        toast.info(
          "L'entretien doit être terminé avant de faire une offre finale",
        );
        return;
      }
      setEntretienOffre({
        ...entretien,
        candidatNom: `${candidature.prenom} ${candidature.nom}`,
      });
      return;
    }

    const nouveauStatut = STATUT_PAR_COLONNE[colonneCible];
    if (!nouveauStatut) return;

    updateStatutMutation.mutate(
      { idCandidature: candidature.idCandidature, statut: nouveauStatut },
      {
        onSuccess: () =>
          toast.success(
            `${candidature.prenom} ${candidature.nom} déplacé(e) vers "${COLONNES.find((c) => c.id === colonneCible)?.titre}"`,
          ),
      },
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLONNES.map((colonne) => (
            <KanbanColonne
              key={colonne.id}
              colonne={colonne}
              candidatures={parColonne[colonne.id] || []}
              candidaturesFraiches={candidaturesFraiches}
              onOpen={onOpen}
            />
          ))}
        </div>

        <DragOverlay>
          {candidatureActive && (
            <KanbanCard candidature={candidatureActive} onOpen={() => {}} />
          )}
        </DragOverlay>
      </DndContext>

      {candidatureEntretien && (
        <PlanifierEntretienDialog
          idCandidature={candidatureEntretien.idCandidature}
          candidatNom={`${candidatureEntretien.prenom} ${candidatureEntretien.nom}`}
          candidatPhoto={candidatureEntretien.photoProfilUrl}
          offreTitre={candidatureEntretien.titreOffre}
          openControlled={!!candidatureEntretien}
          onOpenChangeControlled={(open) =>
            !open && setCandidatureEntretien(null)
          }
          hideTrigger
        />
      )}

      {entretienOffre && (
        <FaireOffreDialog
          idEntretien={entretienOffre.idEntretien}
          candidatNom={entretienOffre.candidatNom}
          openControlled={!!entretienOffre}
          onOpenChangeControlled={(open) => !open && setEntretienOffre(null)}
          hideTrigger
        />
      )}
    </>
  );
}
