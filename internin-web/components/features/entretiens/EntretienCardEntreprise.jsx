"use client";
// Chemin : internin-web/components/features/entretiens/EntretienCardEntreprise.jsx
//
// Réécriture de la carte "entretien déjà planifié" côté ENTREPRISE
// (section 8 de la refonte). Statuts réels réutilisés tels quels
// (lib/entretiens/statut.js) — aucun nouveau système de statut créé.
// "Annuler" réutilise la mutation existante useUpdateEntretienEntreprise
// avec { statut: "annule" }, déjà acceptée par le backend
// (entretiens.schema.js -> updateEntretienEntrepriseSchema), exactement
// comme "Marquer terminé"/"Marquer absence" le faisaient déjà.

import { useEffect, useRef, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiVideo,
  FiPhone,
  FiMapPin,
  FiLoader,
  FiChevronDown,
  FiMoreHorizontal,
  FiXCircle,
  FiCheckCircle,
  FiUserX,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateEntretienEntreprise } from "@/lib/queries/useEntretiens";
import { STATUT_CONFIG } from "@/lib/entretiens/statut";
import { MODE_ICONS, MODE_LABELS } from "@/lib/entretiens/planification";
import FaireOffreDialog from "@/components/features/entretiens/FaireOffreDialog";
import RejeterCandidatDialog from "@/components/features/entretiens/RejeterCandidatDialog";
import HistoriqueOffresFinales from "@/components/features/entretiens/HistoriqueOffresFinales";

// Libellés spécifiques au point de vue entreprise (différents de ceux vus
// par le candidat) — la couleur/icône, elles, viennent de STATUT_CONFIG
// partagé, pour rester visuellement cohérent avec le reste du produit.
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
        className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${couleurAvatar(nom)}`}
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

// Menu "..." pour les actions secondaires — évite de surcharger la carte.
// Composant local minimal (pas de nouvelle dépendance) : se ferme au clic
// à l'extérieur ou sur "Échap".
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
        className="rounded-sm"
      >
        <FiMoreHorizontal className="h-4 w-4" />
      </Button>
      {ouvert && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-sm border border-border bg-popover py-1 shadow-md"
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
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50 ${
                a.destructif ? "text-destructive" : "text-foreground"
              }`}
            >
              {a.Icon && <a.Icon className="h-3.5 w-3.5" />}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EntretienCardEntreprise({ entretien }) {
  const [nouvelleDate, setNouvelleDate] = useState("");
  const [lienSaisi, setLienSaisi] = useState("");
  const [erreurLienSaisi, setErreurLienSaisi] = useState("");
  const [detailsOuverts, setDetailsOuverts] = useState(false);
  const updateMutation = useUpdateEntretienEntreprise();

  // Vérifié aussi côté serveur (entretiens.service.js) — ce contrôle local
  // évite juste un aller-retour réseau pour une erreur de saisie évidente.
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
  const dateFormatee = date.toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  // Tant que l'offre finale n'a pas été validée par l'administration, on
  // n'affiche pas encore "Terminé" comme étiquette définitive : le badge
  // ne passe à "Terminé" (vert) qu'une fois l'offre approuvée. En attendant,
  // il reflète le statut réel de validation.
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

  // Lien Google Maps généré à la volée à partir de l'adresse saisie — ne
  // modifie rien côté backend, "lienGoogleMeet" reste stocké tel quel.
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
      onClick: () => {
        if (
          window.confirm(
            "Annuler cet entretien ? Cette action est visible par le candidat.",
          )
        ) {
          updateMutation.mutate({
            id: entretien.idEntretien,
            payload: { statut: "annule" },
          });
        }
      },
    });
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
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
        <div className="flex flex-shrink-0 items-center gap-1">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClassName}`}
          >
            {badgeLabel}
          </span>
          <MenuActionsSecondaires actions={actionsSecondaires} />
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2 text-sm text-foreground">
        <FiCalendar className="h-4 w-4 text-muted-foreground" />
        {dateFormatee}
      </div>
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <ModeIcon className="h-4 w-4" />
        {MODE_LABELS[entretien.modeEntretien]}
      </div>

      {/* Le candidat a demandé une reprogrammation -> proposer une nouvelle date */}
      {entretien.statut === "reprogramme" && (
        <div className="mb-3 space-y-2">
          <p className="rounded-sm bg-accent/10 p-3 text-xs text-amber-800">
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
              className="h-10 rounded-sm"
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
              className="flex-shrink-0 rounded-sm"
            >
              Replanifier
            </Button>
          </div>
        </div>
      )}

      {/* Action principale liée au mode, uniquement une fois confirmé */}
      {entretien.statut === "confirme" && entretien.modeEntretien === "video" && (
        entretien.lienGoogleMeet ? (
          <a
            href={entretien.lienGoogleMeet}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 inline-flex w-fit items-center gap-2 rounded-sm bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-95"
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
                className="h-9 rounded-sm text-sm"
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
                className="flex-shrink-0 rounded-sm"
              >
                Enregistrer
              </Button>
            </div>
            {erreurLienSaisi && (
              <p className="mt-1 text-xs text-destructive">{erreurLienSaisi}</p>
            )}
          </div>
        )
      )}

      {entretien.statut === "confirme" &&
        entretien.modeEntretien === "telephone" &&
        entretien.lienGoogleMeet && (
          <a
            href={`tel:${entretien.lienGoogleMeet.replace(/\s+/g, "")}`}
            className="mb-3 inline-flex w-fit items-center gap-2 rounded-sm bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-95"
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
            className="mb-3 inline-flex w-fit items-center gap-2 rounded-sm bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-95"
          >
            <FiMapPin className="h-4 w-4" />
            Voir l&apos;adresse
          </a>
        )}

      {/* Voir les détails — dépliant local, pas de nouveau drawer/route */}
      <button
        type="button"
        onClick={() => setDetailsOuverts((v) => !v)}
        className="mb-3 flex items-center gap-1 text-xs font-semibold text-secondary-foreground hover:underline"
      >
        <FiChevronDown
          className={`h-3.5 w-3.5 transition ${detailsOuverts ? "rotate-180" : ""}`}
        />
        {detailsOuverts ? "Masquer les détails" : "Voir les détails"}
      </button>

      {detailsOuverts && (
        <div className="mb-3 space-y-1.5 rounded-sm bg-muted/40 p-3.5 text-sm">
          <p className="flex items-center gap-1.5 text-foreground">
            <FiClock className="h-3.5 w-3.5 text-muted-foreground" />
            {dateFormatee}
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
            {config.badge}
          </p>
        </div>
      )}

      {/* Entretien clôturé positivement -> on peut démarrer le stage, ou
          rejeter le candidat à ce stade */}
      {entretien.statut === "termine" &&
        !entretien.idOffreFinale &&
        entretien.statutCandidature !== "rejetee" && (
          <>
            <HistoriqueOffresFinales idEntretien={entretien.idEntretien} />
            <div className="flex flex-wrap gap-2">
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

      {/* Candidat rejeté après l'entretien -> message envoyé, plus d'action possible */}
      {entretien.statutCandidature === "rejetee" && (
        <p className="rounded-sm bg-destructive/10 p-3 text-xs font-medium text-destructive">
          Candidature rejetée — un message a été envoyé au candidat pour
          l&apos;en informer.
        </p>
      )}

      {/* Offre finale déjà envoyée -> on affiche où en est sa validation */}
      {entretien.statut === "termine" && entretien.idOffreFinale && (
        <p
          className={`rounded-sm p-3 text-xs font-medium ${OFFRE_FINALE_MESSAGES[entretien.statutValidationPlateforme]?.className}`}
        >
          {OFFRE_FINALE_MESSAGES[entretien.statutValidationPlateforme]?.text}
          {entretien.statutValidationPlateforme === "approuve" &&
            " — le candidat a été notifié et peut désormais y répondre."}
        </p>
      )}
    </div>
  );
}