"use client";
// Correctif appliqué : le bouton "Annuler l'entretien" était rattaché au
// statut "valide", jamais atteint en pratique (validerEntretien passe
// directement à "confirme" côté backend — entretiens.service.js). Déplacé
// vers statut === "confirme", seul état où annulerEntretien() l'autorise
// réellement côté serveur. Ajout : actions Appeler / Voir l'adresse selon
// le mode, "Ajouter au calendrier", et l'annonce discrète (section 11).
//
// Deuxième correctif (celui-ci) : `maintenant` est reçu en prop, jamais
// recalculé via Date.now() pendant le rendu — React 19.2 interdit les
// appels de fonctions impures (Date.now/Math.random) dans le corps d'un
// composant. La page parente (app/(stagiaire)/entretiens/page.jsx) calcule
// déjà `maintenant` une seule fois via useState(() => Date.now()) et le
// transmet à ce composant — aucune modification de la page nécessaire.

import { motion } from "framer-motion";
import { useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiVideo,
  FiPhone,
  FiMapPin,
  FiLoader,
  FiCheck,
  FiXCircle,
  FiUser,
  FiSave,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useValiderEntretien,
  useDemanderReprogrammation,
  useAnnulerEntretien,
  useEnregistrerNotesPreparation,
} from "@/lib/queries/useEntretiens";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatAnnonceEntretien, buildLienGoogleCalendar } from "@/lib/entretiens/statut";

const STATUT_LABEL_KEYS = {
  planifie: "interviews.status.pendingResponse",
  valide: "interviews.status.validatedWaiting",
  confirme: "interviews.status.confirmed",
  reprogramme: "interviews.status.rescheduling",
  termine: "interviews.status.completed",
  annule: "interviews.status.cancelled",
  absent: "interviews.status.absenceNoted",
};
const STATUT_COLORS = {
  planifie: "bg-accent/40 text-amber-700",
  valide: "bg-secondary/10 text-secondary",
  confirme: "bg-success/10 text-green-700",
  reprogramme: "bg-accent/40 text-amber-700",
  termine: "bg-muted text-muted-foreground",
  annule: "bg-destructive/10 text-destructive",
  absent: "bg-destructive/10 text-destructive",
};
const MODE_ICONS = { video: FiVideo, telephone: FiPhone, presentiel: FiMapPin };
const MODE_LABEL_KEYS = {
  video: "interviews.modes.video",
  telephone: "interviews.modes.phone",
  presentiel: "interviews.modes.onsite",
};

const PALETTE_AVATAR = [
  "bg-sky-500",
  "bg-orange-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-600",
  "bg-indigo-500",
];
function couleurAvatar(nom) {
  let hash = 0;
  for (let i = 0; i < nom.length; i++)
    hash = nom.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE_AVATAR[Math.abs(hash) % PALETTE_AVATAR.length];
}

function formatDateJour(date, locale = "fr") {
  const resultat = date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return resultat.charAt(0).toUpperCase() + resultat.slice(1);
}

function formatHeure(date, locale = "fr") {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotesPreparation({ entretien }) {
  const { t } = useTranslation();
  const mutation = useEnregistrerNotesPreparation();
  const [valeur, setValeur] = useState(entretien.notesPreparation || "");
  const [enEdition, setEnEdition] = useState(false);

  const [dernieresNotesVues, setDernieresNotesVues] = useState(
    entretien.notesPreparation,
  );
  if (entretien.notesPreparation !== dernieresNotesVues) {
    setDernieresNotesVues(entretien.notesPreparation);
    setValeur(entretien.notesPreparation || "");
  }

  function enregistrer() {
    mutation.mutate(
      { id: entretien.idEntretien, notesPreparation: valeur },
      { onSuccess: () => setEnEdition(false) },
    );
  }

  if (!enEdition && !entretien.notesPreparation) {
    return (
      <button
        type="button"
        onClick={() => setEnEdition(true)}
        className="mb-4 w-full rounded-sm border border-dashed border-border px-3.5 py-2.5 text-left text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
      >
        {t("interviews.card.addPreparationNotes")}
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-sm border-l-2 border-l-secondary bg-secondary/6 px-3.5 py-2.5">
      <p className="mb-1 text-xs font-bold text-secondary-foreground">
        {t("interviews.card.preparationNotes")}
      </p>
      {enEdition ? (
        <div className="space-y-2">
          <textarea
            rows={2}
            autoFocus
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            placeholder={t("interviews.card.preparationPlaceholder")}
            className="w-full resize-none rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEnEdition(false)}
            >
              {t("interviews.card.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={mutation.isPending}
              onClick={enregistrer}
              className="rounded-sm"
            >
              {mutation.isPending ? (
                <FiLoader className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FiSave className="h-3.5 w-3.5" />
              )}
              {t("interviews.card.save")}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEnEdition(true)}
          className="w-full text-left text-sm text-foreground hover:underline"
        >
          {entretien.notesPreparation}
        </button>
      )}
    </div>
  );
}

function EntretienCardCompacte({ entretien }) {
  const { t, locale } = useTranslation();
  const date = new Date(entretien.dateHeure);
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-card px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${couleurAvatar(entretien.nomEntreprise)}`}
        >
          {entretien.nomEntreprise.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {entretien.nomEntreprise} — {entretien.titreOffre}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {formatDateJour(date, locale).charAt(0).toUpperCase() +
              formatDateJour(date, locale).slice(1)}{" "}
            · {formatHeure(date, locale)}
          </p>
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUT_COLORS[entretien.statut]}`}
      >
        {t(STATUT_LABEL_KEYS[entretien.statut])}
      </span>
    </div>
  );
}

export default function EntretienCardStagiaire({
  entretien,
  compact = false,
  index = 0,
  maintenant,
}) {
  const { t, locale } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [nouvelleDate, setNouvelleDate] = useState("");
  const [message, setMessage] = useState("");
  const [showAnnulerDialog, setShowAnnulerDialog] = useState(false);
  const [raisonAnnulation, setRaisonAnnulation] = useState("");
  const validerMutation = useValiderEntretien();
  const reprogrammerMutation = useDemanderReprogrammation();
  const annulerMutation = useAnnulerEntretien();

  if (compact) return <EntretienCardCompacte entretien={entretien} />;

  const ModeIcon = MODE_ICONS[entretien.modeEntretien];
  const date = new Date(entretien.dateHeure);
  // `maintenant` est reçu en prop (figé au montage de la page parente via
  // useState(() => Date.now())) — jamais recalculé ici, pour respecter la
  // même règle de pureté du rendu que le reste du projet (voir
  // EntretiensHeaderStats.jsx). Si le composant est utilisé sans cette
  // prop (aucun cas actuel), l'annonce/le lien calendrier sont simplement
  // masqués plutôt que de recalculer Date.now() pendant le rendu.
  const annonce =
    entretien.statut === "confirme" && maintenant != null
      ? formatAnnonceEntretien(date, maintenant, locale, t)
      : null;
  const lienMaps = entretien.lienGoogleMeet
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entretien.lienGoogleMeet)}`
    : null;
  const lienCalendrier =
    entretien.statut === "confirme" ? buildLienGoogleCalendar(entretien) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="rounded-md border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <span
        className={`mb-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_COLORS[entretien.statut]}`}
      >
        {t(STATUT_LABEL_KEYS[entretien.statut])}
      </span>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${couleurAvatar(entretien.nomEntreprise)}`}
          >
            {entretien.nomEntreprise.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h5 className="truncate font-semibold text-foreground">
              {entretien.nomEntreprise}
            </h5>
            <p className="truncate text-sm text-muted-foreground">
              {entretien.titreOffre}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-green-700">
          <ModeIcon className="h-3.5 w-3.5" />
          {t(MODE_LABEL_KEYS[entretien.modeEntretien])}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-foreground">
        <span className="flex items-center gap-1.5">
          <FiCalendar className="h-4 w-4 text-secondary-foreground" />
          {formatDateJour(date, locale).charAt(0).toUpperCase() +
            formatDateJour(date, locale).slice(1)}
        </span>
        <span className="flex items-center gap-1.5">
          <FiClock className="h-4 w-4 text-secondary-foreground" />
          {formatHeure(date, locale)}
        </span>
      </div>

      {annonce && (
        <p className="-mt-3 mb-4 text-xs font-medium text-primary">{annonce}</p>
      )}

      {entretien.modeEntretien !== "video" &&
        entretien.statut === "confirme" &&
        entretien.lienGoogleMeet && (
          <p className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            {entretien.modeEntretien === "telephone" ? (
              <FiPhone className="h-3.5 w-3.5" />
            ) : (
              <FiMapPin className="h-3.5 w-3.5" />
            )}
            {entretien.lienGoogleMeet}
          </p>
        )}

      {entretien.interviewerNom && (
        <div className="mb-4 rounded-sm bg-muted/50 px-3.5 py-2.5">
          <p className="mb-0.5 text-xs font-medium text-muted-foreground">
            {t("interviews.card.interviewer")}
          </p>
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <FiUser className="h-3.5 w-3.5 text-muted-foreground" />
            {entretien.interviewerNom}
            {entretien.interviewerFonction &&
              ` — ${entretien.interviewerFonction}`}
          </p>
        </div>
      )}

      {["planifie", "valide", "confirme", "reprogramme"].includes(
        entretien.statut,
      ) && <NotesPreparation entretien={entretien} />}

      {entretien.statut === "confirme" && (
        <div className="mb-3 flex flex-wrap gap-2">
          {entretien.modeEntretien === "video" && entretien.lienGoogleMeet && (
            <a
              href={entretien.lienGoogleMeet}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <FiVideo className="h-4 w-4" />
              {t("interviews.card.joinVideo")}
            </a>
          )}
          {entretien.modeEntretien === "telephone" && entretien.lienGoogleMeet && (
            <a
              href={`tel:${entretien.lienGoogleMeet.replace(/\s+/g, "")}`}
              className="flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <FiPhone className="h-4 w-4" />
              {t("interviews.actions.call")}
            </a>
          )}
          {entretien.modeEntretien === "presentiel" && lienMaps && (
            <a
              href={lienMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <FiMapPin className="h-4 w-4" />
              {t("interviews.actions.viewAddress")}
            </a>
          )}
          {lienCalendrier && (
            <a
              href={lienCalendrier}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <FiCalendar className="h-4 w-4" />
              {t("interviews.actions.addToCalendar")}
            </a>
          )}
        </div>
      )}

      {entretien.statut === "reprogramme" && (
        <p className="mb-3 rounded-sm bg-accent/10 p-3 text-xs text-amber-800">
          {t("interviews.card.rescheduleProposal", {
            date: new Date(entretien.dateHeureProposee).toLocaleString(locale, {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
        </p>
      )}

      {entretien.statut === "confirme" && (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowAnnulerDialog(true)}
            className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/5 active:scale-95"
          >
            <FiXCircle className="h-4 w-4" />
            {t("interviews.card.cancelInterview")}
          </Button>

          <Dialog open={showAnnulerDialog} onOpenChange={setShowAnnulerDialog}>
            <DialogContent className="rounded-md sm:max-w-110">
              <DialogHeader>
                <DialogTitle>
                  {t("interviews.card.cancelInterview")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground">
                  {t("interviews.card.cancellationReasonInfo")}
                </p>
                <textarea
                  rows={3}
                  placeholder={t("interviews.card.cancellationPlaceholder")}
                  value={raisonAnnulation}
                  onChange={(e) => setRaisonAnnulation(e.target.value)}
                  className="w-full resize-none rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnnulerDialog(false)}
                  >
                    {t("interviews.card.back")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      !raisonAnnulation.trim() || annulerMutation.isPending
                    }
                    onClick={() =>
                      annulerMutation.mutate(
                        { id: entretien.idEntretien, raisonAnnulation },
                        { onSuccess: () => setShowAnnulerDialog(false) },
                      )
                    }
                    className="rounded-sm bg-destructive text-white hover:bg-destructive/90"
                  >
                    {annulerMutation.isPending ? (
                      <FiLoader className="h-4 w-4 animate-spin" />
                    ) : (
                      t("interviews.card.confirmCancellation")
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {entretien.statut === "planifie" && (
        <>
          {!showForm ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={validerMutation.isPending}
                onClick={() => validerMutation.mutate(entretien.idEntretien)}
                className="rounded-sm active:scale-95"
              >
                {validerMutation.isPending ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  <FiCheck className="h-4 w-4" />
                )}
                {t("interviews.card.validateInterview")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-sm"
                onClick={() => setShowForm(true)}
              >
                {t("interviews.card.reschedule")}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="datetime-local"
                value={nouvelleDate}
                onChange={(e) => setNouvelleDate(e.target.value)}
                className="h-10 rounded-sm"
              />
              <textarea
                rows={2}
                placeholder={t("interviews.card.reschedulePlaceholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-none rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    !nouvelleDate || !message || reprogrammerMutation.isPending
                  }
                  onClick={() =>
                    reprogrammerMutation.mutate(
                      {
                        id: entretien.idEntretien,
                        dateHeureProposee: nouvelleDate,
                        retourEntretien: message,
                      },
                      { onSuccess: () => setShowForm(false) },
                    )
                  }
                  className="rounded-sm"
                >
                  {reprogrammerMutation.isPending ? (
                    <FiLoader className="h-4 w-4 animate-spin" />
                  ) : (
                    t("interviews.card.sendProposal")
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  {t("interviews.card.cancel")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {entretien.statut === "annule" && entretien.raisonAnnulation && (
        <p className="rounded-sm bg-destructive/10 p-3 text-xs text-destructive">
          <b>{t("interviews.card.cancelledReason")}</b> —{" "}
          {entretien.raisonAnnulation}
        </p>
      )}
    </motion.div>
  );
}