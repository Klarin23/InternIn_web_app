"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiVideo,
  FiPhone,
  FiMapPin,
  FiChevronDown,
  FiMoreHorizontal,
  FiXCircle,
  FiCheckCircle,
  FiUserX,
  FiLoader,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUpdateEntretienEntreprise } from "@/lib/queries/useEntretiens";
import {
  STATUT_CONFIG,
  formatJourRelatif,
  formatHeure,
  formatCompteARebours,
} from "@/lib/entretiens/statut";
import { MODE_ICONS, MODE_LABELS } from "@/lib/entretiens/planification";
import FaireOffreDialog from "@/components/features/entretiens/FaireOffreDialog";
import RejeterCandidatDialog from "@/components/features/entretiens/RejeterCandidatDialog";
import HistoriqueOffresFinales from "@/components/features/entretiens/HistoriqueOffresFinales";
import { cn } from "@/lib/utils";

const STATUT_LABELS_ENTREPRISE = {
  planifie: "En attente du candidat",
  valide: "Validé par le candidat",
  confirme: "Confirmé",
  reprogramme: "Reprogrammation demandée",
  termine: "Terminé",
  annule: "Annulé",
  absent: "Absence",
};

const OFFRE_FINALE_MESSAGES = {
  en_attente: {
    text: "En attente de validation par l'administration",
    className: "bg-[#FEF3C7] text-[#B45309]",
  },
  approuve: {
    text: "Offre validée par l'administration",
    className: "bg-success/10 text-green-700",
  },
  rejete: {
    text: "Offre rejetée par l'administration",
    className: "bg-destructive/10 text-destructive",
  },
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

function CandidatAvatar({ nom, photoUrl }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt=""
        className="size-11 shrink-0 rounded-full object-cover ring-2 ring-border/40"
      />
    );
  }
  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white/20",
        couleurAvatar(nom),
      )}
    >
      {nom
        .split(" ")
        .map((p) => p.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </div>
  );
}

function MenuActionsSecondaires({ actions }) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickExterieur(e) {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    }
    function onEchap(e) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("mousedown", onClickExterieur);
    document.addEventListener("keydown", onEchap);
    return () => {
      document.removeEventListener("mousedown", onClickExterieur);
      document.removeEventListener("keydown", onEchap);
    };
  }, []);

  if (!actions?.length) return null;

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Plus d'actions"
        aria-haspopup="menu"
        aria-expanded={ouvert}
        onClick={() => setOuvert((v) => !v)}
        className="rounded-lg"
      >
        <FiMoreHorizontal className="h-4 w-4" />
      </Button>
      <AnimatePresence>
        {ouvert && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg ring-1 ring-foreground/5"
          >
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                role="menuitem"
                disabled={a.disabled}
                onClick={() => {
                  setOuvert(false);
                  a.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
                  a.destructif ? "text-destructive" : "text-foreground",
                )}
              >
                {a.Icon && <a.Icon className="h-3.5 w-3.5" />}
                {a.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatDateAffichee(date, maintenant) {
  const jour = formatJourRelatif(date, maintenant, "fr-FR");
  const heure = formatHeure(date, "fr-FR");
  return `${jour} · ${heure}`;
}

export default function EntretienCardEntreprise({
  entretien,
  maintenant: maintenantProp,
  index = 0,
}) {
  const reduceMotion = useReducedMotion();
  const [nouvelleDate, setNouvelleDate] = useState("");
  const [lienSaisi, setLienSaisi] = useState("");
  const [erreurLienSaisi, setErreurLienSaisi] = useState("");
  const [detailsOuverts, setDetailsOuverts] = useState(false);
  const [confirmAnnulation, setConfirmAnnulation] = useState(false);
  const updateMutation = useUpdateEntretienEntreprise();
  const [maintenant] = useState(() => maintenantProp ?? Date.now());

  function lienVisioValide(lien) {
    try {
      return ["http:", "https:"].includes(new URL(lien).protocol);
    } catch {
      return false;
    }
  }

  const ModeIcon = MODE_ICONS[entretien.modeEntretien];
  const config = STATUT_CONFIG[entretien.statut];
  const date = new Date(entretien.dateHeure);
  const dateAffichee = formatDateAffichee(date, maintenant);
  const dateComplete = date.toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const compteARebours =
    entretien.statut === "confirme"
      ? formatCompteARebours(date, maintenant)
      : null;

  const badgeLabel =
    entretien.statut === "termine" && entretien.idOffreFinale
      ? entretien.statutValidationPlateforme === "approuve"
        ? "Terminé"
        : OFFRE_FINALE_MESSAGES[entretien.statutValidationPlateforme]?.text
      : STATUT_LABELS_ENTREPRISE[entretien.statut];
  const badgeClassName =
    entretien.statut === "termine" && entretien.idOffreFinale
      ? OFFRE_FINALE_MESSAGES[entretien.statutValidationPlateforme]?.className
      : config?.className;

  const lienMaps = entretien.lienGoogleMeet
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entretien.lienGoogleMeet)}`
    : null;

  const actionsSecondaires = [];
  if (entretien.statut === "confirme") {
    actionsSecondaires.push({
      label: "Marquer terminé",
      Icon: FiCheckCircle,
      onClick: () =>
        updateMutation.mutate({
          id: entretien.idEntretien,
          payload: { statut: "termine" },
        }),
    });
    actionsSecondaires.push({
      label: "Marquer absence",
      Icon: FiUserX,
      onClick: () =>
        updateMutation.mutate({
          id: entretien.idEntretien,
          payload: { statut: "absent" },
        }),
    });
    actionsSecondaires.push({
      label: "Annuler l'entretien",
      Icon: FiXCircle,
      destructif: true,
      onClick: () => setConfirmAnnulation(true),
    });
  }

  function confirmerAnnulation() {
    updateMutation.mutate(
      {
        id: entretien.idEntretien,
        payload: { statut: "annule" },
      },
      {
        onSettled: () => setConfirmAnnulation(false),
      },
    );
  }

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: reduceMotion ? 0 : Math.min(index * 0.05, 0.3),
          ease: "easeOut",
        }}
        whileHover={reduceMotion ? undefined : { y: -2 }}
        className="group rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md hover:border-border"
      >
        {/* Header: candidat + statut */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <CandidatAvatar
              nom={`${entretien.prenom} ${entretien.nom}`}
              photoUrl={entretien.photoProfilUrl}
            />
            <div className="min-w-0">
              <h5 className="truncate font-semibold text-foreground">
                {entretien.prenom} {entretien.nom}
              </h5>
              <p className="truncate text-sm text-muted-foreground">
                {entretien.titreOffre}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                badgeClassName,
              )}
            >
              <span className="size-1.5 rounded-full bg-current opacity-70" />
              {badgeLabel}
            </span>
            <MenuActionsSecondaires actions={actionsSecondaires} />
          </div>
        </div>

        {/* Date / heure mise en avant */}
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FiCalendar className="size-4 text-primary" />
            {dateAffichee}
          </div>
          {compteARebours && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {compteARebours}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ModeIcon className="size-4" />
            {MODE_LABELS[entretien.modeEntretien]}
          </div>
        </div>

        {/* Reprogrammation */}
        {entretien.statut === "reprogramme" && (
          <div className="mb-3 space-y-2">
            <p className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
              <b>Demande du candidat</b> — proposition :{" "}
              {new Date(entretien.dateHeureProposee).toLocaleString("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              <br />
              {entretien.retourEntretien}
            </p>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={nouvelleDate}
                onChange={(e) => setNouvelleDate(e.target.value)}
                className="h-10 rounded-lg"
              />
              <Button
                type="button"
                size="sm"
                disabled={!nouvelleDate || updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    id: entretien.idEntretien,
                    payload: { dateHeure: nouvelleDate },
                  })
                }
                className="shrink-0 rounded-lg"
              >
                Replanifier
              </Button>
            </div>
          </div>
        )}

        {/* CTA mode */}
        {entretien.statut === "confirme" &&
          entretien.modeEntretien === "video" &&
          (entretien.lienGoogleMeet ? (
            <a
              href={entretien.lienGoogleMeet}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <FiVideo className="h-4 w-4" />
              Rejoindre la réunion
            </a>
          ) : (
            <div className="mb-3">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="Lien de visioconférence (Google Meet, Zoom...)"
                  value={lienSaisi}
                  onChange={(e) => {
                    setLienSaisi(e.target.value);
                    setErreurLienSaisi("");
                  }}
                  className="h-9 rounded-lg text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!lienSaisi.trim() || updateMutation.isPending}
                  onClick={() => {
                    const lien = lienSaisi.trim();
                    if (!lienVisioValide(lien)) {
                      setErreurLienSaisi(
                        "Le lien doit être une URL valide (https://...)",
                      );
                      return;
                    }
                    updateMutation.mutate(
                      {
                        id: entretien.idEntretien,
                        payload: { lienGoogleMeet: lien },
                      },
                      { onSuccess: () => setLienSaisi("") },
                    );
                  }}
                  className="shrink-0 rounded-lg"
                >
                  Enregistrer
                </Button>
              </div>
              {erreurLienSaisi && (
                <p className="mt-1 text-xs text-destructive">{erreurLienSaisi}</p>
              )}
            </div>
          ))}

        {entretien.statut === "confirme" &&
          entretien.modeEntretien === "telephone" &&
          entretien.lienGoogleMeet && (
            <a
              href={`tel:${entretien.lienGoogleMeet.replace(/\s+/g, "")}`}
              className="mb-3 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <FiPhone className="h-4 w-4" />
              Appeler
            </a>
          )}

        {entretien.statut === "confirme" &&
          entretien.modeEntretien === "presentiel" &&
          lienMaps && (
            <a
              href={lienMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <FiMapPin className="h-4 w-4" />
              Voir l&apos;adresse
            </a>
          )}

        {/* Voir les détails */}
        <button
          type="button"
          onClick={() => setDetailsOuverts((v) => !v)}
          aria-expanded={detailsOuverts}
          className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-md"
        >
          <FiChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              detailsOuverts && "rotate-180",
            )}
          />
          {detailsOuverts ? "Masquer les détails" : "Voir les détails"}
        </button>

        <AnimatePresence initial={false}>
          {detailsOuverts && (
            <motion.div
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, height: 0, y: -4 }
              }
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, height: 0, y: -4 }
              }
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mb-3 mt-2 space-y-1.5 rounded-xl bg-muted/40 p-3.5 text-sm">
                <p className="flex items-center gap-1.5 text-foreground">
                  <FiClock className="h-3.5 w-3.5 text-muted-foreground" />
                  {dateComplete}
                </p>
                <p className="flex items-center gap-1.5 text-foreground">
                  <ModeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  {MODE_LABELS[entretien.modeEntretien]}
                </p>
                {entretien.lienGoogleMeet && (
                  <p className="break-words text-muted-foreground">
                    {entretien.lienGoogleMeet}
                  </p>
                )}
                <p className="flex items-center gap-1.5 pt-1 text-foreground">
                  <config.Icon className="h-3.5 w-3.5" />
                  {config.badge || STATUT_LABELS_ENTREPRISE[entretien.statut]}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terminé → offre finale */}
        {entretien.statut === "termine" &&
          !entretien.idOffreFinale &&
          entretien.statutCandidature !== "rejetee" && (
            <>
              <HistoriqueOffresFinales idEntretien={entretien.idEntretien} />
              <div className="mt-2 flex flex-wrap gap-2">
                <FaireOffreDialog
                  idEntretien={entretien.idEntretien}
                  candidatNom={`${entretien.prenom} ${entretien.nom}`}
                />
                <RejeterCandidatDialog
                  idEntretien={entretien.idEntretien}
                  candidatNom={`${entretien.prenom} ${entretien.nom}`}
                />
              </div>
            </>
          )}

        {entretien.statutCandidature === "rejetee" && (
          <p className="mt-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
            Candidature rejetée — un message a été envoyé au candidat pour
            l&apos;en informer.
          </p>
        )}

        {entretien.statut === "termine" && entretien.idOffreFinale && (
          <p
            className={cn(
              "mt-2 rounded-xl p-3 text-xs font-medium",
              OFFRE_FINALE_MESSAGES[entretien.statutValidationPlateforme]
                ?.className,
            )}
          >
            {OFFRE_FINALE_MESSAGES[entretien.statutValidationPlateforme]?.text}
            {entretien.statutValidationPlateforme === "approuve" &&
              " — le candidat a été notifié et peut désormais y répondre."}
          </p>
        )}
      </motion.div>

      {/* Dialog confirmation annulation */}
      <Dialog open={confirmAnnulation} onOpenChange={setConfirmAnnulation}>
        <DialogContent className="rounded-2xl sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Annuler cet entretien ?</DialogTitle>
            <DialogDescription>
              Cette action modifiera le statut de l&apos;entretien et pourra être
              visible par le candidat.
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
                "Annuler l'entretien"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
