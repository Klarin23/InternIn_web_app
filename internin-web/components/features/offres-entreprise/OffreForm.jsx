"use client";
// Formulaire d'offre, utilisé pour la création ET l'édition.
// Mode détecté via la présence de `existingOffre` : si fourni, on pré-remplit
// et on utilise useUpdateOffre au lieu de useCreateOffre.
//
// Refonte : long formulaire vertical -> parcours guidé en 4 étapes
// (Informations / Missions / Conditions / Aperçu), cf. cahier des charges.
// Les mutations, le schéma Zod et le système de toast existants sont
// entièrement réutilisés — seule la présentation change.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "framer-motion";
import { FiAlertCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/store/useToastStore";
import Confetti from "@/components/motion/Confetti";
import {
  offreFormSchema,
  OFFRE_FORM_STEP_FIELDS,
} from "@/lib/schemas/offre.schema";
import { useCreateOffre, useUpdateOffre } from "@/lib/queries/useCreateOffre";
import OffreFormStepper from "./OffreFormStepper";
import StepInformationsGenerales from "./steps/StepInformationsGenerales";
import StepMissionsProfil from "./steps/StepMissionsProfil";
import StepConditionsStage from "./steps/StepConditionsStage";
import StepApercu from "./steps/StepApercu";

const TOTAL_STEPS = 4;

export default function OffreForm({
  existingOffre = null,
  onSuccess,
  onCancel,
}) {
  const router = useRouter();
  const isEditing = !!existingOffre;
  const createMutation = useCreateOffre();
  const updateMutation = useUpdateOffre();
  const mutation = isEditing ? updateMutation : createMutation;

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  // Distingue quel bouton (brouillon vs publication) est en cours de
  // soumission, pour n'afficher le loader que sur le bon bouton à l'étape 4.
  const [publishingStatut, setPublishingStatut] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(offreFormSchema),
    defaultValues: {
      titre: existingOffre?.titre || "",
      departement: existingOffre?.departement || "",
      secteurActivite: existingOffre?.secteurActivite || "",
      description: existingOffre?.description || "",
      responsabilites: existingOffre?.responsabilites || "",
      competencesRequises: existingOffre?.competencesRequises || "",
      opportunitesApprentissage: existingOffre?.opportunitesApprentissage || "",
      modeTravail: existingOffre?.modeTravail || undefined,
      remunerationType: existingOffre?.remunerationType || undefined,
      montantRemuneration: existingOffre?.montantRemuneration || "",
      nombrePostes: existingOffre?.nombrePostes || 1,
      dureeStage: existingOffre?.dureeStage || undefined,
      dateLimiteCandidature: existingOffre?.dateLimiteCandidature || "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const values = watch();

  // Validation par étape (point 10) : `trigger` avec un resolver Zod valide
  // tout le schéma mais ne fait remonter/afficher les erreurs que pour les
  // champs demandés — donc jamais d'erreurs des étapes suivantes affichées.
  async function goNext() {
    const fields = OFFRE_FORM_STEP_FIELDS[currentStep];
    const valid = fields ? await trigger(fields) : true;
    if (valid) setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goBack() {
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  function handleCancel() {
    if (onCancel) onCancel();
    else if (onSuccess) onSuccess();
    else router.back();
  }

  function sanitizePayload(vals) {
    return {
      ...vals,
      montantRemuneration: vals.montantRemuneration || null,
      dateLimiteCandidature: vals.dateLimiteCandidature || null,
    };
  }

  async function submitWithStatut(payloadValues, statut) {
    setPublishingStatut(statut);
    const cleanValues = sanitizePayload(payloadValues);
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: existingOffre.idOffre,
          payload: { ...cleanValues, statut },
        });
      } else {
        await createMutation.mutateAsync({ ...cleanValues, statut });
      }

      if (statut === "publie") {
        toast.success("Offre publiée avec succès ✅");
        setConfettiTrigger((n) => n + 1);
      } else {
        toast.info("Offre enregistrée en brouillon");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/offres-entreprise");
      }
    } catch {
      // erreur déjà exposée via mutation.error ci-dessous
    } finally {
      setPublishingStatut(null);
    }
  }

  // À la dernière étape, validation complète du schéma avant publication
  // (point 10), qu'il s'agisse d'un brouillon ou d'une publication.
  const handleSaveDraft = handleSubmit((vals) =>
    submitWithStatut(vals, "brouillon"),
  );
  const handlePublish = handleSubmit((vals) =>
    submitWithStatut(vals, "publie"),
  );

  return (
    <div className="relative">
      <Confetti trigger={confettiTrigger} />
      <OffreFormStepper currentStep={currentStep} />

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {mutation.isError && (
          <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <FiAlertCircle className="h-4 w-4 shrink-0" />
            {mutation.error.message}
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <StepInformationsGenerales
              key="step1"
              register={register}
              errors={errors}
            />
          )}
          {currentStep === 2 && (
            <StepMissionsProfil
              key="step2"
              register={register}
              errors={errors}
            />
          )}
          {currentStep === 3 && (
            <StepConditionsStage
              key="step3"
              control={control}
              register={register}
              errors={errors}
              
            />
          )}
          {currentStep === 4 && (
            <StepApercu
              key="step4"
              values={values}
              isEditing={isEditing}
              isPending={mutation.isPending}
              publishingStatut={publishingStatut}
              onBack={goBack}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
            />
          )}
        </AnimatePresence>

        {/* Navigation (point 9) — masquée à l'étape 4 qui a ses propres
            actions (Modifier / Brouillon / Publier) dans StepApercu. */}
        {currentStep < 4 && (
          <div className="flex justify-between gap-3 border-t border-border pt-4">
            {currentStep === 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                className="h-12 rounded-sm"
              >
                Annuler
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                className="h-12 rounded-sm"
              >
                <FiChevronLeft className="h-4 w-4" />
                Retour
              </Button>
            )}
            <Button type="button" onClick={goNext} className="h-12 rounded-sm">
              {currentStep === 3 ? "Aperçu de l'offre" : "Continuer"}
              <FiChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
