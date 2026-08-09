"use client";
// Chemin : internin-web/components/features/offres/PostulerDialog.jsx
//
// Parcours de candidature en 4 étapes :
//   Profil → Motivation → Documents → Vérification → Envoi
//
// Logique métier inchangée :
//   POST /candidatures { idOffre, lettreMotivation }
//   CV = profil.cvUrl (upload via /documents/upload/cv + PATCH /stagiaires/me)

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiLoader,
  FiMapPin,
  FiSend,
  FiUploadCloud,
  FiUser,
  FiX,
} from "react-icons/fi";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { postulerRequest } from "@/lib/api/candidatures";
import { uploadDocumentRequest } from "@/lib/api/documents";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useStagiaireProfile,
  useUpdateStagiaireProfile,
} from "@/lib/queries/useStagiaireProfile";
import { calculerCompletionProfil } from "@/lib/utils/profilCompletion";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { dureeLabel, estOffreExpiree } from "@/lib/constants/offres";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

const MAX_MOTIVATION = 1000;
const ACCEPT_CV =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_CV_BYTES = 5 * 1024 * 1024;

const ETAPES = [
  { id: 0, key: "profil", label: "Profil" },
  { id: 1, key: "motivation", label: "Motivation" },
  { id: 2, key: "documents", label: "Documents" },
  { id: 3, key: "verification", label: "Vérification" },
];

function initiales(prenom, nom) {
  const a = (prenom || "").charAt(0);
  const b = (nom || "").charAt(0);
  return `${a}${b}`.toUpperCase() || "?";
}

function formationPrincipale(profil) {
  const f = profil?.formations?.[0];
  if (!f) return null;
  const parts = [
    f.diplome,
    f.anneeEtude ? `Année ${f.anneeEtude}` : null,
    f.faculte || f.departement,
  ].filter(Boolean);
  return parts.length ? parts.join(" — ") : null;
}

function etablissementPrincipal(profil) {
  const f = profil?.formations?.[0];
  return f?.nomUniversite || null;
}

/* ─── Stepper ─── */

function CandidatureStepper({ etape, onGo }) {
  return (
    <nav aria-label="Progression de la candidature" className="w-full">
      <ol className="hidden items-center sm:flex">
        {ETAPES.map((e, i) => {
          const done = i < etape;
          const active = i === etape;
          return (
            <li key={e.key} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => done && onGo(i)}
                disabled={!done}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-sm px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  done && "cursor-pointer",
                )}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    done && "bg-primary text-primary-foreground",
                    active &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !done && !active && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <FiCheck className="h-4 w-4" aria-hidden /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    active || done
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {e.label}
                </span>
              </button>
              {i < ETAPES.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 rounded-full",
                    i < etape ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3 sm:hidden">
        <div className="flex flex-1 gap-1">
          {ETAPES.map((e, i) => (
            <div
              key={e.key}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= etape ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {etape + 1}/{ETAPES.length} · {ETAPES[etape].label}
        </span>
      </div>
    </nav>
  );
}

/* ─── Étape Profil ─── */

function EtapeProfil({ profil, completion, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <FiLoader className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const prenom = profil?.prenom || "";
  const nom = profil?.nom || "";
  const formation = formationPrincipale(profil);
  const etab = etablissementPrincipal(profil);
  const ville = profil?.ville || null;
  const competences = (profil?.competences || []).slice(0, 8);
  const pct = completion?.pourcentage ?? 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Vérifiez les informations qui seront visibles par l&apos;entreprise.
      </p>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          {profil?.photoProfilUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profil.photoProfilUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
              {initiales(prenom, nom)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-foreground">
              {prenom} {nom}
            </h3>
            {profil?.titreProfessionnel && (
              <p className="truncate text-sm text-muted-foreground">
                {profil.titreProfessionnel}
              </p>
            )}
          </div>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-foreground">
          {formation && (
            <li className="flex items-start gap-2">
              <FiBriefcase className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{formation}</span>
            </li>
          )}
          {etab && (
            <li className="flex items-start gap-2">
              <FiUser className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{etab}</span>
            </li>
          )}
          {ville && (
            <li className="flex items-start gap-2">
              <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{ville}</span>
            </li>
          )}
        </ul>

        {competences.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {competences.map((c) => {
              const label = typeof c === "string" ? c : c.nom || c.libelle;
              if (!label) return null;
              return (
                <span
                  key={label}
                  className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-foreground"
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">
              Profil complété
            </span>
            <span className="font-semibold text-foreground">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {completion?.complet ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-800 dark:text-emerald-300">
          <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Votre profil est prêt pour cette candidature.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-900 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Votre profil n&apos;est pas complètement renseigné
              {completion?.manquants?.length
                ? ` (${completion.manquants.length} élément${completion.manquants.length > 1 ? "s" : ""} manquant${completion.manquants.length > 1 ? "s" : ""})`
                : ""}
              .
            </span>
          </div>
          <Link
            href="/profil"
            className="shrink-0 text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            Compléter mon profil
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─── Étape Motivation ─── */

function EtapeMotivation({ value, onChange }) {
  const len = value.length;
  const nearLimit = len > MAX_MOTIVATION * 0.9;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="lettreMotivation" className="text-sm font-semibold">
          Pourquoi souhaitez-vous rejoindre cette entreprise&nbsp;?
        </Label>
        <Textarea
          id="lettreMotivation"
          rows={8}
          maxLength={MAX_MOTIVATION}
          placeholder="Présentez brièvement votre motivation et expliquez pourquoi cette offre correspond à votre parcours…"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_MOTIVATION))}
          className="min-h-[160px] resize-y rounded-lg text-sm leading-relaxed"
        />
      </div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="text-muted-foreground">
          Présentez brièvement votre motivation et le lien avec votre parcours.
          Facultatif, mais recommandé.
        </p>
        <span
          className={cn(
            "shrink-0 font-medium tabular-nums",
            nearLimit ? "text-amber-600" : "text-muted-foreground",
          )}
        >
          {len} / {MAX_MOTIVATION}
        </span>
      </div>
    </div>
  );
}

/* ─── Étape Documents ─── */

function EtapeDocuments({
  profil,
  token,
  onCvUpdated,
  uploading,
  setUploading,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [erreurFichier, setErreurFichier] = useState("");
  const updateProfile = useUpdateStagiaireProfile();

  const cvUrl = profil?.cvUrl || null;
  const nomFichier = cvUrl
    ? decodeURIComponent(cvUrl.split("/").pop() || "CV")
    : null;

  const validerEtUploader = useCallback(
    async (file) => {
      if (!file) return;
      setErreurFichier("");

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "doc", "docx"].includes(ext || "")) {
        setErreurFichier("Formats acceptés : PDF, DOC, DOCX");
        return;
      }
      if (file.size > MAX_CV_BYTES) {
        setErreurFichier("Fichier trop volumineux (max. 5 Mo)");
        return;
      }

      setUploading(true);
      try {
        const { url } = await uploadDocumentRequest(file, "cv", token);
        await updateProfile.mutateAsync({ cvUrl: url });
        onCvUpdated?.();
        toast.success("CV enregistré sur votre profil");
      } catch (err) {
        setErreurFichier(err.message || "Échec de l'envoi du CV");
      } finally {
        setUploading(false);
      }
    },
    [token, updateProfile, onCvUpdated, setUploading],
  );

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validerEtUploader(file);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Votre CV est joint automatiquement depuis votre profil. Vous pouvez le
        remplacer ici si besoin.
      </p>

      {cvUrl ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FiFileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {nomFichier}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <FiCheck className="h-3.5 w-3.5" />
              Document prêt à être transmis
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Voir
            </a>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              Remplacer
            </button>
          </div>
        </motion.div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <FiLoader className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <FiUploadCloud className="h-8 w-8 text-primary" />
          )}
          <p className="text-sm font-semibold text-foreground">
            {uploading ? "Envoi en cours…" : "Ajouter votre CV"}
          </p>
          <p className="text-xs text-muted-foreground">
            Glissez-déposez votre fichier ici ou cliquez pour parcourir
          </p>
          <p className="text-[11px] text-muted-foreground">
            PDF · DOC · DOCX · max 5 Mo
          </p>
        </div>
      )}

      {!cvUrl && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-900 dark:text-amber-200">
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Aucun CV sur votre profil. Ajoutez-le pour maximiser vos chances.
          </span>
        </div>
      )}

      {erreurFichier && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {erreurFichier}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_CV}
        className="sr-only"
        aria-label="Sélectionner un CV"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) validerEtUploader(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ─── Étape Vérification ─── */

function EtapeVerification({
  offre,
  offreTitle,
  profil,
  lettreMotivation,
  onGo,
  t,
}) {
  const titre = offre?.titre || offreTitle || "Offre";
  const entreprise = offre?.nomEntreprise || null;
  const ville = offre?.villeEntreprise || null;
  const duree = offre?.dureeStage ? dureeLabel(t, offre.dureeStage) : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Vérifiez les informations avant d&apos;envoyer votre candidature.
      </p>

      <section className="rounded-xl border border-border bg-card p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Offre
        </h4>
        <p className="font-semibold text-foreground">{titre}</p>
        {entreprise && (
          <p className="mt-0.5 text-sm text-muted-foreground">{entreprise}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {ville && (
            <span className="flex items-center gap-1">
              <FiMapPin className="h-3.5 w-3.5" />
              {ville}
            </span>
          )}
          {duree && (
            <span className="flex items-center gap-1">
              <FiClock className="h-3.5 w-3.5" />
              {duree}
            </span>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Candidat
          </h4>
          <button
            type="button"
            onClick={() => onGo(0)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Modifier
          </button>
        </div>
        <p className="font-semibold text-foreground">
          {profil?.prenom} {profil?.nom}
        </p>
        {formationPrincipale(profil) && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formationPrincipale(profil)}
          </p>
        )}
        {etablissementPrincipal(profil) && (
          <p className="text-sm text-muted-foreground">
            {etablissementPrincipal(profil)}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Motivation
          </h4>
          <button
            type="button"
            onClick={() => onGo(1)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Modifier
          </button>
        </div>
        {lettreMotivation.trim() ? (
          <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {lettreMotivation.trim()}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Aucune lettre de motivation
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Documents
          </h4>
          <button
            type="button"
            onClick={() => onGo(2)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Modifier
          </button>
        </div>
        {profil?.cvUrl ? (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <FiCheck className="h-4 w-4 text-emerald-600" />
            <span className="truncate">
              {decodeURIComponent(profil.cvUrl.split("/").pop() || "CV")}
            </span>
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <FiAlertCircle className="h-4 w-4 text-amber-600" />
            Aucun CV joint
          </p>
        )}
      </section>
    </div>
  );
}

/* ─── Succès ─── */

function CandidatureSuccess({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="flex flex-col items-center px-2 py-8 text-center sm:py-10"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 18,
          delay: 0.08,
        }}
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600"
      >
        <FiCheck className="h-8 w-8" strokeWidth={2.5} />
      </motion.div>
      <h3 className="text-xl font-bold text-foreground">
        Candidature envoyée&nbsp;!
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Votre candidature a bien été transmise à l&apos;entreprise. Vous pouvez
        suivre son évolution depuis votre espace candidat.
      </p>
      <div className="mt-7 flex w-full flex-col gap-2.5 sm:max-w-xs">
        <Button asChild className="h-11 rounded-lg">
          <Link href="/candidatures">Voir ma candidature</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="h-11 rounded-lg"
        >
          Fermer
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Dialog principal ─── */

export default function PostulerDialog({ idOffre, offreTitle, offre = null }) {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [etape, setEtape] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lettreMotivation, setLettreMotivation] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);

  const {
    data: profilData,
    isLoading: loadingProfil,
    refetch: refetchProfil,
  } = useStagiaireProfile();
  const profil = profilData?.stagiaire || profilData || null;
  const completion = useMemo(() => calculerCompletionProfil(profil), [profil]);

  const dirty = lettreMotivation.trim().length > 0;

  const mutation = useMutation({
    mutationFn: () =>
      postulerRequest(
        {
          idOffre,
          lettreMotivation: lettreMotivation.trim() || undefined,
        },
        token,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidatureStatut", idOffre],
      });
      queryClient.invalidateQueries({ queryKey: ["mesCandidatures"] });
      setSuccess(true);
      toast.success("Candidature envoyée");
    },
  });

  function resetAll() {
    setEtape(0);
    setDirection(1);
    setLettreMotivation("");
    setSuccess(false);
    setConfirmQuit(false);
    mutation.reset();
  }

  function handleOpenChange(next) {
    if (!next) {
      if (dirty && !success && !mutation.isPending) {
        setConfirmQuit(true);
        return;
      }
      setOpen(false);
      setTimeout(resetAll, 200);
      return;
    }
    setOpen(true);
  }

  function goTo(next) {
    setDirection(next > etape ? 1 : -1);
    setEtape(next);
    mutation.reset();
  }

  function handleContinuer() {
    if (etape < ETAPES.length - 1) goTo(etape + 1);
  }

  function handleRetour() {
    if (etape > 0) goTo(etape - 1);
  }

  function handleEnvoyer() {
    if (mutation.isPending || uploadingCv) return;
    mutation.mutate();
  }

  const variants = {
    enter: (dir) => ({
      x: reduceMotion ? 0 : dir > 0 ? 28 : -28,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({
      x: reduceMotion ? 0 : dir > 0 ? -28 : 28,
      opacity: 0,
    }),
  };

  const titreOffre = offre?.titre || offreTitle || "cette offre";
  const nomEntreprise = offre?.nomEntreprise || null;
    const expiree = estOffreExpiree(offre);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {expiree ? (
        <button
          type="button"
          disabled
          className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 text-sm font-semibold text-destructive"
        >
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          Offre expirée
        </button>
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="group/postuler flex h-12 w-full items-center justify-center gap-2 rounded-sm text-sm font-semibold shadow-sm"
        >
          <FiSend className="h-4 w-4 shrink-0" />
          {t("offersPage.apply.cta")}
        </Button>
      )}

      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[min(92vh,840px)] w-full flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[560px]",
          "bg-background shadow-2xl ring-1 ring-border",
        )}
        onInteractOutside={(e) => {
          if (mutation.isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (mutation.isPending) e.preventDefault();
        }}
      >
        {!success && (
          <div className="shrink-0 border-b border-border px-5 pb-4 pt-5 sm:px-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-foreground sm:text-lg">
                  Postuler à cette offre
                </DialogTitle>
                <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {titreOffre}
                </p>
                {nomEntreprise && (
                  <p className="truncate text-xs text-muted-foreground">
                    {nomEntreprise}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                disabled={mutation.isPending}
                aria-label="Fermer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <CandidatureStepper etape={etape} onGo={goTo} />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {success ? (
            <CandidatureSuccess
              onClose={() => {
                setOpen(false);
                setTimeout(resetAll, 200);
              }}
            />
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={etape}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: reduceMotion ? 0 : 0.22,
                  ease: "easeOut",
                }}
              >
                {etape === 0 && (
                  <EtapeProfil
                    profil={profil}
                    completion={completion}
                    loading={loadingProfil}
                  />
                )}
                {etape === 1 && (
                  <EtapeMotivation
                    value={lettreMotivation}
                    onChange={setLettreMotivation}
                  />
                )}
                {etape === 2 && (
                  <EtapeDocuments
                    profil={profil}
                    token={token}
                    uploading={uploadingCv}
                    setUploading={setUploadingCv}
                    onCvUpdated={() => refetchProfil()}
                  />
                )}
                {etape === 3 && (
                  <EtapeVerification
                    offre={offre}
                    offreTitle={offreTitle}
                    profil={profil}
                    lettreMotivation={lettreMotivation}
                    onGo={goTo}
                    t={t}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {!success && mutation.isError && (
            <div className="mt-4 space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <div className="flex items-start gap-2 font-semibold">
                <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Impossible d&apos;envoyer votre candidature
              </div>
              <p className="pl-6 text-destructive/90">
                {mutation.error?.message ||
                  "Vérifiez votre connexion et réessayez."}
              </p>
              <div className="pl-6">
                <button
                  type="button"
                  onClick={() => mutation.mutate()}
                  className="text-xs font-semibold underline underline-offset-2"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}
        </div>

        {!success && (
          <div className="shrink-0 border-t border-border bg-card/80 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              {etape > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRetour}
                  disabled={mutation.isPending}
                  className="h-11 rounded-lg px-4"
                >
                  <FiArrowLeft className="h-4 w-4" />
                  {etape === ETAPES.length - 1 ? "Modifier" : "Retour"}
                </Button>
              ) : (
                <span />
              )}

              {etape < ETAPES.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleContinuer}
                  disabled={loadingProfil || uploadingCv}
                  className="h-11 min-w-[140px] rounded-lg"
                >
                  Continuer
                  <FiArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleEnvoyer}
                  disabled={mutation.isPending || uploadingCv}
                  className="h-11 min-w-[180px] rounded-lg"
                >
                  {mutation.isPending ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin" />
                      Envoi de la candidature…
                    </>
                  ) : (
                    <>
                      <FiSend className="h-4 w-4" />
                      Envoyer ma candidature
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {confirmQuit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-end justify-center bg-black/40 p-4 sm:items-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-xl"
                role="alertdialog"
                aria-labelledby="quit-title"
              >
                <h3
                  id="quit-title"
                  className="text-base font-semibold text-foreground"
                >
                  Quitter la candidature&nbsp;?
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Les informations que vous avez saisies pourraient être
                  perdues.
                </p>
                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 rounded-lg"
                    onClick={() => setConfirmQuit(false)}
                  >
                    Continuer la candidature
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-10 rounded-lg"
                    onClick={() => {
                      setConfirmQuit(false);
                      setOpen(false);
                      setTimeout(resetAll, 200);
                    }}
                  >
                    Quitter
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
