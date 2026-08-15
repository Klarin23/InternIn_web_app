"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  ClipboardList,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEvaluation } from "@/lib/queries/useEvaluations";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

const CRITERES = [
  {
    key: "noteAssiduite",
    label: "Assiduité",
    description: "Ponctualité, présence et respect des horaires",
  },
  {
    key: "noteCommunication",
    label: "Communication",
    description: "Clarté, écoute et qualité des échanges",
  },
  {
    key: "noteInitiative",
    label: "Initiative",
    description: "Proactivité et capacité à proposer des solutions",
  },
  {
    key: "noteProfessionnalisme",
    label: "Professionnalisme",
    description: "Attitude, responsabilité et respect des règles",
  },
  {
    key: "noteTravailEquipe",
    label: "Travail d'équipe",
    description: "Collaboration et contribution au collectif",
  },
  {
    key: "notePerformanceTechnique",
    label: "Performance technique",
    description: "Maîtrise des compétences et qualité du travail",
  },
];

const NOTE_LABELS = {
  1: "Insuffisant",
  2: "À améliorer",
  3: "Satisfaisant",
  4: "Très satisfaisant",
  5: "Excellent",
};

const MAX_COMMENT = 500;

function getAppreciation(moyenne) {
  if (moyenne == null || Number.isNaN(moyenne)) return null;
  if (moyenne < 1.5) return "Insuffisant";
  if (moyenne < 2.5) return "À améliorer";
  if (moyenne < 3.5) return "Satisfaisant";
  if (moyenne < 4.5) return "Très satisfaisant";
  return "Excellent";
}

function getInitials(nom) {
  if (!nom || typeof nom !== "string") return "?";
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function emptyNotes() {
  return Object.fromEntries(CRITERES.map(({ key }) => [key, null]));
}

export default function SoumettreEvaluationDialog({
  idStage,
  stagiaireNom,
  stagiairePoste,
  numeroSemaine,
}) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(emptyNotes);
  const [commentaires, setCommentaires] = useState("");
  const [step, setStep] = useState("form"); // form | confirm | success
  const mutation = useCreateEvaluation();

  const evaluatedCount = useMemo(
    () => CRITERES.filter(({ key }) => notes[key] != null).length,
    [notes],
  );

  const allEvaluated = evaluatedCount === CRITERES.length;

  const moyenne = useMemo(() => {
    if (!allEvaluated) return null;
    const sum = CRITERES.reduce((acc, { key }) => acc + notes[key], 0);
    return Math.round((sum / CRITERES.length) * 10) / 10;
  }, [notes, allEvaluated]);

  const appreciation = getAppreciation(moyenne);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setNotes(emptyNotes());
        setCommentaires("");
        setStep("form");
        mutation.reset();
      }, 200);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when dialog closes
  }, [open]);

  function handleNoteChange(key, value) {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }

  function handleOpenChange(next) {
    if (mutation.isPending) return;
    setOpen(next);
  }

  function handleSubmit() {
    if (!allEvaluated || mutation.isPending) return;
    mutation.mutate(
      {
        idStage,
        noteAssiduite: notes.noteAssiduite,
        noteCommunication: notes.noteCommunication,
        noteInitiative: notes.noteInitiative,
        noteProfessionnalisme: notes.noteProfessionnalisme,
        noteTravailEquipe: notes.noteTravailEquipe,
        notePerformanceTechnique: notes.notePerformanceTechnique,
        commentaires: commentaires.trim() || undefined,
      },
      {
        onSuccess: () => {
          setStep("success");
          toast.success("Évaluation envoyée avec succès");
          setTimeout(() => {
            setOpen(false);
          }, reduceMotion ? 800 : 1600);
        },
        onError: (err) => {
          setStep("form");
          toast.error(err?.message || "Impossible d'envoyer l'évaluation");
        },
      },
    );
  }

  const progressPct = (evaluatedCount / CRITERES.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="rounded-lg">
          Soumettre l&apos;évaluation
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[min(92vh,880px)] w-full flex-col gap-0 overflow-hidden p-0",
          "rounded-2xl border border-border/60 bg-popover shadow-xl ring-1 ring-foreground/5",
          "sm:max-w-[560px]",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-2",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-bottom-2",
          "duration-200",
        )}
      >
        <AnimatePresence mode="wait">
          {step === "success" ? (
            <SuccessState key="success" reduceMotion={reduceMotion} />
          ) : step === "confirm" ? (
            <ConfirmState
              key="confirm"
              stagiaireNom={stagiaireNom}
              moyenne={moyenne}
              appreciation={appreciation}
              isPending={mutation.isPending}
              onCancel={() => setStep("form")}
              onConfirm={handleSubmit}
              reduceMotion={reduceMotion}
            />
          ) : (
            <motion.div
              key="form"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {/* Header */}
              <div className="relative shrink-0 border-b border-border/60 bg-gradient-to-b from-primary/[0.04] to-transparent px-5 pb-4 pt-5 sm:px-6">
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Fermer"
                >
                  <X className="size-4" />
                </button>

                <DialogHeader className="gap-3 pr-8 text-left">
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary ring-2 ring-primary/20">
                      {getInitials(stagiaireNom)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <DialogTitle className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                        Évaluation hebdomadaire
                      </DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">
                        Évaluez les compétences du stagiaire sur la période en
                        cours.
                      </DialogDescription>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          <User className="size-3.5 text-primary" />
                          {stagiaireNom}
                        </span>
                        {stagiairePoste && (
                          <>
                            <span className="text-border">·</span>
                            <span className="truncate">{stagiairePoste}</span>
                          </>
                        )}
                        {numeroSemaine != null && (
                          <>
                            <span className="text-border">·</span>
                            <span>Semaine {numeroSemaine}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ClipboardList className="size-3.5 text-primary" />
                    <span>6 critères à évaluer</span>
                  </div>
                </DialogHeader>

                {/* Progress */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {evaluatedCount} / 6 critères évalués
                    </span>
                    {allEvaluated && moyenne != null && (
                      <span className="font-semibold text-primary">
                        Moyenne {moyenne.toFixed(1).replace(".", ",")} / 5
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={false}
                      animate={{ width: `${progressPct}%` }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 300, damping: 30 }
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Body scrollable */}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                <div className="space-y-3">
                  {CRITERES.map((critere, index) => (
                    <CritereCard
                      key={critere.key}
                      index={index + 1}
                      critere={critere}
                      value={notes[critere.key]}
                      onChange={(v) => handleNoteChange(critere.key, v)}
                      reduceMotion={reduceMotion}
                    />
                  ))}
                </div>

                {/* Résumé dynamique */}
                <AnimatePresence>
                  {allEvaluated && moyenne != null && (
                    <motion.div
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, y: 8, height: 0 }
                      }
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={
                        reduceMotion
                          ? undefined
                          : { opacity: 0, y: 4, height: 0 }
                      }
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.06] p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Résumé de l&apos;évaluation
                        </p>
                        <div className="mt-2 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-2xl font-semibold tabular-nums text-foreground">
                              {moyenne.toFixed(1).replace(".", ",")}
                              <span className="ml-1 text-base font-normal text-muted-foreground">
                                / 5
                              </span>
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-primary">
                              {appreciation}
                            </p>
                          </div>
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted sm:w-28">
                            <motion.div
                              className="h-full rounded-full bg-primary"
                              initial={false}
                              animate={{
                                width: `${(moyenne / 5) * 100}%`,
                              }}
                              transition={
                                reduceMotion
                                  ? { duration: 0 }
                                  : { duration: 0.25 }
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Commentaire */}
                <div className="mt-5 space-y-2">
                  <label
                    htmlFor="eval-commentaires"
                    className="text-sm font-medium text-foreground"
                  >
                    Observations du superviseur
                  </label>
                  <Textarea
                    id="eval-commentaires"
                    rows={4}
                    maxLength={MAX_COMMENT}
                    value={commentaires}
                    onChange={(e) =>
                      setCommentaires(e.target.value.slice(0, MAX_COMMENT))
                    }
                    placeholder="Partagez les points forts du stagiaire, les difficultés rencontrées et les axes de progression..."
                    className="min-h-[100px] resize-y rounded-xl border-border/80 bg-background px-3.5 py-3 text-sm transition-colors focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                  <div className="flex justify-end text-xs text-muted-foreground tabular-nums">
                    {commentaires.length} / {MAX_COMMENT} caractères
                  </div>
                </div>

                {mutation.isError && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      {mutation.error?.message ||
                        "Une erreur est survenue. Veuillez réessayer."}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-border/60 bg-muted/30 px-5 py-4 sm:px-6">
                <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-lg"
                    onClick={() => handleOpenChange(false)}
                    disabled={mutation.isPending}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    className="h-10 rounded-lg"
                    disabled={!allEvaluated || mutation.isPending}
                    onClick={() => setStep("confirm")}
                  >
                    Envoyer l&apos;évaluation
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function CritereCard({ index, critere, value, onChange, reduceMotion }) {
  return (
    <motion.div
      layout={!reduceMotion}
      className={cn(
        "rounded-xl border bg-card p-3.5 transition-colors sm:p-4",
        value != null
          ? "border-primary/25 bg-primary/[0.03]"
          : "border-border/70",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
              {index}
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              {critere.label}
            </h3>
          </div>
          <p className="mt-1 pl-8 text-xs leading-relaxed text-muted-foreground">
            {critere.description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span
            className={cn(
              "text-sm font-semibold tabular-nums transition-colors",
              value != null ? "text-primary" : "text-muted-foreground/50",
            )}
          >
            {value != null ? `${value}/5` : "—/5"}
          </span>
          {value != null && (
            <p className="mt-0.5 text-[11px] font-medium text-primary">
              {NOTE_LABELS[value]}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 pl-0 sm:pl-8" role="group" aria-label={critere.label}>
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={selected}
              aria-label={`${n} sur 5 — ${NOTE_LABELS[n]}`}
              className={cn(
                "relative flex h-9 flex-1 items-center justify-center rounded-lg text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
                selected
                  ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function ConfirmState({
  stagiaireNom,
  moyenne,
  appreciation,
  isPending,
  onCancel,
  onConfirm,
  reduceMotion,
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col px-5 py-6 sm:px-6"
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ClipboardList className="size-6" />
      </div>
      <h2 className="mt-4 text-center text-lg font-semibold text-foreground">
        Confirmer l&apos;envoi ?
      </h2>
      <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
        Cette évaluation sera enregistrée pour{" "}
        <span className="font-medium text-foreground">{stagiaireNom}</span> et
        pourra être consultée dans son historique de suivi.
      </p>

      {moyenne != null && (
        <div className="mx-auto mt-4 rounded-xl border border-border/60 bg-muted/40 px-5 py-3 text-center">
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {moyenne.toFixed(1).replace(".", ",")}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              / 5
            </span>
          </p>
          <p className="text-sm font-medium text-primary">{appreciation}</p>
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-lg sm:min-w-[120px]"
          onClick={onCancel}
          disabled={isPending}
        >
          Annuler
        </Button>
        <Button
          type="button"
          className="h-10 rounded-lg sm:min-w-[160px]"
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Confirmer l'envoi"
          )}
        </Button>
      </div>
    </motion.div>
  );
}

function SuccessState({ reduceMotion }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 280, damping: 22 }
      }
      className="flex flex-col items-center px-5 py-12 sm:px-6"
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { delay: 0.08, type: "spring", stiffness: 320, damping: 18 }
        }
        className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary"
      >
        <CheckCircle2 className="size-8" strokeWidth={1.75} />
      </motion.div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">
        Évaluation envoyée
      </h2>
      <p className="mt-1.5 max-w-xs text-center text-sm text-muted-foreground">
        L&apos;évaluation du stagiaire a été enregistrée avec succès.
      </p>
    </motion.div>
  );
}
