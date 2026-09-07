"use client";

/**
 * Student Safety & Reporting Center
 * Connected to existing litiges (signalements) backend.
 * Statuts réels : ouvert | en_cours | resolu | rejete
 */

import { useMemo, useState, useCallback } from "react";
import {
  FiShield,
  FiBriefcase,
  FiUser,
  FiChevronRight,
  FiChevronLeft,
  FiCheck,
  FiAlertCircle,
  FiClock,
  FiInbox,
  FiLock,
  FiLoader,
  FiX,
  FiUpload,
  FiPaperclip,
  FiFile,
  FiTrash2,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonStage } from "@/lib/queries/useStages";
import {
  useCreateLitige,
  useMesLitiges,
  useMessagesLitige,
  useAddMessageLitige,
  usePiecesLitige,
  useUploadPieceLitige,
} from "@/lib/queries/useLitiges";
import { downloadPieceLitigeRequest } from "@/lib/api/litiges";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

const CATEGORY_VALUES = [
  "harassment",
  "discrimination",
  "inappropriate_behavior",
  "unsafe_working_conditions",
  "contract_internship_issue",
  "payment_issue",
  "abuse_of_authority",
  "privacy_concern",
  "other",
];

const SEVERITY_VALUES = [
  { value: "faible", color: "bg-slate-400" },
  { value: "moyen", color: "bg-amber-500" },
  { value: "eleve", color: "bg-orange-500" },
  { value: "critique", color: "bg-red-500" },
];

const STATUT_STYLE = {
  ouvert: {
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  en_cours: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  resolu: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  rejete: {
    dot: "bg-muted-foreground/50",
    text: "text-muted-foreground",
    bg: "bg-muted/50",
  },
};

const STEP_KEYS = ["stepWho", "stepWhat", "stepDetails", "stepReview"];

const emptyForm = {
  cibleType: null,
  categorie: "",
  description: "",
  dateIncident: "",
  severite: "moyen",
};


function formatBytes(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v < 1024) return `${v} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  return `${(v / (1024 * 1024)).toFixed(1)} MB`;
}

const ALLOWED_EXT = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".txt"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function StudentReportMessages({ idLitige, closed, attendInfo }) {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const { data, isLoading } = useMessagesLitige(idLitige, !!idLitige);
  const { data: piecesData, isLoading: loadingPieces } = usePiecesLitige(
    idLitige,
    !!idLitige,
  );
  const addMessage = useAddMessageLitige(idLitige);
  const uploadPiece = useUploadPieceLitige(idLitige);
  const messages = data?.messages || data || [];
  const pieces = piecesData?.pieces || piecesData || [];
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const msgList = Array.isArray(messages) ? messages : [];
  const pieceList = Array.isArray(pieces) ? pieces : [];

  const lastAdminMsg = [...msgList]
    .reverse()
    .find((m) => m.roleAuteur === "admin");

  function onPickFiles(fileList) {
    const incoming = Array.from(fileList || []);
    const next = [...files];
    for (const f of incoming) {
      const ext = `.${(f.name.split(".").pop() || "").toLowerCase()}`;
      if (!ALLOWED_EXT.includes(ext) && !ALLOWED_EXT.includes(ext.replace("jpeg", "jpg"))) {
        // allow .jpeg via mime later
        if (![".pdf", ".png", ".jpg", ".jpeg", ".webp", ".txt"].includes(ext)) {
          toast.error(
            t("stagiaireSpace.securite.errFileType") ||
              "Unsupported file type. Use PDF, PNG, JPG, WEBP or TXT.",
          );
          continue;
        }
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(
          t("stagiaireSpace.securite.errFileSize") ||
            "File exceeds the 5 MB limit.",
        );
        continue;
      }
      if (next.length >= 8) {
        toast.error(
          t("stagiaireSpace.securite.errFileMax") ||
            "Maximum 8 files per submission.",
        );
        break;
      }
      next.push(f);
    }
    setFiles(next);
  }

  async function submitInfo() {
    if (closed) return;
    const body = text.trim();
    if (body.length < 2 && files.length === 0) {
      toast.error(
        t("stagiaireSpace.securite.errEmptyReply") ||
          "Add a message or at least one file.",
      );
      return;
    }
    setUploading(true);
    try {
      // Upload files first
      for (const f of files) {
        await uploadPiece.mutateAsync(f);
      }
      // Message clears attendInfo on backend
      if (body.length >= 2) {
        await addMessage.mutateAsync(body);
      } else if (files.length > 0) {
        // Message minimal so attendInfo is cleared
        await addMessage.mutateAsync(
          t("stagiaireSpace.securite.filesOnlyNote") ||
            "Please find the attached supporting documents.",
        );
      }
      setText("");
      setFiles([]);
      setSentOk(true);
      toast.success(
        t("stagiaireSpace.securite.infoSubmitted") ||
          "Your information has been sent securely.",
      );
    } catch (e) {
      toast.error(
        e?.message ||
          t("stagiaireSpace.securite.errSubmit") ||
          "Unable to submit information.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Request for additional information */}
      {attendInfo && !closed && lastAdminMsg && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 dark:bg-amber-500/[0.08]">
          <div className="flex items-start gap-2.5">
            <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300">
                {t("stagiaireSpace.securite.requestInfoTitle") ||
                  "Additional information requested"}
              </p>
              <p className="mt-1 text-sm text-foreground">
                {t("stagiaireSpace.securite.requestInfoHint") ||
                  "The administration team needs more information to continue reviewing your report."}
              </p>
              <div className="mt-3 rounded-lg border border-border/60 bg-card/80 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("stagiaireSpace.securite.adminLabel") || "Administration"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {lastAdminMsg.contenu}
                </p>
                {lastAdminMsg.dateCreation && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(lastAdminMsg.dateCreation).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {sentOk && !attendInfo && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
          {t("stagiaireSpace.securite.infoSubmittedBanner") ||
            "Your additional information has been securely sent to the InternIn administration team."}
        </div>
      )}

      {/* Existing evidence */}
      {(loadingPieces || pieceList.length > 0) && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("stagiaireSpace.securite.attachmentsTitle") || "Attachments"}
          </p>
          {loadingPieces ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <ul className="space-y-2">
              {pieceList.map((pc) => (
                <li
                  key={pc.idPiece}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FiPaperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{pc.nomOriginal}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {pc.mimeType || "file"} · {formatBytes(pc.tailleOctets)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
                    onClick={async () => {
                      try {
                        await downloadPieceLitigeRequest(pc.idPiece, token);
                      } catch (e) {
                        toast.error(e?.message || "Download failed");
                      }
                    }}
                  >
                    {t("stagiaireSpace.securite.download") || "Download"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Conversation */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("stagiaireSpace.securite.messagesTitle") || "Messages"}
        </p>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <ul className="space-y-2">
            {msgList.length === 0 && (
              <li className="text-sm text-muted-foreground">
                {t("stagiaireSpace.securite.noMessages") || "No messages yet."}
              </li>
            )}
            {msgList.map((m) => (
              <li
                key={m.idMessage}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  m.roleAuteur === "admin"
                    ? "border-violet-500/20 bg-violet-500/[0.04]"
                    : "border-border bg-muted/30",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.roleAuteur === "admin"
                    ? t("stagiaireSpace.securite.adminLabel") || "Administration"
                    : t("stagiaireSpace.securite.youLabel") || "You"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-foreground">
                  {m.contenu}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Submit information */}
      {!closed && (
        <div className="space-y-3 rounded-xl border border-border/80 bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {attendInfo
              ? t("stagiaireSpace.securite.submitInfoTitle") ||
                "Submit additional information"
              : t("stagiaireSpace.securite.replyTitle") || "Reply"}
          </p>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              t("stagiaireSpace.securite.replyPlaceholder") ||
              "Explain or provide additional context…"
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
          />

          {/* Dropzone */}
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center transition hover:border-teal-500/40 hover:bg-teal-500/[0.04]",
            )}
          >
            <FiUpload className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <span className="text-sm font-medium text-foreground">
              {t("stagiaireSpace.securite.addFiles") ||
                "Add supporting documents"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {t("stagiaireSpace.securite.filesHint") ||
                "Screenshots, PDFs or other evidence · PDF · PNG · JPG · WEBP · TXT · max 5 MB"}
            </span>
            <input
              type="file"
              className="sr-only"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,image/png,image/jpeg,image/webp,application/pdf,text/plain"
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FiFile className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{f.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatBytes(f.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label="Remove"
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            size="sm"
            disabled={
              uploading ||
              addMessage.isPending ||
              uploadPiece.isPending ||
              (text.trim().length < 2 && files.length === 0)
            }
            onClick={submitInfo}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {(uploading || addMessage.isPending || uploadPiece.isPending) && (
              <FiLoader className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            {attendInfo
              ? t("stagiaireSpace.securite.submitInfo") || "Submit information"
              : t("stagiaireSpace.securite.sendReply") || "Send reply"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SecuritePage() {
  const reduceMotion = useReducedMotion();
  const { t, locale } = useTranslation();
  const { data: monStageData, isLoading: loadingStage } = useMonStage();
  const { data: mesLitigesData, isLoading: loadingReports } = useMesLitiges();
  const createLitige = useCreateLitige();

  const stage =
    monStageData?.stage || monStageData?.monStage || monStageData || null;
  const hasStage = Boolean(stage?.idStage);
  // Superviseur via contact OU affectation équipe (mon-stage enrichi)
  const hasSupervisor = Boolean(
    stage?.superviseur?.nom ||
      stage?.superviseur?.email ||
      stage?.idContactSuperviseur,
  );
  const reports = useMemo(() => {
    const raw = mesLitigesData?.litiges || mesLitigesData || [];
    return Array.isArray(raw) ? raw : [];
  }, [mesLitigesData]);

  const formatDate = useCallback(
    (date) => {
      if (!date) return "—";
      return new Date(date).toLocaleDateString(
        locale === "en" ? "en-GB" : "fr-FR",
        { day: "2-digit", month: "short", year: "numeric" },
      );
    },
    [locale],
  );

  const categoryLabel = useCallback(
    (value) => {
      if (!value) return "—";
      const key = `stagiaireSpace.securite.cat_${value}`;
      const translated = t(key);
      return translated === key ? value : translated;
    },
    [t],
  );

  const severityLabel = useCallback(
    (value) => {
      if (!value) return "—";
      const key = `stagiaireSpace.securite.sev_${value}`;
      const translated = t(key);
      return translated === key ? value : translated;
    },
    [t],
  );

  const statutLabel = useCallback(
    (statut) => {
      const key = `stagiaireSpace.securite.statut_${statut || "ouvert"}`;
      const translated = t(key);
      return translated === key ? statut : translated;
    },
    [t],
  );

  const steps = useMemo(
    () => STEP_KEYS.map((k) => t(`stagiaireSpace.securite.${k}`)),
    [t],
  );

  const [view, setView] = useState("hub"); // hub | form | success
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const startReport = useCallback((cibleType) => {
    setForm({ ...emptyForm, cibleType });
    setErrors({});
    setStep(0);
    setView("form");
  }, []);

  const validateStep = useCallback(
    (s) => {
      const e = {};
      if (s === 0 && !form.cibleType) e.cibleType = t("stagiaireSpace.securite.errWho");
      if (s === 1) {
        if (!form.categorie) e.categorie = t("stagiaireSpace.securite.errReason");
        if (!form.description || form.description.trim().length < 10)
          e.description = t("stagiaireSpace.securite.errDesc");
      }
      if (s === 2 && form.dateIncident) {
        const d = new Date(form.dateIncident);
        if (Number.isNaN(d.getTime())) e.dateIncident = t("stagiaireSpace.securite.errInvalidDate");
        else if (d > new Date()) e.dateIncident = t("stagiaireSpace.securite.errFutureDate");
      }
      setErrors(e);
      return Object.keys(e).length === 0;
    },
    [form],
  );

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const back = () => {
    if (step === 0) {
      setView("hub");
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    if (!validateStep(1) || !validateStep(0)) {
      setStep(1);
      return;
    }
    if (!stage?.idStage) {
      toast.error(t("stagiaireSpace.securite.errNoStage"));
      return;
    }
    try {
      const res = await createLitige.mutateAsync({
        idStage: stage.idStage,
        cibleType: form.cibleType,
        categorie: form.categorie,
        severite: form.severite || undefined,
        dateIncident: form.dateIncident || null,
        description: form.description.trim(),
      });
      const litige = res?.litige || res;
      setSubmitted(litige);
      setView("success");
    } catch (err) {
      const msg =
        err?.message ||
        err?.data?.message ||
        t("stagiaireSpace.securite.errSubmit");
      toast.error(msg);
    }
  };

  const transition = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } };

  return (
    <div className="min-h-full">
      <AppHeader
        title={t("stagiaireSpace.securite.title")}
        subtitle={t("stagiaireSpace.securite.subtitle")}
      />

      <div className="w-full space-y-8 px-4 py-6 sm:px-6">
        {/* Confidentiality notice */}
        <div className="flex gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <FiLock className="mt-0.5 size-4 shrink-0 text-teal-600 dark:text-teal-400" />
          <p>
            {t("stagiaireSpace.securite.confidentialPrefix")}{" "}
            <span className="font-medium text-foreground">
              {t("stagiaireSpace.securite.confidentialStrong")}
            </span>
            {t("stagiaireSpace.securite.confidentialSuffix")}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {view === "hub" && (
            <motion.div key="hub" {...transition} className="space-y-8">
              {/* Hero */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                  <FiShield className="size-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {t("stagiaireSpace.securite.heroEyebrow")}
                  </span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {t("stagiaireSpace.securite.heroTitle")}
                </h1>
                <p className="max-w-2xl text-muted-foreground">
                  {t("stagiaireSpace.securite.heroDesc")}
                </p>
              </section>

              {/* Entry cards */}
              <section className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!hasStage || loadingStage}
                  onClick={() => startReport("entreprise")}
                  className={cn(
                    "group rounded-xl border border-border bg-card p-5 text-left transition",
                    "hover:border-teal-500/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40",
                    (!hasStage || loadingStage) && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <FiBriefcase className="size-5" />
                  </div>
                  <h2 className="font-semibold text-foreground">{t("stagiaireSpace.securite.reportCompanyTitle")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("stagiaireSpace.securite.reportCompanyShort")}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-600 dark:text-teal-400 group-hover:gap-1.5 transition-all">
                    {t("stagiaireSpace.securite.startReport")} <FiChevronRight className="size-4" />
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!hasStage || loadingStage || !hasSupervisor}
                  onClick={() => startReport("superviseur")}
                  className={cn(
                    "group rounded-xl border border-border bg-card p-5 text-left transition",
                    "hover:border-teal-500/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40",
                    (!hasStage || loadingStage || !hasSupervisor) &&
                      "opacity-60 cursor-not-allowed",
                  )}
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <FiUser className="size-5" />
                  </div>
                  <h2 className="font-semibold text-foreground">{t("stagiaireSpace.securite.reportSupervisorTitle")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("stagiaireSpace.securite.reportSupervisorShort")}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-600 dark:text-teal-400 group-hover:gap-1.5 transition-all">
                    {t("stagiaireSpace.securite.startReport")} <FiChevronRight className="size-4" />
                  </span>
                </button>
              </section>

              {!loadingStage && !hasStage && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="flex gap-2">
                    <FiAlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p>
                      {t("stagiaireSpace.securite.noStageDesc")}
                    </p>
                  </div>
                </div>
              )}

              {/* Internship context */}
              {hasStage && (
                <section className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("stagiaireSpace.securite.contextTitle")}
                  </h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{t("stagiaireSpace.securite.company")}</dt>
                      <dd className="font-medium text-foreground">
                        {stage.nomEntreprise ||
                          stage.entreprise?.nomEntreprise ||
                          "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("stagiaireSpace.securite.supervisor")}</dt>
                      <dd className="font-medium text-foreground">
                        {stage.superviseur?.nom || t("stagiaireSpace.securite.notAssigned")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("stagiaireSpace.securite.period")}</dt>
                      <dd className="font-medium text-foreground">
                        {formatDate(stage.dateDebut)} →{" "}
                        {formatDate(stage.dateFinPrevue)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("stagiaireSpace.securite.status")}</dt>
                      <dd className="font-medium capitalize text-foreground">
                        {stage.statut || "—"}
                      </dd>
                    </div>
                  </dl>
                </section>
              )}

              
              {/* Action required — admin requested info */}
              {reports.some((r) => r.attendInfo) && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4 dark:bg-amber-500/[0.1]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300">
                          {t("stagiaireSpace.securite.actionRequired") || "Action required"}
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          {t("stagiaireSpace.securite.actionRequiredDesc") ||
                            "The InternIn administration team needs additional information regarding one of your reports."}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {reports
                            .filter((r) => r.attendInfo)
                            .map((r) => (
                              <li key={r.idLitige} className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {r.reference || r.idLitige?.slice?.(0, 8)}
                                </span>
                                {r.categorie ? ` · ${categoryLabel(r.categorie)}` : ""}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 bg-amber-600 text-white hover:bg-amber-700"
                      onClick={() => {
                        const first = reports.find((r) => r.attendInfo);
                        if (first) setSelectedReport(first);
                      }}
                    >
                      {t("stagiaireSpace.securite.reviewRequest") || "Review request"}
                    </Button>
                  </div>
                </div>
              )}

              {/* My reports */}

              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">{t("stagiaireSpace.securite.myReports")}</h2>
                {loadingReports ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <FiInbox className="size-5" />
                    </div>
                    <h3 className="font-medium text-foreground">{t("stagiaireSpace.securite.emptyReportsTitle")}</h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      {t("stagiaireSpace.securite.emptyReportsDesc")}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {reports.map((r) => {
                      const style = STATUT_STYLE[r.statut] || STATUT_STYLE.ouvert;
                      return (
                        <li key={r.idLitige}>
                          <button
                            type="button"
                            onClick={() => setSelectedReport(r)}
                            className="w-full rounded-xl border border-border bg-card p-4 text-left transition hover:border-teal-500/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {r.cibleLabel ||
                                    (r.cibleType === "superviseur"
                                      ? t("stagiaireSpace.securite.supervisorReport")
                                      : r.cibleType === "entreprise"
                                        ? t("stagiaireSpace.securite.companyReport")
                                        : r.typeLitige ||
                                          t("stagiaireSpace.securite.reportFallback"))}
                                </p>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                  {categoryLabel(r.categorie) || r.typeLitige}
                                </p>
                                {(r.nomSuperviseur || r.nomEntreprise) && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {r.cibleType === "superviseur"
                                      ? t("stagiaireSpace.securite.targetSupervisor", {
                                          name: r.nomSuperviseur || "—",
                                          company: r.nomEntreprise || "—",
                                        })
                                      : t("stagiaireSpace.securite.targetCompany", {
                                          name: r.nomEntreprise || "—",
                                        })}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                    style.bg,
                                    style.text,
                                  )}
                                >
                                  <span className={cn("size-1.5 rounded-full", style.dot)} />
                                  {statutLabel(r.statut)}
                                </span>
                                {r.attendInfo && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                                    <FiAlertCircle className="h-3 w-3" />
                                    {t("stagiaireSpace.securite.actionRequired") || "Action required"}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <FiClock className="size-3" />
                                {t("stagiaireSpace.securite.submittedOn", { date: formatDate(r.dateCreation) })}
                              </span>
                              {r.reference && (
                                <span className="font-mono">{r.reference}</span>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </motion.div>
          )}

          {view === "form" && (
            <motion.div key="form" {...transition} className="space-y-6">
              {/* Progress */}
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {steps.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border text-[11px]",
                        i === step
                          ? "border-teal-500 bg-teal-500 text-white"
                          : i < step
                            ? "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-400"
                            : "border-border",
                      )}
                    >
                      {i < step ? <FiCheck className="size-3" /> : String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "hidden sm:inline",
                        i === step && "text-foreground",
                      )}
                    >
                      {label}
                    </span>
                    {i < steps.length - 1 && (
                      <span className="mx-1 h-px w-4 sm:w-8 bg-border" />
                    )}
                  </div>
                ))}
              </div>

              {/* Context strip */}
              {hasStage && (
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{t("stagiaireSpace.securite.reportingAbout")}</span>
                  <span className="font-medium text-foreground">
                    {form.cibleType === "superviseur"
                      ? stage.superviseur?.nom || t("stagiaireSpace.securite.supervisor")
                      : stage.nomEntreprise ||
                        stage.entreprise?.nomEntreprise ||
                        t("stagiaireSpace.securite.company")}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {stage.nomEntreprise || stage.entreprise?.nomEntreprise}
                  </span>
                </div>
              )}

              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">{t("stagiaireSpace.securite.whoTitle")}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        value: "entreprise",
                        title: t("stagiaireSpace.securite.company"),
                        desc:
                          stage?.nomEntreprise ||
                          stage?.entreprise?.nomEntreprise ||
                          t("stagiaireSpace.securite.company"),
                        icon: FiBriefcase,
                      },
                      {
                        value: "superviseur",
                        title: t("stagiaireSpace.securite.supervisor"),
                        desc:
                          stage?.superviseur?.nom ||
                          t("stagiaireSpace.securite.yourSupervisor"),
                        icon: FiUser,
                        disabled: !hasSupervisor,
                      },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={opt.disabled}
                        onClick={() =>
                          setForm((f) => ({ ...f, cibleType: opt.value }))
                        }
                        className={cn(
                          "rounded-xl border p-4 text-left transition",
                          form.cibleType === opt.value
                            ? "border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/30"
                            : "border-border bg-card hover:border-teal-500/30",
                          opt.disabled && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        <opt.icon className="mb-2 size-5 text-teal-600 dark:text-teal-400" />
                        <p className="font-medium">{opt.title}</p>
                        <p className="text-sm text-muted-foreground">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  {errors.cibleType && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.cibleType}
                    </p>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">{t("stagiaireSpace.securite.stepWhat")}</h2>
                  <div className="space-y-2">
                    <Label htmlFor="categorie">{t("stagiaireSpace.securite.reasonTitle")}</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {CATEGORY_VALUES.map((cValue) => (
                        <button
                          key={cValue}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, categorie: cValue }))
                          }
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-left text-sm transition",
                            form.categorie === cValue
                              ? "border-teal-500 bg-teal-500/5 font-medium text-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-teal-500/30 hover:text-foreground",
                          )}
                        >
                          {categoryLabel(cValue)}
                        </button>
                      ))}
                    </div>
                    {errors.categorie && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.categorie}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t("stagiaireSpace.securite.descriptionTitle")}</Label>
                    <Textarea
                      id="description"
                      rows={6}
                      placeholder={t("stagiaireSpace.securite.descriptionPlaceholder")}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      className="resize-y border-border focus-visible:ring-teal-500/40"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("stagiaireSpace.securite.descriptionHint")}
                    </p>
                    {errors.description && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">{t("stagiaireSpace.securite.supportingTitle")}</h2>
                  <div className="space-y-2">
                    <Label htmlFor="dateIncident">{t("stagiaireSpace.securite.whenHappened")}</Label>
                    <Input
                      id="dateIncident"
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={form.dateIncident}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dateIncident: e.target.value,
                        }))
                      }
                      className="max-w-xs border-border focus-visible:ring-teal-500/40"
                    />
                    {errors.dateIncident && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.dateIncident}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t("stagiaireSpace.securite.severityTitle")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {SEVERITY_VALUES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, severite: s.value }))
                          }
                          className={cn(
                            "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                            form.severite === s.value
                              ? "border-teal-500 bg-teal-500/5 font-medium"
                              : "border-border bg-card hover:border-teal-500/30",
                          )}
                        >
                          <span
                            className={cn("size-2 rounded-full", s.color)}
                          />
                          {severityLabel(s.value)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">{t("stagiaireSpace.securite.reviewSubmit")}</h2>
                  <div className="rounded-xl border border-border bg-card divide-y divide-border">
                    <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                      <span className="text-sm text-muted-foreground">
                        {t("stagiaireSpace.securite.reportedParty")}
                      </span>
                      <span className="sm:col-span-2 text-sm font-medium capitalize">
                        {form.cibleType === "superviseur"
                          ? t("stagiaireSpace.securite.supervisor")
                          : t("stagiaireSpace.securite.company")}
                      </span>
                    </div>
                    <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                      <span className="text-sm text-muted-foreground">
                        {form.cibleType === "superviseur"
                          ? t("stagiaireSpace.securite.supervisor")
                          : t("stagiaireSpace.securite.company")}
                      </span>
                      <span className="sm:col-span-2 text-sm font-medium">
                        {form.cibleType === "superviseur"
                          ? stage?.superviseur?.nom || "—"
                          : stage?.nomEntreprise ||
                            stage?.entreprise?.nomEntreprise ||
                            "—"}
                      </span>
                    </div>
                    <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                      <span className="text-sm text-muted-foreground">{t("stagiaireSpace.securite.reasonTitle")}</span>
                      <span className="sm:col-span-2 text-sm font-medium">
                        {categoryLabel(form.categorie)}
                      </span>
                    </div>
                    {form.dateIncident && (
                      <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                        <span className="text-sm text-muted-foreground">
                          {t("stagiaireSpace.securite.incidentDate")}
                        </span>
                        <span className="sm:col-span-2 text-sm font-medium">
                          {formatDate(form.dateIncident)}
                        </span>
                      </div>
                    )}
                    <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                      <span className="text-sm text-muted-foreground">
                        {t("stagiaireSpace.securite.severity")}
                      </span>
                      <span className="sm:col-span-2 text-sm font-medium capitalize">
                        {severityLabel(form.severite)}
                      </span>
                    </div>
                    <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                      <span className="text-sm text-muted-foreground">
                        {t("stagiaireSpace.securite.description")}
                      </span>
                      <span className="sm:col-span-2 text-sm whitespace-pre-wrap">
                        {form.description}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex gap-2">
                    <FiLock className="size-3.5 shrink-0 mt-0.5" />
                    {t("stagiaireSpace.securite.confirmNote")}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <Button type="button" variant="ghost" onClick={back}>
                  <FiChevronLeft className="size-4" />
                  {step === 0 ? t("stagiaireSpace.securite.cancel") : t("stagiaireSpace.securite.back")}
                </Button>
                {step < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={next}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {t("stagiaireSpace.securite.continue")}
                    <FiChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={submit}
                    disabled={createLitige.isPending}
                    className="bg-teal-600 hover:bg-teal-700 text-white min-w-[140px]"
                  >
                    {createLitige.isPending ? (
                      <>
                        <FiLoader className="size-4 animate-spin" />
                        {t("stagiaireSpace.securite.submitting")}
                      </>
                    ) : (
                      t("stagiaireSpace.securite.submit")
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {view === "success" && (
            <motion.div
              key="success"
              {...transition}
              className="mx-auto max-w-md space-y-6 py-8 text-center"
            >
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FiCheck className="size-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {t("stagiaireSpace.securite.successTitle")}
                </h2>
                <p className="text-muted-foreground">
                  {t("stagiaireSpace.securite.successDesc")}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card px-5 py-4 text-left text-sm space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("stagiaireSpace.securite.reference")}</span>
                  <span className="font-mono font-medium">
                    {submitted?.reference || "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("stagiaireSpace.securite.status")}</span>
                  <span className="font-medium text-blue-700 dark:text-blue-400">
                    {t("stagiaireSpace.securite.statusUnderReview")}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setView("hub");
                  setSubmitted(null);
                  setForm(emptyForm);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {t("stagiaireSpace.securite.backToSafety")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail drawer / modal simple */}
        <AnimatePresence>
          {selectedReport && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="report-detail-title"
                className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl"
                initial={reduceMotion ? false : { y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduceMotion ? undefined : { y: 16, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                  <div>
                    <h3
                      id="report-detail-title"
                      className="font-semibold text-foreground"
                    >
                      {selectedReport.reference || t("stagiaireSpace.securite.detailTitle")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {categoryLabel(selectedReport.categorie) ||
                        selectedReport.typeLitige}
                    </p>
                    {(selectedReport.cibleLabel ||
                      selectedReport.nomEntreprise ||
                      selectedReport.nomSuperviseur) && (
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {selectedReport.cibleLabel ||
                          (selectedReport.cibleType === "superviseur"
                            ? t("stagiaireSpace.securite.targetSupervisor", {
                                name:
                                  selectedReport.nomSuperviseur ||
                                  selectedReport.superviseur?.nom ||
                                  "—",
                                company: selectedReport.nomEntreprise || "—",
                              })
                            : t("stagiaireSpace.securite.targetCompany", {
                                name: selectedReport.nomEntreprise || "—",
                              }))}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={t("stagiaireSpace.securite.close")}
                  >
                    <FiX className="size-4" />
                  </button>
                </div>
                <div className="space-y-4 px-5 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const style =
                        STATUT_STYLE[selectedReport.statut] || STATUT_STYLE.ouvert;
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            style.bg,
                            style.text,
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", style.dot)} />
                          {statutLabel(selectedReport.statut)}
                        </span>
                      );
                    })()}
                    <span className="text-muted-foreground">
                      ·{" "}
                      {t("stagiaireSpace.securite.submittedOn", {
                        date: formatDate(selectedReport.dateCreation),
                      })}
                    </span>
                  </div>

                  {/* Simple timeline */}
                  <ol className="relative space-y-3 border-l border-border pl-4">
                    <li>
                      <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full bg-teal-500" />
                      <p className="font-medium">{t("stagiaireSpace.securite.timelineReportSubmitted")}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(selectedReport.dateCreation)}
                      </p>
                    </li>
                    {(selectedReport.statut === "en_cours" ||
                      selectedReport.statut === "resolu" ||
                      selectedReport.statut === "rejete") && (
                      <li>
                        <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full bg-amber-500" />
                        <p className="font-medium">{t("stagiaireSpace.securite.timelineAdminReview")}</p>
                      </li>
                    )}
                    {(selectedReport.statut === "resolu" ||
                      selectedReport.statut === "rejete") && (
                      <li>
                        <span
                          className={cn(
                            "absolute -left-1.5 mt-1.5 size-3 rounded-full",
                            selectedReport.statut === "resolu"
                              ? "bg-emerald-500"
                              : "bg-muted-foreground",
                          )}
                        />
                        <p className="font-medium">
                          {selectedReport.statut === "resolu"
                            ? t("stagiaireSpace.securite.statut_resolu")
                            : t("stagiaireSpace.securite.statut_rejete")}
                        </p>
                        {selectedReport.dateResolution && (
                          <p className="text-xs text-muted-foreground">
                            {formatDate(selectedReport.dateResolution)}
                          </p>
                        )}
                      </li>
                    )}
                  </ol>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {t("stagiaireSpace.securite.yourDescription")}
                    </p>
                    <p className="whitespace-pre-wrap text-foreground">
                      {selectedReport.description}
                    </p>
                  </div>
                  <StudentReportMessages
                    idLitige={selectedReport.idLitige}
                    closed={
                      selectedReport.statut === "resolu" ||
                      selectedReport.statut === "rejete"
                    }
                    attendInfo={!!selectedReport.attendInfo}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
