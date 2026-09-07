"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  FileText,
  Building2,
  User,
  Calendar,
  Briefcase,
  Download,
  ExternalLink,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  PenLine,
  Loader2,
  Shield,
} from "lucide-react";
import { useMaConvention, useSignerConvention } from "@/lib/queries/useConvention";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AppHeader from "@/components/layout/AppHeader";
import { useTranslation } from "@/lib/i18n/useTranslation";

const LOCALE_MAP = { fr: "fr-FR", en: "en-GB" };

function formatDate(value, locale = "fr") {
  if (!value) return "—";
  try {
    const d = new Date(
      typeof value === "string" && value.length <= 10
        ? value + "T12:00:00Z"
        : value,
    );
    return d.toLocaleDateString(LOCALE_MAP[locale] || "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Douala",
    });
  } catch {
    return String(value);
  }
}

function formatDateTime(value, locale = "fr") {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(LOCALE_MAP[locale] || "fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Douala",
    });
  } catch {
    return String(value);
  }
}

const STATUS_UI = {
  BROUILLON: {
    icon: Clock,
    className: "border-border bg-muted/40 text-muted-foreground",
  },
  EN_ATTENTE_VALIDATION: {
    icon: Clock,
    className: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  },
  EN_ATTENTE_SIGNATURE_STAGIAIRE: {
    icon: PenLine,
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  EN_ATTENTE_SIGNATURE_ENTREPRISE: {
    icon: Building2,
    className: "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-200",
  },
  VALIDEE: {
    icon: CheckCircle2,
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  },
  REFUSEE: {
    icon: XCircle,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  A_CORRIGER: {
    icon: AlertCircle,
    className: "border-amber-500/25 bg-amber-500/10 text-amber-800",
  },
  ANNULEE: {
    icon: XCircle,
    className: "border-border bg-muted text-muted-foreground",
  },
};

const TIMELINE_STEP_IDS = [
  "creation",
  "infos",
  "validation",
  "sig_stagiaire",
  "sig_entreprise",
  "finalisee",
];

function timelineIndex(statut, convention) {
  if (!convention) return -1;
  if (statut === "REFUSEE" || statut === "ANNULEE") return 0;
  if (statut === "VALIDEE") return 5;
  if (convention.accepteeParStagiaire && convention.accepteeParEntreprise) return 4;
  if (convention.accepteeParStagiaire) return 3;
  if (convention.accepteeParEntreprise && statut === "EN_ATTENTE_SIGNATURE_STAGIAIRE")
    return 3;
  if (statut === "EN_ATTENTE_VALIDATION") return 2;
  if (statut === "BROUILLON") return 1;
  return 1;
}

async function openConventionPdf({ download = false, lang = "fr", errorMsg } = {}) {
  const token = useAuthStore.getState().token;
  const disposition = download ? "attachment" : "inline";
  const langParam = lang === "en" ? "en" : "fr";
  const res = await fetch(
    `/api/conventions/moi/pdf?disposition=${disposition}&lang=${langParam}`,
    {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  if (!res.ok) {
    let msg = errorMsg || "Unable to open the document";
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  if (download) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `convention-stage-${langParam}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function SkeletonBlock() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="h-24 animate-pulse rounded-md bg-muted" />
      <div className="h-40 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-36 animate-pulse rounded-md bg-muted" />
        <div className="h-36 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

export default function ConventionPage() {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { data, isLoading, isError, error, refetch } = useMaConvention();
  const signer = useSignerConvention();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfLang, setPdfLang] = useState(locale === "en" ? "en" : "fr");

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: "easeOut" },
      };

  async function handlePdf(download) {
    setPdfLoading(true);
    try {
      await openConventionPdf({
        download,
        lang: pdfLang,
        errorMsg: t("stagiaireSpace.convention.openDocError"),
      });
    } catch (e) {
      toast.error(e?.message || t("stagiaireSpace.convention.pdfError"));
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleSign() {
    try {
      await signer.mutateAsync();
      toast.success(t("stagiaireSpace.convention.signedSuccess"));
    } catch (e) {
      toast.error(e?.message || t("stagiaireSpace.convention.signError"));
    }
  }

  if (isLoading) {
    return (
      <>
        <AppHeader
          title={t("stagiaireSpace.convention.title")}
          subtitle={t("stagiaireSpace.convention.subtitleShort")}
        />
        <SkeletonBlock />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <AppHeader
          title={t("stagiaireSpace.convention.title")}
          subtitle={t("stagiaireSpace.convention.subtitleShort")}
        />
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {error?.message || t("stagiaireSpace.convention.loadError")}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("stagiaireSpace.convention.retry")}
          </Button>
        </div>
      </>
    );
  }

  if (!data?.convention) {
    return (
      <>
        <AppHeader
          title={t("stagiaireSpace.convention.title")}
          subtitle={t("stagiaireSpace.convention.subtitle")}
        />
        <div className="w-full space-y-6 px-4 py-6 sm:px-6">
          <div className="rounded-md border border-dashed border-border bg-card p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-foreground">
              {t("stagiaireSpace.convention.emptyTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("stagiaireSpace.convention.emptyDesc")}
            </p>
          </div>
        </div>
      </>
    );
  }

  const {
    convention,
    statut,
    stage,
    entreprise,
    superviseur,
    stagiaire,
    historique,
    peutSigner,
  } = data;
  const ui = STATUS_UI[statut] || STATUS_UI.BROUILLON;
  const StatusIcon = ui.icon;
  const stepIdx = timelineIndex(statut, convention);

  const statusLabel =
    t(`stagiaireSpace.convention.status.${statut}.label`) || statut;
  const statusDescription =
    t(`stagiaireSpace.convention.status.${statut}.description`) || "";

  return (
    <>
      <AppHeader
        title={t("stagiaireSpace.convention.title")}
        subtitle={t("stagiaireSpace.convention.subtitle")}
      />
      <div className="w-full space-y-6 px-4 py-6 sm:px-6">
        {/* Status */}
        <motion.section {...fade} className={cn("rounded-md border p-5 sm:p-6", ui.className)}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-current/20 bg-background/60">
                <StatusIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                  {t("stagiaireSpace.convention.statusLabel")}
                </p>
                <h2 className="text-lg font-semibold">{statusLabel}</h2>
                <p className="mt-1 max-w-xl text-sm opacity-90">{statusDescription}</p>
                {stage?.statut === "a_venir" && statut === "VALIDEE" && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs opacity-90">
                    <Shield className="h-3.5 w-3.5" />
                    {t("stagiaireSpace.convention.validatedUntil", {
                      date: formatDate(stage.dateDebut, locale),
                    })}
                  </p>
                )}
              </div>
            </div>
            {peutSigner && (
              <Button
                className="w-full shrink-0 gap-2 sm:w-auto"
                onClick={handleSign}
                disabled={signer.isPending}
              >
                {signer.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PenLine className="h-4 w-4" />
                )}
                {t("stagiaireSpace.convention.signCta")}
              </Button>
            )}
          </div>
        </motion.section>

        {/* Timeline */}
        <motion.section
          {...fade}
          className="rounded-md border border-border bg-card p-5 sm:p-6"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {t("stagiaireSpace.convention.progress")}
          </h3>
          <ol className="relative space-y-0 md:flex md:items-start md:justify-between md:gap-1 md:space-y-0">
            {TIMELINE_STEP_IDS.map((id, i) => {
              const done = i < stepIdx;
              const current = i === stepIdx;
              const label = t(`stagiaireSpace.convention.timelineSteps.${id}`);
              return (
                <li
                  key={id}
                  className="relative flex flex-1 items-start gap-3 pb-6 md:flex-col md:items-center md:pb-0 md:text-center"
                >
                  {i < TIMELINE_STEP_IDS.length - 1 && (
                    <span
                      className={cn(
                        "absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px md:left-1/2 md:top-4 md:h-px md:w-full",
                        done || current ? "bg-primary/40" : "bg-border",
                      )}
                      aria-hidden
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      done && "border-primary bg-primary text-primary-foreground",
                      current &&
                        "border-primary bg-primary/15 text-primary ring-2 ring-primary/20",
                      !done &&
                        !current &&
                        "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "pt-1 text-xs font-medium md:pt-2",
                      current ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </motion.section>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Stage */}
          <motion.section
            {...fade}
            className="rounded-md border border-border bg-card p-5"
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Briefcase className="h-4 w-4 text-primary" />
              {t("stagiaireSpace.convention.internshipInfo")}
            </h3>
            <dl className="space-y-2 text-sm">
              <InfoRow
                label={t("stagiaireSpace.convention.jobTitle")}
                value={stage?.intitulePoste}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.company")}
                value={entreprise?.nomEntreprise}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.startDate")}
                value={formatDate(stage?.dateDebut, locale)}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.endDate")}
                value={formatDate(stage?.dateFinPrevue, locale)}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.duration")}
                value={stage?.dureeStage?.replaceAll("_", " ")}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.workMode")}
                value={stage?.modeTravail?.replaceAll("_", " ")}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.location")}
                value={
                  [entreprise?.ville, entreprise?.pays].filter(Boolean).join(", ") ||
                  null
                }
              />
              <InfoRow
                label={t("stagiaireSpace.convention.supervisor")}
                value={superviseur?.nom}
              />
              {stage?.objectifsApprentissage && (
                <div className="pt-2">
                  <dt className="text-xs text-muted-foreground">
                    {t("stagiaireSpace.convention.mission")}
                  </dt>
                  <dd className="mt-0.5 text-foreground">
                    {stage.objectifsApprentissage}
                  </dd>
                </div>
              )}
            </dl>
          </motion.section>

          {/* Intern */}
          <motion.section
            {...fade}
            className="rounded-md border border-border bg-card p-5"
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-primary" />
              {t("stagiaireSpace.convention.studentInfo")}
            </h3>
            <dl className="space-y-2 text-sm">
              <InfoRow
                label={t("stagiaireSpace.convention.name")}
                value={
                  stagiaire ? `${stagiaire.prenom} ${stagiaire.nom}` : null
                }
              />
              <InfoRow
                label={t("stagiaireSpace.convention.email")}
                value={stagiaire?.email}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.phone")}
                value={stagiaire?.telephone}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.education")}
                value={stagiaire?.formation?.diplome}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.institution")}
                value={stagiaire?.formation?.nomUniversite}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.level")}
                value={
                  stagiaire?.formation?.anneeEtude
                    ? t("stagiaireSpace.convention.yearLevel", {
                        n: stagiaire.formation.anneeEtude,
                      })
                    : null
                }
              />
            </dl>
          </motion.section>

          {/* Company */}
          <motion.section
            {...fade}
            className="rounded-md border border-border bg-card p-5"
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-primary" />
              {t("stagiaireSpace.convention.companyInfo")}
            </h3>
            <dl className="space-y-2 text-sm">
              <InfoRow
                label={t("stagiaireSpace.convention.name")}
                value={entreprise?.nomEntreprise}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.address")}
                value={
                  [entreprise?.adresse, entreprise?.ville, entreprise?.pays]
                    .filter(Boolean)
                    .join(", ") || null
                }
              />
              <InfoRow
                label={t("stagiaireSpace.convention.manager")}
                value={superviseur?.nom}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.email")}
                value={superviseur?.email}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.phone")}
                value={superviseur?.telephone}
              />
            </dl>
          </motion.section>

          {/* Document */}
          <motion.section
            {...fade}
            className="rounded-md border border-border bg-card p-5"
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              {t("stagiaireSpace.convention.document")}
            </h3>
            <dl className="mb-4 space-y-2 text-sm">
              <InfoRow
                label={t("stagiaireSpace.convention.reference")}
                value={
                  convention.numero
                    ? t("stagiaireSpace.convention.refNumber", {
                        n: convention.numero,
                      })
                    : convention.idConvention.slice(0, 8)
                }
              />
              <InfoRow
                label={t("stagiaireSpace.convention.version")}
                value={`V${convention.version || 1}`}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.createdAt")}
                value={formatDateTime(convention.dateCreation, locale)}
              />
              <InfoRow
                label={t("stagiaireSpace.convention.studentSignature")}
                value={
                  convention.dateAcceptationStagiaire
                    ? formatDateTime(convention.dateAcceptationStagiaire, locale)
                    : t("stagiaireSpace.convention.pending")
                }
              />
            </dl>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setPdfLang("fr")}
                  className={`rounded px-2 py-1 text-xs font-medium transition ${
                    pdfLang === "fr"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  FR
                </button>
                <button
                  type="button"
                  onClick={() => setPdfLang("en")}
                  className={`rounded px-2 py-1 text-xs font-medium transition ${
                    pdfLang === "en"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  EN
                </button>
              </div>
              <Button
                size="sm"
                variant="default"
                className="gap-1.5"
                disabled={pdfLoading}
                onClick={() => handlePdf(false)}
              >
                {pdfLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
                {t("stagiaireSpace.convention.viewDocument")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={pdfLoading}
                onClick={() => handlePdf(true)}
              >
                <Download className="h-3.5 w-3.5" />
                {t("stagiaireSpace.convention.downloadPdf")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5"
                disabled={pdfLoading}
                onClick={async () => {
                  try {
                    await openConventionPdf({
                      download: false,
                      lang: pdfLang,
                      errorMsg: t("stagiaireSpace.convention.openDocError"),
                    });
                  } catch (e) {
                    toast.error(e?.message);
                  }
                }}
              >
                <Printer className="h-3.5 w-3.5" />
                {t("stagiaireSpace.convention.print")}
              </Button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {t("stagiaireSpace.convention.legalNote")}
            </p>
          </motion.section>
        </div>

        {/* Signature block */}
        {peutSigner && (
          <motion.section
            {...fade}
            className="rounded-md border border-primary/25 bg-primary/5 p-5 sm:p-6"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <PenLine className="h-4 w-4 text-primary" />
              {t("stagiaireSpace.convention.signTitle")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("stagiaireSpace.convention.signDesc")}
            </p>
            <Button
              className="mt-4 w-full gap-2 sm:w-auto"
              onClick={handleSign}
              disabled={signer.isPending}
            >
              {signer.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PenLine className="h-4 w-4" />
              )}
              {t("stagiaireSpace.convention.signCta")}
            </Button>
          </motion.section>
        )}

        {convention.accepteeParStagiaire && (
          <motion.section
            {...fade}
            className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm"
          >
            <p className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              {t("stagiaireSpace.convention.signed")}
            </p>
            <p className="mt-1 text-muted-foreground">
              {t("stagiaireSpace.convention.signedOn", {
                date: formatDateTime(
                  convention.dateAcceptationStagiaire,
                  locale,
                ),
                version: convention.version || 1,
              })}
            </p>
          </motion.section>
        )}

        {/* History */}
        <motion.section
          {...fade}
          className="rounded-md border border-border bg-card p-5 sm:p-6"
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Calendar className="h-4 w-4 text-primary" />
            {t("stagiaireSpace.convention.history")}
          </h3>
          {historique?.length ? (
            <ul className="space-y-3">
              {historique.map((ev, i) => {
                const histKey = ev.type
                  ? `stagiaireSpace.convention.historyEvents.${ev.type}`
                  : null;
                const translated = histKey ? t(histKey) : null;
                const eventLabel =
                  translated && translated !== histKey
                    ? translated
                    : ev.label || histKey || "—";
                return (
                  <li key={`${ev.type}-${i}`} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                    <div>
                      <p className="font-medium text-foreground">{eventLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(ev.date, locale)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("stagiaireSpace.convention.noHistory")}
            </p>
          )}
        </motion.section>
      </div>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-28 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium text-foreground capitalize">
        {value || "—"}
      </dd>
    </div>
  );
}
