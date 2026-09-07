"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Video, Phone, MapPin, Calendar, Clock, User } from "lucide-react";
import {
  FiCheckCircle,
  FiUserX,
  FiXCircle,
  FiLoader,
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
import {
  formatJourRelatif,
  formatHeure,
  formatCompteARebours,
} from "@/lib/entretiens/statut";
import { MODE_LABELS } from "@/lib/entretiens/planification";
import { useUpdateEntretienEntreprise } from "@/lib/queries/useEntretiens";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

const MODE_ICONS = { video: Video, telephone: Phone, presentiel: MapPin };

function getInitials(prenom, nom) {
  return `${(prenom || "").charAt(0)}${(nom || "").charAt(0)}`.toUpperCase() || "?";
}

export default function ProchainEntretienHighlightEntreprise({
  entretien,
  maintenant,
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [confirmAnnulation, setConfirmAnnulation] = useState(false);
  const updateMutation = useUpdateEntretienEntreprise();

  if (!entretien) return null;

  const date = new Date(entretien.dateHeure);
  const ModeIcon = MODE_ICONS[entretien.modeEntretien] || Calendar;
  const compteARebours = formatCompteARebours(date, maintenant);
  const jour = formatJourRelatif(date, maintenant, "fr-FR");
  const heure = formatHeure(date, "fr-FR");
  const imminent = compteARebours != null;

  const peutRejoindre =
    entretien.modeEntretien === "video" && !!entretien.lienGoogleMeet;
  const peutAppeler =
    entretien.modeEntretien === "telephone" && !!entretien.lienGoogleMeet;

  // Actions réservées au menu Entretiens (carte stagiaire / highlight)
  const peutCloturer = ["confirme", "valide"].includes(entretien.statut);
  const peutAnnuler = ["planifie", "valide", "confirme", "reprogramme"].includes(
    entretien.statut,
  );
  const aDesActions = peutCloturer || peutAnnuler;

  function marquerStatut(statut, messageOk) {
    updateMutation.mutate(
      {
        id: entretien.idEntretien,
        payload: { statut },
      },
      {
        onSuccess: () => toast.success(messageOk),
        onError: (err) =>
          toast.error(err?.message || t("interviews.entreprise.updateImpossible")),
      },
    );
  }

  function confirmerAnnulation() {
    updateMutation.mutate(
      {
        id: entretien.idEntretien,
        payload: { statut: "annule" },
      },
      {
        onSuccess: () => toast.success(t("interviews.entreprise.cancelledSuccess")),
        onError: (err) => toast.error(err?.message || t("interviews.entreprise.cancelImpossible")),
        onSettled: () => setConfirmAnnulation(false),
      },
    );
  }

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden rounded-2xl border p-5 sm:p-6",
          imminent
            ? "border-primary/30 bg-gradient-to-br from-primary/[0.08] via-card to-card shadow-md ring-1 ring-primary/10"
            : "border-border/70 bg-card shadow-sm",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <span
              className={cn(
                "size-1.5 rounded-full bg-primary",
                imminent && !reduceMotion && "animate-pulse",
              )}
            />
            Prochain entretien
          </span>
          {compteARebours && (
            <span className="text-xs font-medium text-primary">
              {compteARebours}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-start gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary ring-2 ring-primary/20">
            {entretien.photoProfilUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entretien.photoProfilUrl}
                alt=""
                className="size-12 rounded-full object-cover"
              />
            ) : (
              getInitials(entretien.prenom, entretien.nom)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">
              {entretien.prenom} {entretien.nom}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {entretien.titreOffre}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-4 text-primary" />
            <span className="font-medium">
              {jour} · {heure}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <ModeIcon className="size-4" />
            {MODE_LABELS[entretien.modeEntretien]}
          </span>
        </div>

        {/* Zone actions : rejoindre / appeler OU boutons statut OU label détail */}
        <div className="mt-5 flex flex-wrap gap-2.5">
          {peutRejoindre && (
            <a
              href={entretien.lienGoogleMeet}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Video className="size-4" />
              Rejoindre la réunion
            </a>
          )}
          {peutAppeler && (
            <a
              href={`tel:${entretien.lienGoogleMeet.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Phone className="size-4" />
              Appeler
            </a>
          )}

          {/* Boutons d'action au niveau du label "Détails disponibles..." */}
          {peutCloturer && (
            <>
              <Button
                type="button"
                size="sm"
                className="rounded-lg gap-1.5"
                disabled={updateMutation.isPending}
                onClick={() =>
                  marquerStatut("termine", "Entretien marqué comme terminé")
                }
              >
                {updateMutation.isPending ? (
                  <FiLoader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FiCheckCircle className="h-3.5 w-3.5" />
                )}
                Marquer comme terminé
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg gap-1.5"
                disabled={updateMutation.isPending}
                onClick={() =>
                  marquerStatut("absent", "Absence du candidat enregistrée")
                }
              >
                <FiUserX className="h-3.5 w-3.5" />
                Marquer absence
              </Button>
            </>
          )}
          {peutAnnuler && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={updateMutation.isPending}
              onClick={() => setConfirmAnnulation(true)}
            >
              <FiXCircle className="h-3.5 w-3.5" />
              Annuler l&apos;entretien
            </Button>
          )}

          {!peutRejoindre && !peutAppeler && !aDesActions && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="size-3.5" />
              Détails disponibles dans la carte ci-dessous
            </span>
          )}
        </div>
      </motion.div>

      <Dialog open={confirmAnnulation} onOpenChange={setConfirmAnnulation}>
        <DialogContent className="rounded-2xl sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Annuler cet entretien ?</DialogTitle>
            <DialogDescription>
              Le candidat pourra être informé. Vous pourrez replanifier un
              nouvel entretien pour cette candidature ensuite.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => setConfirmAnnulation(false)}
              disabled={updateMutation.isPending}
            >
              Retour
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-lg"
              onClick={confirmerAnnulation}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Annulation...
                </>
              ) : (
                t("interviews.entreprise.cancelAction")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
