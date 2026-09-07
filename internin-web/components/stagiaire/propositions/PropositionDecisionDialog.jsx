"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  MapPin,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { locationLabel } from "./propositionUtils";

const REFUS_REASON_KEYS = [
  "stagiaireSpace.propositions.refuseReasons.period",
  "stagiaireSpace.propositions.refuseReasons.role",
  "stagiaireSpace.propositions.refuseReasons.location",
  "stagiaireSpace.propositions.refuseReasons.otherOpp",
  "stagiaireSpace.propositions.refuseReasons.other",
];

function PropositionSummary({ prop }) {
  if (!prop) return null;
  const loc = locationLabel(prop);
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3.5">
      <div className="flex items-center gap-3">
        {prop.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prop.logoUrl}
            alt=""
            className="h-11 w-11 rounded-xl border border-border object-cover bg-background"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
            <Building2 className="h-5 w-5" aria-hidden />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {prop.nomEntreprise || "Entreprise"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {prop.titreOffre || "Proposition de stage"}
          </p>
        </div>
      </div>
      {(loc || prop.dureeStage) && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {loc && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {loc}
            </span>
          )}
          {prop.dureeStage && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {prop.dureeStage}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SuccessParticles({ reduce }) {
  if (reduce) return null;
  const dots = [
    { x: -18, y: -12, d: 0 },
    { x: 16, y: -14, d: 0.05 },
    { x: -14, y: 14, d: 0.08 },
    { x: 18, y: 12, d: 0.1 },
    { x: 0, y: -20, d: 0.03 },
    { x: 22, y: 0, d: 0.12 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {dots.map((p, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-primary/50"
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.2], x: p.x, y: p.y }}
          transition={{ duration: 0.65, delay: p.d, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/**
 * Dialog multi-étapes pour accepter / refuser une proposition.
 * Acceptation : confirm → loading → success | error
 * Refus : confirm (motifs) → loading → ferme (toast géré par le parent/mutation)
 */
export default function PropositionDecisionDialog({
  open,
  mode, // "accept" | "refuse"
  prop,
  pending,
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [comment, setComment] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  // confirm | loading | success | error
  const [phase, setPhase] = useState("confirm");
  const [errorMsg, setErrorMsg] = useState(null);

  // Réinitialiser à l'ouverture / changement de proposition sans useEffect
  // (évite : setState synchronously within an effect → cascading renders).
  // Pattern React : ajuster le state pendant le rendu quand les props changent.
  const resetKey = `${open ? "1" : "0"}:${mode || ""}:${prop?.idProposition || ""}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    if (open) {
      setPhase("confirm");
      setErrorMsg(null);
      setComment("");
      setSuggestion(null);
    }
  }

  if (!mode || !prop) return null;

  const isAccept = mode === "accept";
  const busy = phase === "loading" || pending;

  function applySuggestion(key) {
    setSuggestion(key);
    const label = t(key);
    // "Autre" / "Other" : laisser le commentaire vide pour saisie libre
    if (key.endsWith(".other")) {
      setComment("");
    } else {
      setComment(label);
    }
  }

  async function handleConfirm() {
    if (busy) return;
    setPhase("loading");
    setErrorMsg(null);
    try {
      await onConfirm({
        mode,
        commentaireReponse:
          mode === "refuse" ? comment.trim().slice(0, 500) || null : null,
        silentToast: isAccept,
      });
      if (isAccept) {
        setPhase("success");
      } else {
        // refus : fermeture gérée par le parent (setConfirm null)
        resetAndClose();
      }
    } catch (err) {
      setErrorMsg(err?.message || "Une erreur est survenue.");
      setPhase("error");
    }
  }

  function resetAndClose() {
    setPhase("confirm");
    setErrorMsg(null);
    setComment("");
    setSuggestion(null);
    onCancel();
  }

  function handleOpenChange(next) {
    if (!next) {
      if (phase === "loading") return; // bloquer fermeture pendant mutation
      resetAndClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md overflow-hidden rounded-2xl border-border p-0 sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (phase === "loading") e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (phase === "loading") e.preventDefault();
        }}
      >
        <AnimatePresence mode="wait">
          {/* ——— CONFIRM ——— */}
          {phase === "confirm" && (
            <motion.div
              key="confirm"
              initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
              className="space-y-5 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={reduce ? false : { opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reduce ? 0 : 0.35 }}
                  className={cn(
                    "mb-3 flex h-14 w-14 items-center justify-center rounded-full",
                    isAccept
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {isAccept ? (
                    <CheckCircle2 className="h-7 w-7" aria-hidden />
                  ) : (
                    <XCircle className="h-7 w-7" aria-hidden />
                  )}
                </motion.div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  {isAccept
                    ? t("stagiaireSpace.propositions.acceptTitle")
                    : t("stagiaireSpace.propositions.refuseTitle")}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                  {isAccept
                    ? t("stagiaireSpace.propositions.acceptDesc")
                    : t("stagiaireSpace.propositions.refuseDesc", {
                        company: prop.nomEntreprise || t("stagiaireSpace.propositions.companyFallback"),
                      })}
                </DialogDescription>
              </div>

              {isAccept && <PropositionSummary prop={prop} />}

              {isAccept && (
                <p className="text-center text-xs text-muted-foreground">
                  {t("stagiaireSpace.propositions.decisionNote")}
                </p>
              )}

              {!isAccept && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    {t("stagiaireSpace.propositions.refuseWhy")}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {REFUS_REASON_KEYS.map((key) => (
                      <label
                        key={key}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                          suggestion === key
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground hover:bg-muted/50",
                        )}
                      >
                        <input
                          type="radio"
                          name="refus-motif"
                          className="accent-primary"
                          checked={suggestion === key}
                          onChange={() => applySuggestion(key)}
                        />
                        {t(key)}
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {t("stagiaireSpace.propositions.commentOptional")}{" "}
                      <span className="font-normal text-muted-foreground">
                        (facultatif)
                      </span>
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value.slice(0, 500))}
                      placeholder={t("stagiaireSpace.propositions.commentPlaceholder")}
                      rows={3}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={resetAndClose}
                  className="sm:flex-1"
                >
                  {t("stagiaireSpace.propositions.cancel")}
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={handleConfirm}
                  className={cn(
                    "gap-1.5 sm:flex-1",
                    !isAccept &&
                      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                  )}
                >
                  {isAccept ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {t("stagiaireSpace.propositions.acceptConfirm")}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      {t("stagiaireSpace.propositions.refuseConfirm")}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ——— LOADING ——— */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={reduce ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              className="flex flex-col items-center px-6 py-12 text-center"
            >
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
              <DialogTitle className="text-base font-semibold text-foreground">
                {isAccept ? t("stagiaireSpace.propositions.acceptLoading") : t("stagiaireSpace.common.loading")}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                {t("stagiaireSpace.propositions.pleaseWait")}
              </DialogDescription>
            </motion.div>
          )}

          {/* ——— SUCCESS (accept only) ——— */}
          {phase === "success" && isAccept && (
            <motion.div
              key="success"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.3 }}
              className="space-y-5 p-6"
            >
              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <SuccessParticles reduce={reduce} />
                  <motion.div
                    initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: reduce ? 0 : 0.4, ease: "easeOut" }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
                  >
                    <motion.div
                      initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: reduce ? 0 : 0.15, duration: 0.3 }}
                    >
                      <CheckCircle2 className="h-8 w-8" aria-hidden />
                    </motion.div>
                  </motion.div>
                </div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  {t("stagiaireSpace.propositions.acceptSuccessTitle")}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                  {t("stagiaireSpace.propositions.acceptSuccessMsg")}
                </DialogDescription>
              </div>

              <PropositionSummary prop={prop} />

              <Button
                type="button"
                className="w-full"
                onClick={resetAndClose}
              >
                {t("stagiaireSpace.propositions.continue")}
              </Button>
            </motion.div>
          )}

          {/* ——— ERROR ——— */}
          {phase === "error" && (
            <motion.div
              key="error"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
              className="space-y-5 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-7 w-7" aria-hidden />
                </div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  {isAccept
                    ? t("stagiaireSpace.propositions.acceptError")
                    : t("stagiaireSpace.propositions.refuseError")}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                  {errorMsg ||
                    t("stagiaireSpace.propositions.saveError")}
                </DialogDescription>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="sm:flex-1"
                  onClick={resetAndClose}
                >
                  {t("stagiaireSpace.propositions.cancel")}
                </Button>
                <Button
                  type="button"
                  className="sm:flex-1"
                  onClick={handleConfirm}
                >
                  {t("stagiaireSpace.propositions.retry")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
