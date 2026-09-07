"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Building2,
  MapPin,
  Clock,
  Briefcase,
  MessageSquare,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  STATUT_META,
  canRespond,
  formatDate,
  locationLabel,
} from "./propositionUtils";
import { cn } from "@/lib/utils";

function MetaCell({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
      <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default function PropositionDetailDrawer({
  prop,
  open,
  onClose,
  onAccept,
  onRefuse,
  isUpdating,
}) {
  const { t, locale } = useTranslation();
  const reduce = useReducedMotion();
  const closeRef = useRef(null);
  const meta = prop ? STATUT_META[prop.statut] || STATUT_META.annulee : null;
  const loc = prop ? locationLabel(prop) : null;
  const respondable = prop ? canRespond(prop.statut) : false;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // focus close button
    const focusTimer = setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && prop && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prop-drawer-title"
            initial={reduce ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduce ? undefined : { x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 36,
              duration: reduce ? 0 : undefined,
            }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-card shadow-xl sm:max-w-xl"
          >
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-border px-5 py-4">
              {prop.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={prop.logoUrl}
                  alt=""
                  className="h-12 w-12 rounded-xl border border-border object-cover bg-muted"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-muted-foreground">
                  {prop.nomEntreprise}
                </p>
                <h2
                  id="prop-drawer-title"
                  className="text-lg font-semibold leading-snug text-foreground"
                >
                  {prop.titreOffre || t("stagiaireSpace.propositions.proposalFallback")}
                </h2>
                {meta && (
                  <span
                    className={cn(
                      "mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                      meta.className,
                    )}
                  >
                    {t(meta.labelKey)}
                  </span>
                )}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={t("stagiaireSpace.common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <MetaCell icon={MapPin} label={t("stagiaireSpace.propositions.location")} value={loc} />
                <MetaCell
                  icon={Clock}
                  label={t("stagiaireSpace.propositions.duration")}
                  value={prop.dureeStage}
                />
                <MetaCell
                  icon={Briefcase}
                  label={t("stagiaireSpace.propositions.workMode")}
                  value={prop.modeTravail}
                />
              </div>

              {prop.departement && (
                <p className="text-sm text-muted-foreground">
                  {t("stagiaireSpace.propositions.department")} :{" "}
                  <span className="font-medium text-foreground">
                    {prop.departement}
                  </span>
                </p>
              )}

              {prop.message && (
                <section className="rounded-xl border border-border bg-muted/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    {t("stagiaireSpace.propositions.companyMessage")}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {prop.message}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    — {prop.nomEntreprise}
                  </p>
                </section>
              )}

              {prop.descriptionOffre && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    {t("stagiaireSpace.propositions.aboutProposal")}
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {prop.descriptionOffre}
                  </p>
                </section>
              )}

              {prop.aProposEntreprise && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    {t("stagiaireSpace.propositions.aboutCompany")}
                  </h3>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="font-medium text-foreground">
                      {prop.nomEntreprise}
                    </p>
                    {prop.secteurActivite && (
                      <p className="text-xs text-muted-foreground">
                        {prop.secteurActivite}
                        {loc ? ` · ${loc}` : ""}
                      </p>
                    )}
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {prop.aProposEntreprise}
                    </p>
                  </div>
                </section>
              )}

              <p className="text-xs text-muted-foreground">
                {t("stagiaireSpace.propositions.receivedOnDate", {
                  date: formatDate(prop.dateCreation, locale) || "—",
                })}
                {prop.dateReponse
                  ? ` · ${t("stagiaireSpace.propositions.respondedOnDate", {
                      date: formatDate(prop.dateReponse, locale),
                    })}`
                  : ""}
              </p>

              {prop.commentaireReponse && prop.statut === "refusee" && (
                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {t("stagiaireSpace.propositions.yourComment", { comment: prop.commentaireReponse })}
                </p>
              )}
            </div>

            {/* Sticky actions */}
            {respondable && (
              <div className="border-t border-border bg-card px-5 py-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  {t("stagiaireSpace.propositions.interestedPrompt")}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                  <Button
                    type="button"
                    className="gap-1.5 sm:flex-1"
                    disabled={isUpdating}
                    onClick={() => onAccept(prop)}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {t("stagiaireSpace.propositions.acceptProposal")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5 sm:flex-1"
                    disabled={isUpdating}
                    onClick={() => onRefuse(prop)}
                  >
                    <XCircle className="h-4 w-4" />
                    {t("stagiaireSpace.propositions.refuse")}
                  </Button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
