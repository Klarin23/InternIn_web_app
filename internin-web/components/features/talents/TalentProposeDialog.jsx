"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Briefcase,
  MapPin,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInitials, localization } from "./talentUtils";

export default function TalentProposeDialog({
  open,
  onOpenChange,
  talent,
  offresActives = [],
  onSubmit,
  sending,
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [selectedOffre, setSelectedOffre] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const offre = useMemo(
    () => offresActives.find((o) => o.idOffre === selectedOffre) || null,
    [offresActives, selectedOffre],
  );

  const loc = localization(talent);
  const fullName = talent
    ? `${talent.prenom || ""} ${talent.nom || ""}`.trim()
    : "";

  async function handleSend() {
    if (!selectedOffre || sending || success) return;
    setErrorMsg(null);
    try {
      await onSubmit({ idOffre: selectedOffre, message });
      setSuccess(true);
    } catch (err) {
      setErrorMsg(
        err?.message ||
          t("talents.propose.genericError"),
      );
    }
  }

  function handleOpenChange(next) {
    if (sending) return;
    // Reset dans le handler d'événement (pas dans un effect) pour
    // respecter react-hooks/set-state-in-effect.
    if (!next) {
      setSelectedOffre("");
      setMessage("");
      setSuccess(false);
      setErrorMsg(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(92vh,820px)] w-full flex-col gap-0 overflow-hidden p-0",
          "rounded-2xl border border-border/60 bg-card shadow-xl",
          "sm:max-w-[640px]",
        )}
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
              className="flex flex-col items-center px-6 py-14 text-center sm:px-10"
            >
              <motion.div
                initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.05,
                  type: "spring",
                  stiffness: 320,
                  damping: 20,
                }}
                className="flex size-16 items-center justify-center rounded-full bg-primary/12 text-primary"
              >
                <CheckCircle2 className="size-8" strokeWidth={1.75} />
              </motion.div>
              <h2 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                {t("talents.propose.successTitle")}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {fullName
                  ? t("talents.propose.successTo", { name: fullName })
                  : t("talents.propose.successDesc")}
              </p>
              <Button
                type="button"
                className="mt-8 rounded-xl px-6"
                onClick={() => onOpenChange(false)}
              >
                {t("talents.propose.done")}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {/* Header */}
              <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-5 py-4 text-left sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="size-4" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="min-w-0 pr-6">
                    <DialogTitle className="text-base font-semibold tracking-tight sm:text-lg">
                      {t("talents.propose.title")}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-muted-foreground">
                      {t("talents.propose.subtitle")}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Body scrollable */}
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                {/* Talent identity */}
                {talent && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2 }}
                    className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-muted/25 p-3.5"
                  >
                    <div className="size-12 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-background">
                      {talent.photoProfilUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={talent.photoProfilUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground">
                          {getInitials(talent.prenom, talent.nom)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {fullName || "Talent"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {talent.titreProfessionnel || t("talents.propose.student")}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {talent.statutStage === "disponible" && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Disponible
                          </span>
                        )}
                        {loc && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                            <MapPin className="size-3" aria-hidden />
                            {loc}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Empty offres */}
                {offresActives.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-5 py-10 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Briefcase className="size-5" strokeWidth={1.75} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      {t("talents.propose.noOffers")}
                    </p>
                    <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                      {t("talents.propose.needPublishedOffer")}
                    </p>
                    <Button
                      asChild
                      size="sm"
                      className="mt-5 gap-1.5 rounded-xl"
                    >
                      <Link href="/offres-entreprise">
                        {t("talents.propose.createOffer")}
                        <ExternalLink className="size-3.5" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Select offre */}
                    <div className="space-y-2">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {t("talents.propose.yourOpportunity")}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("talents.propose.selectOfferHint")}
                        </p>
                      </div>
                      <Select
                        value={selectedOffre}
                        onValueChange={(v) => {
                          setSelectedOffre(v);
                          setErrorMsg(null);
                        }}
                        disabled={sending}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background shadow-sm">
                          <div className="flex items-center gap-2 truncate">
                            <Briefcase
                              className="size-4 shrink-0 text-muted-foreground"
                              aria-hidden
                            />
                            <SelectValue placeholder={t("talents.propose.chooseOffer")} />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {offresActives.map((o) => (
                            <SelectItem
                              key={o.idOffre}
                              value={o.idOffre}
                              className="rounded-lg"
                            >
                              <span className="font-medium">{o.titre}</span>
                              {(o.modeTravail || o.dureeStage) && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  ·{" "}
                                  {[o.modeTravail, o.dureeStage]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Offer preview */}
                    <AnimatePresence mode="wait">
                      {offre && (
                        <motion.div
                          key={offre.idOffre}
                          initial={
                            reduceMotion ? false : { opacity: 0, y: 6 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduceMotion ? undefined : { opacity: 0 }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.2,
                          }}
                          className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {offre.titre}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {offre.modeTravail && (
                              <span>{offre.modeTravail}</span>
                            )}
                            {offre.dureeStage && (
                              <span>{offre.dureeStage}</span>
                            )}
                            {(offre.ville || offre.villeEntreprise) && (
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="size-3" aria-hidden />
                                {offre.ville || offre.villeEntreprise}
                              </span>
                            )}
                            {offre.departement && (
                              <span>{offre.departement}</span>
                            )}
                          </div>
                          <Link
                            href={`/offres-entreprise/${offre.idOffre}`}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            {t("talents.propose.viewDetails")}
                            <ExternalLink className="size-3" aria-hidden />
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Message */}
                    <div className="space-y-2">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {t("talents.propose.customMessage")}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t("talents.propose.customMessageHint")}
                        </p>
                      </div>
                      <Textarea
                        placeholder={
                          fullName
                            ? t("talents.propose.messagePlaceholder", { name: talent?.prenom || fullName })
                            : t("talents.propose.messageHint")
                        }
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value.slice(0, 1000));
                          setErrorMsg(null);
                        }}
                        rows={4}
                        disabled={sending}
                        className="min-h-[100px] resize-y rounded-xl border-border/80 bg-background shadow-sm focus-visible:ring-primary/25"
                      />
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] leading-snug text-muted-foreground">
                          {t("talents.propose.messageQualityHint")}
                        </p>
                        <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {message.length} / 1000
                        </p>
                      </div>
                    </div>

                    {/* Summary */}
                    {selectedOffre && (
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {t("talents.propose.summary")}
                        </p>
                        <dl className="mt-2 space-y-1.5 text-sm">
                          <div className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">{t("talents.propose.talent")}</dt>
                            <dd className="truncate font-medium text-foreground">
                              {fullName || "—"}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">
                              {t("talents.propose.opportunity")}
                            </dt>
                            <dd className="truncate font-medium text-foreground">
                              {offre?.titre || "—"}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">{t("talents.propose.message")}</dt>
                            <dd className="font-medium text-foreground">
                              {message.trim()
                                ? t("talents.propose.custom")
                                : t("talents.propose.none")}
                            </dd>
                          </div>
                        </dl>
                      </motion.div>
                    )}

                    {/* Error */}
                    {errorMsg && (
                      <div
                        role="alert"
                        className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3"
                      >
                        <AlertTriangle
                          className="mt-0.5 size-4 shrink-0 text-destructive"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            Impossible d&apos;envoyer la proposition
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {errorMsg}
                          </p>
                          <button
                            type="button"
                            className="mt-2 text-xs font-semibold text-primary hover:underline"
                            onClick={handleSend}
                            disabled={sending}
                          >
                            {t("talents.propose.retry")}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              {offresActives.length > 0 && (
                <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/60 bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => onOpenChange(false)}
                    disabled={sending}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    className="gap-1.5 rounded-xl"
                    disabled={!selectedOffre || sending}
                    onClick={handleSend}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        {t("talents.propose.sendingLong")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" aria-hidden />
                        {t("talents.propose.sendProposal")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
