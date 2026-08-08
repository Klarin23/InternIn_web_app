"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiClock,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiLoader,
  FiEdit2,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  modeTravailLabelFor,
  dureeLabelFor,
  REMUNERATION_OPTIONS,
} from "../offreForm.constants";

function formatDateLisible(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function PreviewSection({ title, content }) {
  if (!content) return null;
  return (
    <div className="border-t border-border px-5 py-4">
      <h4 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h4>
      <p className="text-sm whitespace-pre-line text-foreground">{content}</p>
    </div>
  );
}

// Étape 4 — "Aperçu & publication" (points 11 et 12 du cahier des charges).
// `values` provient de `getValues()`/`watch()` côté OffreForm : uniquement
// des données réellement saisies, aucune donnée fictive.
export default function StepApercu({
  values,
  isEditing,
  isPending,
  publishingStatut,
  onBack,
  onSaveDraft,
  onPublish,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Le nom d'entreprise n'est pas garanti d'être présent dans le user store
  // (à vérifier côté payload /auth) — on protège avec un fallback plutôt que
  // de casser l'aperçu si le champ est absent.
  const nomEntreprise = useAuthStore((s) => s.user?.nomEntreprise);

  const remunerationOption = REMUNERATION_OPTIONS.find(
    (o) => o.value === values.remunerationType,
  );
  const dateLimiteLisible = formatDateLisible(values.dateLimiteCandidature);

  function handlePublishClick() {
    setConfirmOpen(true);
  }

  function handleConfirmPublish() {
    setConfirmOpen(false);
    onPublish();
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Aperçu & publication
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Voici exactement ce que verra un candidat. Vérifiez avant de publier.
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="space-y-1.5 px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {values.titre || "Titre du poste"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {nomEntreprise || "Votre entreprise"}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1.5 text-sm text-foreground">
            {values.modeTravail && (
              <span className="flex items-center gap-1.5">
                <FiMapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {modeTravailLabelFor(values.modeTravail)}
              </span>
            )}
            {values.dureeStage && (
              <span className="flex items-center gap-1.5">
                <FiClock className="h-3.5 w-3.5 text-muted-foreground" />
                {dureeLabelFor(values.dureeStage)}
              </span>
            )}
            {values.nombrePostes && (
              <span className="flex items-center gap-1.5">
                <FiUsers className="h-3.5 w-3.5 text-muted-foreground" />
                {values.nombrePostes} poste{values.nombrePostes > 1 ? "s" : ""}
              </span>
            )}
            {remunerationOption && remunerationOption.value !== "aucune" && (
              <span className="flex items-center gap-1.5">
                <FiDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                {remunerationOption.label}
                {remunerationOption.hasMontant &&
                  values.montantRemuneration &&
                  ` · ${Number(values.montantRemuneration).toLocaleString()} FCFA`}
              </span>
            )}
          </div>
        </div>

        <PreviewSection title="Description" content={values.description} />
        <PreviewSection
          title="Responsabilités"
          content={values.responsabilites}
        />
        <PreviewSection
          title="Compétences requises"
          content={values.competencesRequises}
        />
        <PreviewSection
          title="Opportunités d'apprentissage"
          content={values.opportunitesApprentissage}
        />

        {dateLimiteLisible && (
          <div className="flex items-center gap-1.5 border-t border-border px-5 py-3 text-sm text-muted-foreground">
            <FiCalendar className="h-3.5 w-3.5" />
            Date limite : {dateLimiteLisible}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={onBack}
          className="h-12 rounded-sm"
        >
          <FiEdit2 className="h-4 w-4" />
          Modifier
        </Button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onSaveDraft}
            className="h-12 rounded-sm"
          >
            {isPending && publishingStatut === "brouillon" ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer en brouillon"
            )}
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={handlePublishClick}
            className="h-12 rounded-sm"
          >
            {isPending && publishingStatut === "publie" ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                {isEditing ? "Mise à jour..." : "Publication..."}
              </>
            ) : isEditing ? (
              "Enregistrer et publier"
            ) : (
              "Publier l'offre"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-105">
          <DialogHeader>
            <DialogTitle>Publier cette offre ?</DialogTitle>
            <DialogDescription>
              Cette offre deviendra visible aux candidats et pourra recevoir des
              candidatures.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="rounded-sm"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPublish}
              className="rounded-sm"
            >
              Publier l&apos;offre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
