"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Undo2, X, Loader2 } from "lucide-react";
import { MOTIFS_RETRAIT } from "@/lib/candidatures/statut";
import { useRetirerCandidature } from "@/lib/queries/useMesCandidatures";
import { toast } from "@/lib/store/useToastStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Modal de retrait de candidature.
 * Étapes : choix motif → récap → confirmation API.
 *
 * L'état du formulaire vit dans le contenu monté uniquement quand `open`
 * est true : à la fermeture le composant se démonte, l'état se réinitialise
 * naturellement sans setState synchrone dans un effect
 * (react-hooks/set-state-in-effect).
 */
export default function RetirerCandidatureModal({
  open,
  onClose,
  candidature,
}) {
  const triggerRestoreRef = useRef(null);

  // Mémorise l'élément focusé à l'ouverture, le restaure à la fermeture
  // (DOM externe — pas de setState React).
  useEffect(() => {
    if (open) {
      triggerRestoreRef.current = document.activeElement;
      return;
    }
    if (triggerRestoreRef.current) {
      try {
        triggerRestoreRef.current.focus?.();
      } catch {
        /* ignore */
      }
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && candidature ? (
        <RetirerCandidatureModalContent
          key={candidature.idCandidature}
          candidature={candidature}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
}

function RetirerCandidatureModalContent({ candidature, onClose }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const titleId = useId();
  const firstFocusRef = useRef(null);

  // État local : réinitialisé à chaque montage (ouverture de la modal).
  const [motifCode, setMotifCode] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [step, setStep] = useState("motif"); // motif | confirm

  const mutation = useRetirerCandidature();

  useEffect(() => {
    const timer = setTimeout(() => firstFocusRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !mutation.isPending) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, mutation.isPending]);

  const motif = MOTIFS_RETRAIT.find((m) => m.code === motifCode);
  const otherNeedsText = motifCode === "OTHER";
  const canContinue =
    !!motifCode && (!otherNeedsText || commentaire.trim().length > 0);
  const canSubmit = canContinue && !mutation.isPending;

  async function handleConfirm() {
    if (!canSubmit) return;
    try {
      await mutation.mutateAsync({
        idCandidature: candidature.idCandidature,
        motifCode,
        commentaire: commentaire.trim() || undefined,
      });
      toast.success(t("candidatures.withdraw.success"));
      onClose();
    } catch (e) {
      toast.error(e?.message || t("candidatures.withdraw.error"));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => !mutation.isPending && onClose()}
        aria-hidden
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-border bg-card shadow-xl sm:rounded-xl"
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Undo2 className="h-4 w-4 text-foreground" aria-hidden />
            </div>
            <div>
              <h2 id={titleId} className="text-base font-semibold">
                {t("candidatures.withdraw.title")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("candidatures.withdraw.intro")}
              </p>
            </div>
          </div>
          <button
            type="button"
            ref={firstFocusRef}
            onClick={() => !mutation.isPending && onClose()}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("candidatures.withdraw.cancel")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="mb-4 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm">
            <p className="font-medium text-foreground">{candidature.titre}</p>
            <p className="text-xs text-muted-foreground">
              {candidature.nomEntreprise}
            </p>
          </div>

          {step === "motif" && (
            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-medium">
                  {t("candidatures.withdraw.chooseReason")}{" "}
                  <span className="text-destructive">*</span>
                </legend>
                <div className="space-y-1.5">
                  {MOTIFS_RETRAIT.map((m) => (
                    <label
                      key={m.code}
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm transition",
                        motifCode === m.code
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <input
                        type="radio"
                        name="motif-retrait"
                        value={m.code}
                        checked={motifCode === m.code}
                        onChange={() => setMotifCode(m.code)}
                        className="mt-1"
                      />
                      <span>{t(m.labelKey)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="commentaire-retrait"
                  className="mb-1.5 block text-sm font-medium"
                >
                  {otherNeedsText
                    ? t("candidatures.withdraw.specifyReason")
                    : t("candidatures.withdraw.extraComment")}
                  {otherNeedsText ? (
                    <span className="text-destructive"> *</span>
                  ) : (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      {t("candidatures.withdraw.optional")}
                    </span>
                  )}
                </label>
                <textarea
                  id="commentaire-retrait"
                  value={commentaire}
                  onChange={(e) =>
                    setCommentaire(e.target.value.slice(0, 500))
                  }
                  rows={3}
                  maxLength={500}
                  placeholder={t("candidatures.withdraw.commentPlaceholder")}
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {commentaire.length} / 500
                </p>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {t("candidatures.withdraw.confirmIntro")}
              </p>
              <dl className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("candidatures.withdraw.company")}
                  </dt>
                  <dd className="font-medium">{candidature.nomEntreprise}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("candidatures.withdraw.offer")}
                  </dt>
                  <dd className="font-medium">{candidature.titre}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("candidatures.withdraw.reason")}
                  </dt>
                  <dd className="font-medium">
                    {motif ? t(motif.labelKey) : null}
                    {commentaire.trim() ? ` — ${commentaire.trim()}` : ""}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          {step === "motif" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
                className="w-full sm:w-auto"
              >
                {t("candidatures.withdraw.cancel")}
              </Button>
              <Button
                type="button"
                onClick={() => setStep("confirm")}
                disabled={!canContinue}
                className="w-full sm:w-auto"
              >
                {t("candidatures.withdraw.continue")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("motif")}
                disabled={mutation.isPending}
                className="w-full sm:w-auto"
              >
                {t("candidatures.withdraw.back")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
                className="w-full sm:w-auto"
              >
                {t("candidatures.withdraw.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!canSubmit}
                className="w-full bg-slate-800 text-white hover:bg-slate-900 sm:w-auto"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    {t("candidatures.withdraw.pending")}
                  </>
                ) : (
                  t("candidatures.withdraw.confirm")
                )}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
