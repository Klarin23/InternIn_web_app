"use client";
// Chemin : internin-web/components/features/entretiens/PlanifierEntretienDialog.jsx
//
// Réécriture complète de l'interface de planification d'un entretien côté
// ENTREPRISE (sections 1 à 7 de la refonte). La logique métier ne change
// pas : même mutation (usePlanifierEntretien), même payload envoyé au
// backend ({ idCandidature, dateHeure, modeEntretien, lienGoogleMeet }).
// "lienGoogleMeet" reste le nom de champ envoyé au serveur quel que soit le
// mode (vidéo / téléphone / présentiel) — voir entretiens.service.js.

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiLoader,
  FiAlertCircle,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePlanifierEntretien } from "@/lib/queries/useEntretiens";
import { toast } from "@/lib/store/useToastStore";
import {
  MODES_ENTRETIEN,
  champLienConfig,
  validerChampLien,
  champsVersDateHeure,
  estDateHeurePassee,
  formatDateLongue,
} from "@/lib/entretiens/planification";

// Même logique de couleur déterministe que EntretienCardStagiaire.jsx —
// utilisée seulement en absence de vraie photo de profil.
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

function CandidatAvatar({ nom, photoUrl }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={nom}
        className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
      />
    );
  }
  const initiales = nom
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${couleurAvatar(nom)}`}
    >
      {initiales}
    </div>
  );
}

export default function PlanifierEntretienDialog({
  idCandidature,
  candidatNom,
  candidatPhoto = null,
  offreTitre = "",
  openControlled,
  onOpenChangeControlled,
  hideTrigger = false,
}) {
  const [openInterne, setOpenInterne] = useState(false);
  const open = openControlled !== undefined ? openControlled : openInterne;
  const setOpen = onOpenChangeControlled || setOpenInterne;

  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [modeEntretien, setModeEntretien] = useState("video");
  const [lienGoogleMeet, setLienGoogleMeet] = useState("");
  const [erreurLien, setErreurLien] = useState("");
  const [erreurDate, setErreurDate] = useState("");
  const [tentativeEnvoi, setTentativeEnvoi] = useState(false);

  const mutation = usePlanifierEntretien();
  const reduceMotion = useReducedMotion();

  const champConfig = champLienConfig(modeEntretien);
  const dateHeureIso = champsVersDateHeure(date, heure);
  const dateHeureValide = !!date && !!heure && !estDateHeurePassee(date, heure);

  // Réinitialise le formulaire à chaque fermeture, pour ne pas retrouver les
  // valeurs de la planification précédente si le dialog est réutilisé
  // (cas des composants "contrôlés" comme CandidatsKanban.jsx).
  function resetFormulaire() {
    setDate("");
    setHeure("");
    setModeEntretien("video");
    setLienGoogleMeet("");
    setErreurLien("");
    setErreurDate("");
    setTentativeEnvoi(false);
    mutation.reset();
  }

  function handleOpenChange(nextOpen) {
    setOpen(nextOpen);
    if (!nextOpen) resetFormulaire();
  }

  function validerFormulaire() {
    let ok = true;
    if (!date || !heure) {
      setErreurDate("La date et l'heure sont requises");
      ok = false;
    } else if (estDateHeurePassee(date, heure)) {
      setErreurDate("Impossible de planifier un entretien à une date passée");
      ok = false;
    } else {
      setErreurDate("");
    }

    const { valide, message } = validerChampLien(modeEntretien, lienGoogleMeet);
    if (!valide) {
      setErreurLien(message);
      ok = false;
    } else {
      setErreurLien("");
    }

    return ok;
  }

  function handleSubmit() {
    setTentativeEnvoi(true);
    if (!validerFormulaire()) return;

    mutation.mutate(
      {
        idCandidature,
        dateHeure: dateHeureIso,
        modeEntretien,
        lienGoogleMeet,
      },
      {
        onSuccess: () => {
          toast.success("Entretien planifié avec succès");
          handleOpenChange(false);
        },
      },
    );
  }

  const transitionRapide = {
    duration: reduceMotion ? 0 : 0.18,
    ease: "easeOut",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-sm"
          >
            <FiCalendar className="h-4 w-4" />
            Planifier un entretien
          </Button>
        </DialogTrigger>
      )}

      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] w-full max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-md p-0 sm:max-w-[600px]"
      >
        {/* ===== HEADER : candidat + offre ===== */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <CandidatAvatar nom={candidatNom} photoUrl={candidatPhoto} />
            <div>
              <DialogHeader className="items-start text-left">
                <DialogTitle className="text-base font-semibold text-foreground">
                  {candidatNom}
                </DialogTitle>
              </DialogHeader>
              {offreTitre && (
                <p className="text-sm text-muted-foreground">{offreTitre}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            aria-label="Fermer"
            className="rounded-sm p-1.5 text-muted-foreground transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          {/* ===== SECTION : Date et heure ===== */}
          <section aria-labelledby="section-date-heure">
            <h4
              id="section-date-heure"
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <FiCalendar className="h-4 w-4 text-primary" />
              Date et heure
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="entretien-date">Date</Label>
                <Input
                  id="entretien-date"
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setErreurDate("");
                  }}
                  aria-invalid={tentativeEnvoi && !!erreurDate}
                  className="h-12 rounded-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entretien-heure">Heure</Label>
                <Input
                  id="entretien-heure"
                  type="time"
                  value={heure}
                  onChange={(e) => {
                    setHeure(e.target.value);
                    setErreurDate("");
                  }}
                  aria-invalid={tentativeEnvoi && !!erreurDate}
                  className="h-12 rounded-sm"
                />
              </div>
            </div>

            {dateHeureValide && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <FiClock className="h-3.5 w-3.5 text-primary" />
                {formatDateLongue(date, heure)} · {heure}
              </p>
            )}

            {tentativeEnvoi && erreurDate && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                <FiAlertCircle className="h-3.5 w-3.5" />
                {erreurDate}
              </p>
            )}
          </section>

          {/* ===== SECTION : Mode de l'entretien ===== */}
          <section aria-labelledby="section-mode">
            <h4
              id="section-mode"
              className="mb-3 text-sm font-semibold text-foreground"
            >
              Mode de l&apos;entretien
            </h4>
            <div
              role="radiogroup"
              aria-labelledby="section-mode"
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
            >
              {MODES_ENTRETIEN.map((m) => {
                const selectionne = modeEntretien === m.valeur;
                return (
                  <button
                    key={m.valeur}
                    type="button"
                    role="radio"
                    aria-checked={selectionne}
                    onClick={() => {
                      setModeEntretien(m.valeur);
                      setErreurLien("");
                    }}
                    className={`group flex flex-col items-start gap-1.5 rounded-sm border p-3.5 text-left transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98] ${
                      selectionne
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/3"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                        selectionne
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      }`}
                    >
                      <m.Icon className="h-4.5 w-4.5" />
                    </span>
                    <span
                      className={`text-sm font-semibold ${selectionne ? "text-primary" : "text-foreground"}`}
                    >
                      {m.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {m.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ===== SECTION : champ dynamique selon le mode ===== */}
          <section aria-labelledby="section-info-rdv">
            <AnimatePresence mode="wait">
              <motion.div
                key={modeEntretien}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                transition={transitionRapide}
                className="space-y-1.5"
              >
                <Label
                  id="section-info-rdv"
                  htmlFor="entretien-champ-lien"
                  className="flex items-center gap-1.5"
                >
                  <champConfig.Icon className="h-4 w-4 text-primary" />
                  {champConfig.label}{" "}
                  {champConfig.obligatoire ? (
                    <span className="text-destructive">*</span>
                  ) : (
                    <span className="text-muted-foreground">(facultatif)</span>
                  )}
                </Label>
                <Input
                  id="entretien-champ-lien"
                  type={champConfig.type}
                  placeholder={champConfig.placeholder}
                  value={lienGoogleMeet}
                  onChange={(e) => {
                    setLienGoogleMeet(e.target.value);
                    setErreurLien("");
                  }}
                  aria-invalid={!!erreurLien}
                  className="h-12 rounded-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {champConfig.aide}
                </p>
                {erreurLien && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <FiAlertCircle className="h-3.5 w-3.5" />
                    {erreurLien}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          {/* ===== SECTION : récapitulatif ===== */}
          <AnimatePresence>
            {dateHeureValide && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={transitionRapide}
                className="overflow-hidden rounded-sm border border-border bg-muted/40 p-4"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Récapitulatif de l&apos;entretien
                </p>
                <div className="space-y-1.5 text-sm text-foreground">
                  <p className="flex items-center gap-1.5">
                    <FiCalendar className="h-3.5 w-3.5 text-primary" />
                    {formatDateLongue(date, heure)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <FiClock className="h-3.5 w-3.5 text-primary" />
                    {heure}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <champConfig.Icon className="h-3.5 w-3.5 text-primary" />
                    {
                      MODES_ENTRETIEN.find((m) => m.valeur === modeEntretien)
                        ?.label
                    }
                  </p>
                  {lienGoogleMeet.trim() && !erreurLien && (
                    <p className="pl-5 text-muted-foreground">
                      {lienGoogleMeet.trim()}
                    </p>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <FiAlertCircle className="h-4 w-4 shrink-0" />
              {mutation.error.message}
            </div>
          )}
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2.5 border-t border-border bg-card px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
            className="rounded-sm"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="min-w-[180px] rounded-sm"
          >
            {mutation.isPending ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                Planification...
              </>
            ) : (
              <>
                <FiCheck className="h-4 w-4" />
                Confirmer l&apos;entretien
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
