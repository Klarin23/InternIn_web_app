"use client";
// Drawer "Voir les détails" d'un entretien : panneau latéral sur desktop
// (translateX), bottom sheet sur mobile (translateY), backdrop translucide.
// Réutilise les mêmes hooks/mutations que EntretienCardStagiaire.jsx pour
// Reprogrammer/Annuler (aucune logique backend dupliquée ou réécrite).
//
// Correctif appliqué : le bouton "Annuler l'entretien" vérifiait
// `statut === "valide"`, un statut que le backend n'atteint plus jamais
// (validerEntretien passe directement à "confirme"). Corrigé en
// `statut === "confirme"`, seul état où annulerEntretien() l'autorise
// côté serveur (entretiens.service.js).
//
// Deuxième correctif : `maintenant` est reçu en prop, jamais recalculé via
// Date.now() pendant le rendu (React 19.2 interdit les fonctions impures
// dans le corps d'un composant). Ta page parente calcule déjà `maintenant`
// une seule fois et le transmet ici.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiCalendar, FiClock, FiVideo, FiPhone, FiMapPin, FiUser, FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDemanderReprogrammation,
  useAnnulerEntretien,
  useValiderEntretien
} from "@/lib/queries/useEntretiens";
import {
  STATUT_CONFIG,
  formatDateJour,
  formatHeure,
  formatAnnonceEntretien,
  buildLienGoogleCalendar,
} from "@/lib/entretiens/statut";
import { useTranslation } from "@/lib/i18n/useTranslation";

const MODE_ICONS = { video: FiVideo, telephone: FiPhone, presentiel: FiMapPin };
const MODE_LABEL_KEYS = {
  video: "interviews.modes.video",
  telephone: "interviews.modes.phone",
  presentiel: "interviews.modes.onsite",
};

export default function EntretienDetailsDrawer({ entretien, onClose, maintenant }) {
  const { t, locale } = useTranslation();
  const [estMobile, setEstMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false,
  );
  const [showReprogForm, setShowReprogForm] = useState(false);
  const [showAnnulerForm, setShowAnnulerForm] = useState(false);
  const [nouvelleDate, setNouvelleDate] = useState("");
  const [message, setMessage] = useState("");
  const [raison, setRaison] = useState("");

  const reprogrammerMutation = useDemanderReprogrammation();
  const annulerMutation = useAnnulerEntretien();
  const validerMutation = useValiderEntretien();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e) => setEstMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const ouvert = !!entretien;
  if (!ouvert) return null;

  const date = new Date(entretien.dateHeure);
  const config = STATUT_CONFIG[entretien.statut];
  const ModeIcon = MODE_ICONS[entretien.modeEntretien];
  const peutRejoindre =
    entretien.statut === "confirme" &&
    entretien.modeEntretien === "video" &&
    !!entretien.lienGoogleMeet;
  const peutAppeler =
    entretien.statut === "confirme" &&
    entretien.modeEntretien === "telephone" &&
    !!entretien.lienGoogleMeet;
  const peutVoirAdresse =
    entretien.statut === "confirme" &&
    entretien.modeEntretien === "presentiel" &&
    !!entretien.lienGoogleMeet;
  const lienMaps = entretien.lienGoogleMeet
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entretien.lienGoogleMeet)}`
    : null;
  const annonce =
    entretien.statut === "confirme" && maintenant != null
      ? formatAnnonceEntretien(date, maintenant, locale, t)
      : null;
  const lienCalendrier =
    entretien.statut === "confirme" ? buildLienGoogleCalendar(entretien) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
      />

      <motion.div
        key={entretien.idEntretien}
        initial={estMobile ? { y: "100%" } : { x: "100%" }}
        animate={estMobile ? { y: 0 } : { x: 0 }}
        exit={estMobile ? { y: "100%" } : { x: "100%" }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
        className="fixed z-50 flex flex-col overflow-y-auto bg-card shadow-xl
                   inset-x-0 bottom-0 max-h-[85vh] rounded-t-lg
                   sm:inset-y-0 sm:left-auto sm:right-0 sm:bottom-auto sm:h-full sm:max-h-none sm:w-105 sm:rounded-none"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-bold text-foreground">
            {t("interviews.drawer.title")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("interviews.drawer.close")}
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 px-5 py-5">
          <div>
            <p className="text-base font-semibold text-foreground">
              {entretien.titreOffre}
            </p>
            <p className="text-sm text-muted-foreground">
              {entretien.nomEntreprise}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-foreground">
            <span className="flex items-center gap-1.5">
              <FiCalendar className="h-4 w-4 text-secondary-foreground" />
              {formatDateJour(date, locale)}
            </span>
            <span className="flex items-center gap-1.5">
              <FiClock className="h-4 w-4 text-secondary-foreground" />
              {formatHeure(date, locale)}
            </span>
            <span className="flex items-center gap-1.5">
              <ModeIcon className="h-4 w-4 text-secondary-foreground" />
              {t(MODE_LABEL_KEYS[entretien.modeEntretien])}
            </span>
          </div>

          {annonce && (
            <p className="-mt-3 text-xs font-medium text-primary">{annonce}</p>
          )}

          {entretien.modeEntretien !== "video" && entretien.lienGoogleMeet && (
            <p className="-mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              {entretien.modeEntretien === "telephone" ? (
                <FiPhone className="h-3.5 w-3.5" />
              ) : (
                <FiMapPin className="h-3.5 w-3.5" />
              )}
              {entretien.lienGoogleMeet}
            </p>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("interviews.drawer.status")}
            </p>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
            >
              <config.Icon className="h-3.5 w-3.5" />
              {t(config.badgeKey)}
            </div>
          </div>

          {entretien.interviewerNom && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("interviews.drawer.information")}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-foreground">
                <FiUser className="h-3.5 w-3.5 text-muted-foreground" />
                {entretien.interviewerNom}
                {entretien.interviewerFonction &&
                  ` — ${entretien.interviewerFonction}`}
              </p>
            </div>
          )}

          {entretien.statut === "annule" && entretien.raisonAnnulation && (
            <p className="rounded-sm bg-destructive/10 p-3 text-xs text-destructive">
              <b>{t("interviews.drawer.cancelInterview")}</b> —{" "}
              {entretien.raisonAnnulation}
            </p>
          )}

          {entretien.statut === "confirme" && !showAnnulerForm && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowAnnulerForm(true)}
              className="w-full rounded-sm border-destructive/40 text-destructive hover:bg-destructive/5 active:scale-95"
            >
              {t("interviews.drawer.cancelQuestion")}
            </Button>
          )}

          {showAnnulerForm && (
            <div className="space-y-2 rounded-sm border border-border p-3.5">
              <p className="text-sm font-semibold text-foreground">
                {t("interviews.drawer.cancelQuestion")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("interviews.drawer.cancelInfo")}
              </p>
              <textarea
                rows={2}
                placeholder={t("interviews.drawer.cancelPlaceholder")}
                value={raison}
                onChange={(e) => setRaison(e.target.value)}
                className="w-full resize-none rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnnulerForm(false)}
                >
                  {t("interviews.drawer.back")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!raison.trim() || annulerMutation.isPending}
                  onClick={() =>
                    annulerMutation.mutate(
                      { id: entretien.idEntretien, raisonAnnulation: raison },
                      { onSuccess: () => setShowAnnulerForm(false) },
                    )
                  }
                  className="rounded-sm bg-destructive text-white hover:bg-destructive/90"
                >
                  {annulerMutation.isPending ? (
                    <FiLoader className="h-4 w-4 animate-spin" />
                  ) : (
                    t("interviews.drawer.confirm")
                  )}
                </Button>
              </div>
            </div>
          )}

          {entretien.statut === "planifie" && !showReprogForm && (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={validerMutation.isPending}
                onClick={() => validerMutation.mutate(entretien.idEntretien)}
                className="flex-1 rounded-sm active:scale-95"
              >
                {validerMutation.isPending ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  t("interviews.drawer.validate")
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowReprogForm(true)}
                className="flex-1 rounded-sm active:scale-95"
              >
                {t("interviews.drawer.reschedule")}
              </Button>
            </div>
          )}

          {showReprogForm && (
            <div className="space-y-2 rounded-sm border border-border p-3.5">
              <p className="text-sm font-semibold text-foreground">
                {t("interviews.drawer.modify")}
              </p>
              <Input
                type="datetime-local"
                value={nouvelleDate}
                onChange={(e) => setNouvelleDate(e.target.value)}
                className="h-10 rounded-sm"
              />
              <textarea
                rows={2}
                placeholder={t("interviews.drawer.reschedulePlaceholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-none rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReprogForm(false)}
                >
                  {t("interviews.drawer.back")}
                </Button>
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
                      { onSuccess: () => setShowReprogForm(false) },
                    )
                  }
                  className="rounded-sm"
                >
                  {reprogrammerMutation.isPending ? (
                    <FiLoader className="h-4 w-4 animate-spin" />
                  ) : (
                    t("interviews.drawer.confirm")
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {(peutRejoindre || peutAppeler || peutVoirAdresse || lienCalendrier) && (
          <div className="space-y-2 border-t border-border px-5 py-4">
            {peutRejoindre && (
              <a
                href={entretien.lienGoogleMeet}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-[#14b8a6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d9488] active:scale-95"
              >
                <FiVideo className="h-4 w-4" />
                {t("interviews.drawer.join")}
              </a>
            )}
            {peutAppeler && (
              <a
                href={`tel:${entretien.lienGoogleMeet.replace(/\s+/g, "")}`}
                className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-95"
              >
                <FiPhone className="h-4 w-4" />
                {t("interviews.actions.call")}
              </a>
            )}
            {peutVoirAdresse && (
              <a
                href={lienMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-95"
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
                className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-95"
              >
                <FiCalendar className="h-4 w-4" />
                {t("interviews.actions.addToCalendar")}
              </a>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}