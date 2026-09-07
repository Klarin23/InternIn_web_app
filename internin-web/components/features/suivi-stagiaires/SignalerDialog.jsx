"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";

import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiLoader,
  FiCheck,
  FiClock,
  FiMessageSquare,
  FiFileText,
  FiShield,
  FiMoreHorizontal,
  FiX,
  FiArrowLeft,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateLitige } from "@/lib/queries/useLitiges";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

/** Motifs UX → typeLitige (varchar libre côté API). */
const MOTIF_DEFS = [
  { id: "comportement", labelKey: "suivi.signal.rBehavior", hintKey: "suivi.signal.hBehavior", icon: FiAlertTriangle },
  { id: "absences", labelKey: "suivi.signal.rAbsences", hintKey: "suivi.signal.hAbsences", icon: FiClock },
  { id: "travail", labelKey: "suivi.signal.rWork", hintKey: "suivi.signal.hWork", icon: FiFileText },
  { id: "communication", labelKey: "suivi.signal.rComm", hintKey: "suivi.signal.hComm", icon: FiMessageSquare },
  { id: "confidentialite", labelKey: "suivi.signal.rConf", hintKey: "suivi.signal.hConf", icon: FiShield },
  { id: "autre", labelKey: "suivi.signal.rOther", hintKey: "suivi.signal.hOther", icon: FiMoreHorizontal },
];

const MAX_DESC = 2000;
const MIN_DESC = 10;

function codeSignalement(id) {
  if (!id) return null;
  return `SIG-${String(id).replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function Stepper({ step, labels, ariaLabel }) {
  return (
    <div className="mb-5 flex items-center gap-1" aria-label={ariaLabel}>
      {labels.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} className="flex flex-1 items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition",
                  done && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                  active && "bg-primary text-primary-foreground",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <FiCheck className="h-3.5 w-3.5" /> : n}
              </span>
              <span
                className={cn(
                  "hidden text-[10px] font-semibold sm:block",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-0.5 flex-1 rounded-full",
                  step > n ? "bg-emerald-500/40" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Parcours de signalement (entreprise → suivi stagiaire).
 * API : POST /litiges { idStage, typeLitige, description }
 * Pas de priorité ni pièces jointes en schéma.
 */
export default function SignalerDialog({
  idStage,
  stagiaireNom,
  titrePoste,
  prenom,
  nom,
}) {
  const { t } = useTranslation();
  const MOTIFS = useMemo(
    () => MOTIF_DEFS.map((m) => ({ id: m.id, label: t(m.labelKey), hint: t(m.hintKey), icon: m.icon })),
    [t],
  );
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [motifId, setMotifId] = useState(null);
  const [description, setDescription] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [created, setCreated] = useState(null); // litige retourné par API
  const mutation = useCreateLitige();

  const displayName =
    stagiaireNom ||
    [prenom, nom].filter(Boolean).join(" ") ||
    t("suivi.signal.fallbackIntern");
  const initials = useMemo(() => {
    if (prenom || nom) {
      return `${(prenom || "")[0] || ""}${(nom || "")[0] || ""}`.toUpperCase() || "S";
    }
    return displayName
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [prenom, nom, displayName]);

  const motif = MOTIFS.find((m) => m.id === motifId);
  const dirty = !!motifId || description.trim().length > 0;

  function resetAll() {
    setStep(1);
    setMotifId(null);
    setDescription("");
    setFieldError("");
    setCreated(null);
    mutation.reset?.();
  }

  function requestClose() {
    if (created) {
      setOpen(false);
      resetAll();
      return;
    }
    if (dirty) {
      setConfirmClose(true);
      return;
    }
    setOpen(false);
    resetAll();
  }

  function onOpenChange(next) {
    if (!next) {
      requestClose();
      return;
    }
    setOpen(true);
  }

  function goDetails() {
    if (!motifId) {
      setFieldError(t("suivi.signal.selectReason"));
      return;
    }
    setFieldError("");
    setStep(2);
  }

  function goReview() {
    if (description.trim().length < MIN_DESC) {
      setFieldError(
        t("suivi.signal.descMinError", { count: MIN_DESC }),
      );
      return;
    }
    setFieldError("");
    setStep(3);
  }

  function handleSubmit() {
    if (!motif || !idStage) return;
    mutation.mutate(
      {
        idStage,
        typeLitige: motif.label,
        description: description.trim(),
      },
      {
        onSuccess: (data) => {
          setCreated(data);
          setStep(4);
          toast.success(t("suivi.signal.success"));
        },
      },
    );
  }

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2 };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-sm border-border text-foreground hover:bg-muted"
          onClick={() => setOpen(true)}
        >
          <FiAlertTriangle className="h-4 w-4" />
          {t("suivi.signal.title")}
        </Button>

        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border px-5 py-4 text-left">
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FiAlertTriangle className="h-4 w-4" />
              </span>
              {t("suivi.signal.heading")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("suivi.signal.intro")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {step < 4 && (
              <>
                {/* Carte stagiaire */}
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[titrePoste, idStage ? `Stage · ${String(idStage).slice(0, 8)}…` : null]
                        .filter(Boolean)
                        .join(" · ") || "Stage en cours"}
                    </p>
                  </div>
                </div>
                <Stepper
                  step={Math.min(step, 3)}
                  labels={[
                    t("suivi.signal.reason"),
                    t("suivi.signal.details"),
                    t("suivi.signal.verify"),
                  ]}
                  ariaLabel={t("suivi.signal.stepsAria")}
                />
              </>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="s1"
                  initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
                  transition={transition}
                >
                  <p className="mb-3 text-sm font-semibold text-foreground">
                    Pourquoi souhaitez-vous effectuer ce signalement ?
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {MOTIFS.map((m) => {
                      const Icon = m.icon || FiMoreHorizontal;
                      const selected = motifId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMotifId(m.id);
                            setFieldError("");
                          }}
                          className={cn(
                            "flex items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                            selected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:bg-muted/40",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              selected
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-foreground">
                              {m.label}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {m.hint}
                            </span>
                          </span>
                          {selected && (
                            <FiCheck className="ml-auto h-4 w-4 shrink-0 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {fieldError && (
                    <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                      {fieldError}
                    </p>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="s2"
                  initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
                  transition={transition}
                  className="space-y-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("suivi.signal.explain")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("suivi.signal.facts")}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="signal-desc">{t("suivi.signal.description")}</Label>
                    <textarea
                      id="signal-desc"
                      rows={6}
                      maxLength={MAX_DESC}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setFieldError("");
                      }}
                      placeholder={t("suivi.signal.descPlaceholder")}
                      className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        {t("suivi.signal.minChars", { count: MIN_DESC })}
                      </span>
                      <span>
                        {description.length}/{MAX_DESC}
                      </span>
                    </div>
                  </div>
                  <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                    💡 {t("suivi.signal.tipFacts")}
                  </p>
                  {fieldError && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {fieldError}
                    </p>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="s3"
                  initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
                  transition={transition}
                  className="space-y-3"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {t("suivi.signal.reviewTitle")}
                  </p>
                  <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("suivi.signal.intern")}
                      </p>
                      <p className="font-semibold text-foreground">
                        {displayName}
                      </p>
                      {titrePoste && (
                        <p className="text-xs text-muted-foreground">
                          {titrePoste}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("suivi.signal.reason")}
                      </p>
                      <p className="font-semibold text-foreground">
                        {motif?.label}
                      </p>
                      <button
                        type="button"
                        className="text-xs font-medium text-primary hover:underline"
                        onClick={() => setStep(1)}
                      >
                        {t("suivi.signal.edit")}
                      </button>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("suivi.signal.description")}
                      </p>
                      <p className="whitespace-pre-wrap text-foreground">
                        {description}
                      </p>
                      <button
                        type="button"
                        className="text-xs font-medium text-primary hover:underline"
                        onClick={() => setStep(2)}
                      >
                        {t("suivi.signal.edit")}
                      </button>
                    </div>
                  </div>
                  <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
                    {t("suivi.signal.transmitNote")}
                  </p>
                  {mutation.isError && (
                    <div
                      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                      role="alert"
                    >
                      {mutation.error?.message ||
                        t("suivi.signal.error")}
                    </div>
                  )}
                </motion.div>
              )}

              {step === 4 && created && (
                <motion.div
                  key="s4"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.22 }}
                  className="flex flex-col items-center gap-3 py-8 text-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <FiCheck className="h-7 w-7" />
                  </span>
                  <h3 className="text-lg font-bold text-foreground">
                    {t("suivi.signal.sentTitle")}
                  </h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {t("suivi.signal.sentBody")}
                  </p>
                  <p className="rounded-lg border border-border bg-muted/30 px-4 py-2 font-mono text-sm font-semibold text-primary">
                    {codeSignalement(created.idLitige)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t("suivi.signal.keepRef")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3">
            {step === 4 ? (
              <Button
                type="button"
                className="ml-auto"
                onClick={() => {
                  setOpen(false);
                  resetAll();
                }}
              >
                {t("suivi.signal.done")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={requestClose}
                  disabled={mutation.isPending}
                >
                  {t("suivi.signal.cancel")}
                </Button>
                <div className="flex gap-2">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFieldError("");
                        setStep((s) => s - 1);
                      }}
                      disabled={mutation.isPending}
                    >
                      <FiArrowLeft className="h-4 w-4" />
                      {t("suivi.signal.back")}
                    </Button>
                  )}
                  {step === 1 && (
                    <Button type="button" onClick={goDetails}>
                      {t("suivi.signal.continue")}
                    </Button>
                  )}
                  {step === 2 && (
                    <Button type="button" onClick={goReview}>
                      {t("suivi.signal.continue")}
                    </Button>
                  )}
                  {step === 3 && (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? (
                        <FiLoader className="h-4 w-4 animate-spin" />
                      ) : (
                        <FiAlertTriangle className="h-4 w-4" />
                      )}
                      {mutation.isPending
                        ? t("suivi.signal.sending")
                        : t("suivi.signal.send")}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("suivi.signal.leaveTitle")}</DialogTitle>
            <DialogDescription>
              {t("suivi.signal.leaveMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmClose(false)}>
              {t("suivi.signal.leaveStay")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setConfirmClose(false);
                setOpen(false);
                resetAll();
              }}
            >
              {t("suivi.signal.leaveConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}