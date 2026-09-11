"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

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
  COLONNES_SANS_DND,
  isCandidatureVerrouillee,
} from "@/lib/utils/kanbanColonnes";
import { peutChangerStatutCandidature } from "@/lib/candidatures/statut";

export default function CandidatsKanban({
  candidatures,
  entretienParCandidature,
  entretienASignalerParCandidature,
  candidaturesFraiches,
  onOpen,
}) {
  const { t } = useTranslation();
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

  function handleOpenCandidature(candidature) {
    if (!candidature) return;

    // Une candidature nouvellement reçue devient consultée dès que
    // l'entreprise ouvre sa fiche. La mutation passe par la même machine
    // d'état backend que les autres changements de statut.
    if (candidature.statut === "soumise") {
      updateStatutMutation.mutate(
        {
          idCandidature: candidature.idCandidature,
          statut: "consultee",
        },
        {
          onSuccess: () => {
            onOpen({ ...candidature, statut: "consultee" });
          },
          onError: () => {
            // On ouvre malgré tout la fiche : un incident réseau ne doit pas
            // empêcher l'entreprise de consulter le dossier.
            onOpen(candidature);
          },
        },
      );
      return;
    }

    onOpen(candidature);
  }

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

    // Candidature verrouillée (retirée ou acceptée / stage validé)
    if (isCandidatureVerrouillee(candidature)) {
      toast.info(
        candidature.statut === "retiree"
          ? t("entrepriseSpace.candidatures.kanbanWithdrawnLocked")
          : t("entrepriseSpace.candidatures.kanbanWithdrawnLocked"),
      );
      return;
    }

    // Colonne Retirées : aucun drop (action exclusive du stagiaire)
    if (COLONNES_SANS_DND.has(colonneCible) || colonneCible === "retirees") {
      toast.info(
        t("entrepriseSpace.candidatures.kanbanWithdrawnLocked"),
      );
      return;
    }

    // Vibration légère de confirmation (silencieusement ignorée si non supportée)
    navigator.vibrate?.(25);

    if (colonneCible === "entretien") {
      if (candidature.statut !== "preselectionnee") {
        toast.info(
          t("entrepriseSpace.candidatures.kanbanPreselectFirst"),
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
          t("entrepriseSpace.candidatures.kanbanInterviewRequired"),
        );
        return;
      }
      if (entretien.statut !== "termine") {
        toast.info(
          t("entrepriseSpace.candidatures.kanbanInterviewMustEnd"),
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

    // Le drag-and-drop respecte la même machine d'état que le backend :
    // une candidature rejetée, acceptée ou retirée ne peut pas revenir en arrière.
    if (!peutChangerStatutCandidature(candidature.statut, nouveauStatut)) {
      toast.info(
        t("entrepriseSpace.candidatures.kanbanInvalidTransition"),
      );
      return;
    }

    updateStatutMutation.mutate(
      { idCandidature: candidature.idCandidature, statut: nouveauStatut },
      {
        onSuccess: () =>
          toast.success(
            t("entrepriseSpace.candidatures.candidateMoved", {
              name: `${candidature.prenom} ${candidature.nom}`,
              column: (() => {
                const col = COLONNES.find((c) => c.id === colonneCible);
                return col?.titreKey ? t(col.titreKey) : col?.titre || colonneCible;
              })(),
            }),
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
              onOpen={handleOpenCandidature}
              entretienASignalerParCandidature={
                entretienASignalerParCandidature
              }
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
