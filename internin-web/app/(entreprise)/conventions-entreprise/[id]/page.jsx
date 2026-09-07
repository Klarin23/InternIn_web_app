"use client";

import { use, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Building2,
  User,
  Calendar,
  Briefcase,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  PenLine,
  Loader2,
  Shield,
} from "lucide-react";
import {
  useConventionEntreprise,
  useSignerConventionEntreprise,
} from "@/lib/queries/useConventionsEntreprise";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";

const STATUS_UI = {
  BROUILLON: {
    icon: Clock,
    className: "border-border bg-muted/40 text-muted-foreground",
  },
  EN_ATTENTE_VALIDATION: {
    icon: Clock,
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  },
  EN_ATTENTE_SIGNATURE_STAGIAIRE: {
    icon: PenLine,
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  EN_ATTENTE_SIGNATURE_ENTREPRISE: {
    icon: PenLine,
    className:
      "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-200",
  },
  VALIDEE: {
    icon: CheckCircle2,
    className:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  },
  REFUSEE: {
    icon: XCircle,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  A_CORRIGER: {
    icon: AlertTriangle,
    className: "border-amber-500/25 bg-amber-500/10 text-amber-800",
  },
  ANNULEE: {
    icon: XCircle,
    className: "border-border bg-muted text-muted-foreground",
  },
};

function formatDate(value, locale = "fr") {
  if (!value) return "—";
  try {
    const d = new Date(
      typeof value === "string" && value.length <= 10
        ? value + "T12:00:00Z"
        : value,
    );
    const tag = String(locale).toLowerCase().startsWith("en") ? "en-GB" : "fr-FR";
    return d.toLocaleDateString(tag, {
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
    const tag = String(locale).toLowerCase().startsWith("en") ? "en-GB" : "fr-FR";
    return new Date(value).toLocaleString(tag, {
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

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-32 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

async function downloadPdf(token, id, disposition = "attachment", lang = "fr") {
  const langParam = lang === "en" ? "en" : "fr";
  const res = await fetch(
    `/api/conventions/entreprise/${id}/pdf?disposition=${disposition}&lang=${langParam}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    },
  );
  if (!res.ok) throw new Error("DOWNLOAD_FAILED");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  if (disposition === "inline") {
    window.open(url, "_blank");
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = `convention-stage-${langParam}.pdf`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export default function ConventionEntrepriseDetailPage({ params }) {
  const { t, locale } = useTranslation();
  const resolved = typeof params?.then === "function" ? use(params) : params;
  const id = resolved?.id;
  const token = useAuthStore((s) => s.token);
  const reduce = useReducedMotion();
  const [confirmSign, setConfirmSign] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfLang, setPdfLang] = useState("fr");

  const { data, isLoading, isError, error } = useConventionEntreprise(id);
  const signerMutation = useSignerConventionEntreprise();

  const fade = reduce
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  if (isLoading) {
    return (
      <>
        <AppHeader title={t("entrepriseSpace.conventions.detail.title")} subtitle={t("entrepriseSpace.conventions.detail.loading")} />
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement…
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <AppHeader title={t("entrepriseSpace.conventions.detail.title")} subtitle={t("entrepriseSpace.conventions.detail.error")} />
        <div className="w-full space-y-4 px-4 py-5 sm:px-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/conventions-entreprise">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {t("entrepriseSpace.conventions.common.back")}
          </Link>
        </Button>
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error?.message || t("entrepriseSpace.conventions.errors.notFound")}
        </div>
      </div>
      </>
    );
  }

  const {
    convention,
    statut,
    statutMeta,
    stage,
    entreprise,
    superviseur,
    stagiaire,
    historique,
    progression,
    peutSigner,
  } = data;

  const ui = STATUS_UI[statut] || STATUS_UI.BROUILLON;
  const StatusIcon = ui.icon;
  const stagiaireNom = stagiaire
    ? `${stagiaire.prenom || ""} ${stagiaire.nom || ""}`.trim()
    : "—";

  async function handlePdf(disposition) {
    try {
      setPdfLoading(true);
      await downloadPdf(token, id, disposition, pdfLang);
    } catch (e) {
      toast.error(e.message || t("entrepriseSpace.conventions.errors.pdf"));
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleSign() {
    try {
      await signerMutation.mutateAsync(id);
      toast.success(t("entrepriseSpace.conventions.signature.success"));
      setConfirmSign(false);
    } catch (e) {
      toast.error(e?.message || t("entrepriseSpace.conventions.signature.error"));
    }
  }

  return (
    <>
      <AppHeader
        title={t("entrepriseSpace.conventions.detail.title")}
        subtitle={t(`entrepriseSpace.conventions.status.${statut}.label`, { defaultValue: statutMeta?.label }) || t("entrepriseSpace.conventions.detail.subtitle")}
      />
      <div className="w-full space-y-6 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/conventions-entreprise">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {t("entrepriseSpace.conventions.common.list")}
          </Link>
        </Button>
      </div>

      <motion.header {...fade} className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t("entrepriseSpace.conventions.detail.heading")}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {stagiaireNom}
              {convention.numero ? t("entrepriseSpace.conventions.detail.number", { number: convention.numero }) : ""}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
              ui.className,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {t(`entrepriseSpace.conventions.status.${statut}.label`) || statut}
          </span>
        </div>
        {t(`entrepriseSpace.conventions.status.${statut}.description`) && (
          <p className="text-sm text-muted-foreground">
            {t(`entrepriseSpace.conventions.status.${statut}.description`)}
          </p>
        )}
      </motion.header>

      {/* Progression */}
      {progression && (
        <motion.section
          {...fade}
          className="rounded-md border border-border bg-card p-4 sm:p-5"
        >
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">
              {t("entrepriseSpace.conventions.progress.completedAt", { percent: progression.percent })}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("entrepriseSpace.conventions.progress.sections", { completed: progression.completed, total: progression.total })}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${progression.percent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-5">
            {Object.entries(progression.sections || {}).map(([key, ok]) => (
              <li
                key={t(`entrepriseSpace.conventions.progress.${key}`, { defaultValue: key })}
                className={cn(
                  "flex items-center gap-1 capitalize",
                  ok ? "text-emerald-700" : "text-muted-foreground",
                )}
              >
                {ok ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                {t(`entrepriseSpace.conventions.progress.${key}`, { defaultValue: key })}
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* Signature */}
      {peutSigner && (
        <motion.section
          {...fade}
          className="rounded-md border border-violet-500/25 bg-violet-500/5 p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <PenLine className="mt-0.5 h-5 w-5 text-violet-600" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{t("entrepriseSpace.conventions.signature.required")}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("entrepriseSpace.conventions.signature.readyDesc")}
              </p>
              {!confirmSign ? (
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => setConfirmSign(true)}
                >
                  {t("entrepriseSpace.conventions.signature.sign")}
                </Button>
              ) : (
                <div className="mt-3 space-y-2 rounded-md border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">
                    {t("entrepriseSpace.conventions.signature.confirmPrompt")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmSign(false)}
                    >
                      {t("entrepriseSpace.conventions.common.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      disabled={signerMutation.isPending}
                      onClick={handleSign}
                    >
                      {signerMutation.isPending && (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      )}
                      {t("entrepriseSpace.conventions.common.confirm")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {convention.accepteeParEntreprise && (
        <motion.section
          {...fade}
          className="flex items-start gap-3 rounded-md border border-emerald-500/25 bg-emerald-500/5 p-4"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium">{t("entrepriseSpace.conventions.signature.recorded")}</p>
            <p className="text-xs text-muted-foreground">
              {t("entrepriseSpace.conventions.signature.signedOnVersion", {
                date: formatDateTime(convention.dateAcceptationEntreprise, locale),
                version: convention.version || 1,
              })}
            </p>
          </div>
        </motion.section>
      )}

      {/* Stage */}
      <motion.section
        {...fade}
        className="rounded-md border border-border bg-card p-5 sm:p-6"
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Briefcase className="h-4 w-4 text-primary" />
          {t("entrepriseSpace.conventions.stage.section")}
        </h3>
        <dl className="space-y-2.5 text-sm">
          <InfoRow label={t("entrepriseSpace.conventions.stage.title")} value={stage?.intitulePoste} />
          <InfoRow label={t("entrepriseSpace.conventions.stage.start")} value={formatDate(stage?.dateDebut, locale)} />
          <InfoRow label={t("entrepriseSpace.conventions.stage.end")} value={formatDate(stage?.dateFinPrevue, locale)} />
          <InfoRow label={t("entrepriseSpace.conventions.stage.duration")} value={stage?.dureeStage} />
          <InfoRow
            label={t("entrepriseSpace.conventions.stage.mode")}
            value={
              stage?.modeTravail
                ? t(`entrepriseSpace.conventions.stage.modes.${stage.modeTravail}`, {
                    defaultValue: stage.modeTravail,
                  })
                : null
            }
          />
          <InfoRow
            label={t("entrepriseSpace.conventions.stage.status")}
            value={
              stage?.statut
                ? t(`entrepriseSpace.conventions.stage.statuses.${stage.statut}`, {
                    defaultValue: String(stage.statut).replace(/_/g, " "),
                  })
                : null
            }
          />
          {stage?.objectifsApprentissage && (
            <div className="pt-1">
              <dt className="text-xs text-muted-foreground">
                {t("entrepriseSpace.conventions.stage.mission")}
              </dt>
              <dd className="mt-0.5 text-sm">{stage.objectifsApprentissage}</dd>
            </div>
          )}
        </dl>
      </motion.section>

      {/* Stagiaire */}
      <motion.section
        {...fade}
        className="rounded-md border border-border bg-card p-5 sm:p-6"
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <User className="h-4 w-4 text-primary" />
          {t("entrepriseSpace.conventions.student.title")}
        </h3>
        <dl className="space-y-2.5 text-sm">
          <InfoRow label={t("entrepriseSpace.conventions.common.name")} value={stagiaireNom} />
          <InfoRow
            label={t("entrepriseSpace.conventions.student.education")}
            value={stagiaire?.formation?.diplome}
          />
          <InfoRow
            label={t("entrepriseSpace.conventions.student.institution")}
            value={stagiaire?.formation?.nomUniversite}
          />
          <InfoRow label={t("entrepriseSpace.conventions.student.level")} value={stagiaire?.formation?.anneeEtude} />
          <InfoRow label={t("entrepriseSpace.conventions.common.email")} value={stagiaire?.email} />
          <InfoRow label={t("entrepriseSpace.conventions.common.phone")} value={stagiaire?.telephone} />
        </dl>
      </motion.section>

      {/* Entreprise */}
      <motion.section
        {...fade}
        className="rounded-md border border-border bg-card p-5 sm:p-6"
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Building2 className="h-4 w-4 text-primary" />
          {t("entrepriseSpace.conventions.company.title")}
          {entreprise?.complete ? (
            <span className="ml-auto text-xs font-normal text-emerald-600">
              {t("entrepriseSpace.conventions.company.complete")}
            </span>
          ) : (
            <span className="ml-auto text-xs font-normal text-amber-600">
              {t("entrepriseSpace.conventions.company.incomplete")}
            </span>
          )}
        </h3>
        <dl className="space-y-2.5 text-sm">
          <InfoRow label={t("entrepriseSpace.conventions.company.legalName")} value={entreprise?.nomEntreprise} />
          <InfoRow
            label={t("entrepriseSpace.conventions.company.address")}
            value={[entreprise?.adresse, entreprise?.ville, entreprise?.pays]
              .filter(Boolean)
              .join(", ")}
          />
          <InfoRow label={t("entrepriseSpace.conventions.common.phone")} value={entreprise?.telephone} />
          <InfoRow label={t("entrepriseSpace.conventions.common.email")} value={entreprise?.email} />
          <InfoRow label={t("entrepriseSpace.conventions.company.industry")} value={entreprise?.secteurActivite} />
        </dl>
      </motion.section>

      {/* Superviseur */}
      <motion.section
        {...fade}
        className="rounded-md border border-border bg-card p-5 sm:p-6"
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Shield className="h-4 w-4 text-primary" />
          {t("entrepriseSpace.conventions.supervisor.title")}
        </h3>
        {superviseur ? (
          <dl className="space-y-2.5 text-sm">
            <InfoRow label={t("entrepriseSpace.conventions.common.name")} value={superviseur.nom} />
            <InfoRow label={t("entrepriseSpace.conventions.supervisor.position")} value={superviseur.fonction} />
            <InfoRow label={t("entrepriseSpace.conventions.common.email")} value={superviseur.email} />
            <InfoRow label={t("entrepriseSpace.conventions.common.phone")} value={superviseur.telephone} />
          </dl>
        ) : (
          <p className="text-sm text-amber-700">
            {t("entrepriseSpace.conventions.supervisor.empty")}
          </p>
        )}
      </motion.section>

      {/* PDF */}
      <motion.section
        {...fade}
        className="rounded-md border border-border bg-card p-5 sm:p-6"
      >
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-primary" />
          {t("entrepriseSpace.conventions.document.title")}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("entrepriseSpace.conventions.document.private")}
        </p>
        <div className="flex flex-wrap gap-2">
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
            variant="outline"
            disabled={pdfLoading}
            onClick={() => handlePdf("inline")}
          >
            {pdfLoading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t("entrepriseSpace.conventions.actions.view")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pdfLoading}
            onClick={() => handlePdf("attachment")}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t("entrepriseSpace.conventions.document.download")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pdfLoading}
            onClick={() => handlePdf("inline")}
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            {t("entrepriseSpace.conventions.document.print")}
          </Button>
        </div>
      </motion.section>

      {/* Historique */}
      <motion.section
        {...fade}
        className="rounded-md border border-border bg-card p-5 sm:p-6"
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4 text-primary" />
          {t("entrepriseSpace.conventions.history.title")}
        </h3>
        {historique?.length ? (
          <ul className="space-y-3">
            {historique.map((ev, i) => (
              <li key={`${ev.type}-${i}`} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                <div>
                  <p className="font-medium text-foreground">{t(`entrepriseSpace.conventions.historyEvents.${ev.type || ev.action}`, { defaultValue: ev.label })}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(ev.date, locale)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("entrepriseSpace.conventions.history.empty")}
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          {t("entrepriseSpace.conventions.history.currentVersion", { version: convention.version || 1 })}
        </p>
      </motion.section>
    </div>
    </>
  );
}