"use client";

import React, { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Award,
  Building2,
  Calendar,
  Download,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  ShieldCheck,
  User,
  X,
  ZoomIn,
  ZoomOut,
  Hash,
} from "lucide-react";
import SiteLogo from "@/components/layout/SiteLogo";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

function formatDate(d, locale) {
  if (!d) return "—";
  try {
    const tag =
      locale === "en" || String(locale).startsWith("en") ? "en-GB" : "fr-FR";
    return new Date(d).toLocaleDateString(tag, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * InternIn Certificate Viewer — aperçu immersif du PDF officiel.
 * Affiche uniquement le blob PDF réel (pas de faux HTML).
 */
export default function CertificateViewer({
  open,
  certificate,
  previewUrl,
  loading,
  error,
  onClose,
  onRetry,
  onDownload,
  downloadPending = false,
}) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  // reset zoom when opening a new cert
  useEffect(() => {
    if (open) {
      setZoom(1);
      setFullscreen(false);
    }
  }, [open, certificate?.idStage]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(1.75, Math.round((z + 0.15) * 100) / 100)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100)),
    [],
  );
  const zoomFit = useCallback(() => setZoom(1), []);

  const holder =
    certificate?.stagiaire ||
    [certificate?.prenom, certificate?.nom].filter(Boolean).join(" ") ||
    "—";
  const company = certificate?.nomEntreprise || "—";
  const code = certificate?.codeVerification || "—";
  const issued = formatDate(certificate?.dateEmission, locale);
  const periodStart = formatDate(certificate?.dateDebut, locale);
  const periodEnd = formatDate(
    certificate?.dateFinReelle || certificate?.dateFinPrevue,
    locale,
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="certificate-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={t("stagiaireSpace.certificates.viewerTitle")}
          className="fixed inset-0 z-[80] flex flex-col"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.28 }}
        >
          {/* Immersive background */}
          <div className="absolute inset-0 bg-[#F4F7FB] dark:bg-[#080D18]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-40"
            aria-hidden
          >
            <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-500/15" />
            <div className="absolute -right-16 top-1/4 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-600/20" />
            <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10" />
          </div>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
            aria-hidden
          />

          {/* Top bar */}
          <motion.header
            className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-border/50 bg-background/70 px-3 py-3 backdrop-blur-md sm:px-5"
            initial={reduceMotion ? false : { y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.35, delay: 0.05 }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <SiteLogo className="hidden h-5 w-auto sm:block" href="/" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                  {t("stagiaireSpace.certificates.viewerTitle")}
                </p>
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                  {t("stagiaireSpace.certificates.viewerSubtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 sm:inline-flex">
                <ShieldCheck className="size-3.5" />
                {t("stagiaireSpace.certificates.statusVerified")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={onClose}
                aria-label={t("stagiaireSpace.certificates.closePreview")}
              >
                <X className="size-5" />
              </Button>
            </div>
          </motion.header>

          {/* Body */}
          <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* Certificate stage */}
            <div className="relative flex min-h-0 flex-1 flex-col">
              {/* Toolbar */}
              <div className="flex shrink-0 items-center justify-center gap-1 px-3 py-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={zoomOut}
                  aria-label={t("stagiaireSpace.certificates.zoomOut")}
                >
                  <ZoomOut className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg px-2 text-xs tabular-nums"
                  onClick={zoomFit}
                >
                  {Math.round(zoom * 100)}%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={zoomIn}
                  aria-label={t("stagiaireSpace.certificates.zoomIn")}
                >
                  <ZoomIn className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setFullscreen((f) => !f)}
                  aria-label={t("stagiaireSpace.certificates.toggleFullscreen")}
                >
                  {fullscreen ? (
                    <Minimize2 className="size-4" />
                  ) : (
                    <Maximize2 className="size-4" />
                  )}
                </Button>
              </div>

              <div
                className={cn(
                  "flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 sm:p-6",
                  fullscreen && "p-2",
                )}
              >
                {loading && (
                  <motion.div
                    className="flex flex-col items-center gap-3 text-center"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="relative flex size-16 items-center justify-center">
                      <div className="absolute inset-0 animate-pulse rounded-full bg-teal-500/15" />
                      <Loader2 className="size-7 animate-spin text-teal-600 dark:text-teal-400" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {t("stagiaireSpace.certificates.previewLoading")}
                    </p>
                  </motion.div>
                )}

                {!loading && error && (
                  <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                    <FileText className="size-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">{error}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={onRetry}
                      >
                        {t("stagiaireSpace.certificates.retryPreview")}
                      </Button>
                    </div>
                  </div>
                )}

                {!loading && !error && previewUrl && (
                  <motion.div
                    className="relative origin-center"
                    style={{
                      transform: `scale(${zoom})`,
                      transition: reduceMotion
                        ? undefined
                        : "transform 0.25s ease",
                    }}
                    initial={
                      reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }
                    }
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.55,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {/* Soft glow under document */}
                    <div
                      className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-b from-teal-400/10 via-violet-400/10 to-transparent blur-2xl dark:from-teal-500/10 dark:via-violet-500/10"
                      aria-hidden
                    />
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_25px_80px_-20px_rgba(15,23,42,0.35)] dark:shadow-[0_25px_80px_-20px_rgba(0,0,0,0.65)]",
                        fullscreen
                          ? "h-[min(88vh,900px)] w-[min(96vw,1100px)]"
                          : "h-[min(62vh,520px)] w-[min(92vw,820px)] sm:h-[min(68vh,560px)]",
                      )}
                    >
                      {/* verified ribbon */}
                      <div className="pointer-events-none absolute right-3 top-3 z-10">
                        <motion.span
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg"
                          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: reduceMotion ? 0 : 0.45 }}
                        >
                          <ShieldCheck className="size-3" />
                          {t("stagiaireSpace.certificates.verified")}
                        </motion.span>
                      </div>
                      {/* subtle scan line once */}
                      {!reduceMotion && (
                        <motion.div
                          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent"
                          initial={{ y: 0, opacity: 0 }}
                          animate={{ y: 520, opacity: [0, 0.8, 0] }}
                          transition={{ duration: 1.1, delay: 0.35, ease: "easeInOut" }}
                          aria-hidden
                        />
                      )}
                      <iframe
                        src={previewUrl}
                        title={t("stagiaireSpace.certificates.previewTitle")}
                        className="h-full w-full border-0 bg-white"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Info panel */}
            {!fullscreen && (
              <motion.aside
                className="relative z-10 flex w-full shrink-0 flex-col border-t border-border/50 bg-background/75 backdrop-blur-md lg:w-80 lg:border-l lg:border-t-0 xl:w-96"
                initial={reduceMotion ? false : { x: 24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: 0.12 }}
              >
                <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Award className="size-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t("stagiaireSpace.certificates.infoPanelTitle")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("stagiaireSpace.certificates.officialDocument")}
                      </p>
                    </div>
                  </div>

                  <InfoRow
                    icon={User}
                    label={t("stagiaireSpace.certificates.holder")}
                    value={holder}
                  />
                  <InfoRow
                    icon={Building2}
                    label={t("stagiaireSpace.certificates.company")}
                    value={company}
                  />
                  {(certificate?.dateDebut ||
                    certificate?.dateFinReelle ||
                    certificate?.dateFinPrevue) && (
                    <InfoRow
                      icon={Calendar}
                      label={t("stagiaireSpace.certificates.period")}
                      value={`${periodStart} — ${periodEnd}`}
                    />
                  )}
                  <InfoRow
                    icon={Calendar}
                    label={t("stagiaireSpace.certificates.issuedOn")}
                    value={issued}
                  />
                  <InfoRow
                    icon={Hash}
                    label={t("stagiaireSpace.certificates.verificationNumber")}
                    value={code}
                    mono
                  />
                  <InfoRow
                    icon={ShieldCheck}
                    label={t("stagiaireSpace.certificates.status")}
                    value={
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="size-3.5" />
                        {t("stagiaireSpace.certificates.statusVerified")}
                      </span>
                    }
                  />
                </div>

                <div className="space-y-2 border-t border-border/50 p-4 sm:p-5">
                  <Button
                    type="button"
                    className="w-full rounded-xl gap-1.5"
                    disabled={!certificate || downloadPending || loading}
                    onClick={() => onDownload?.(certificate, "fr")}
                  >
                    {downloadPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    {downloadPending
                      ? t("stagiaireSpace.certificates.preparing")
                      : t("stagiaireSpace.certificates.downloadFr")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full rounded-xl gap-1.5"
                    disabled={!certificate || downloadPending || loading}
                    onClick={() => onDownload?.(certificate, "en")}
                  >
                    {downloadPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    {downloadPending
                      ? t("stagiaireSpace.certificates.preparing")
                      : t("stagiaireSpace.certificates.downloadEn")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={onClose}
                  >
                    {t("stagiaireSpace.certificates.closePreview")}
                  </Button>
                </div>
              </motion.aside>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            "mt-0.5 text-sm font-semibold text-foreground break-words",
            mono && "font-mono text-xs tracking-wide",
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

