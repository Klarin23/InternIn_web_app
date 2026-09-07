"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Building2,
  User,
  Hash,
  BadgeCheck,
  FileCheck,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useVerifierCertificat } from "@/lib/queries/useStages";
import SiteLogo from "@/components/layout/SiteLogo";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import ThemeToggle from "@/components/layout/ThemeToggle";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function localeTag(locale) {
  return locale === "en" || String(locale).startsWith("en") ? "en-GB" : "fr-FR";
}

function formatDate(d, locale) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(localeTag(locale), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function computeDurationMonths(debut, fin) {
  if (!debut || !fin) return null;
  const a = new Date(debut);
  const b = new Date(fin);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return null;
  const days = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (days < 1) return null;
  return Math.max(1, Math.round(days / 30.44));
}

function PublicVerifyHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <SiteLogo className="h-6 w-auto" href="/" />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function VerifyShieldVisual({ variant = "success" }) {
  const isOk = variant === "success";
  return (
    <div
      className="relative mx-auto flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52"
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full opacity-40",
          isOk
            ? "bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.18),transparent_70%)]"
            : "bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.12),transparent_70%)]",
        )}
      />
      <div
        className={cn(
          "absolute inset-6 rounded-full border",
          isOk
            ? "border-teal-500/15 dark:border-teal-400/20"
            : "border-destructive/20",
        )}
      />
      <div
        className={cn(
          "absolute inset-12 rounded-full border",
          isOk
            ? "border-violet-500/10 dark:border-violet-400/15"
            : "border-destructive/10",
        )}
      />
      <div
        className={cn(
          "relative flex size-24 items-center justify-center rounded-3xl shadow-lg sm:size-28",
          isOk
            ? "bg-gradient-to-br from-teal-500 via-sky-500 to-violet-600 text-white shadow-teal-500/20"
            : "bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-rose-500/20",
        )}
      >
        {isOk ? (
          <ShieldCheck className="size-12 sm:size-14" strokeWidth={1.5} />
        ) : (
          <ShieldAlert className="size-12 sm:size-14" strokeWidth={1.5} />
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, iconClass, label, value, mono }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/50 py-3.5 last:border-0">
      <div
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
          iconClass,
        )}
      >
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            "mt-0.5 text-sm font-semibold text-foreground",
            mono && "font-mono tracking-wide",
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function VerifyAnotherPanel() {
  const { t } = useTranslation();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setErr(t("certificateVerification.codeRequired"));
      return;
    }
    if (trimmed.length < 4) {
      setErr(t("certificateVerification.codeInvalidShort"));
      return;
    }
    setErr("");
    router.push(`/verification/certificat/${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className="rounded-2xl bg-[#0B1220] px-5 py-8 text-white shadow-xl dark:bg-[#060B14] sm:px-8 sm:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-md">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            {t("certificateVerification.verifyAnotherTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-slate-300">
            {t("certificateVerification.verifyAnotherDesc")}
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-3 sm:flex-row sm:items-start lg:max-w-xl"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="verify-code-input" className="sr-only">
              {t("certificateVerification.verificationCode")}
            </label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="verify-code-input"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setErr("");
                }}
                placeholder={t("certificateVerification.codePlaceholder")}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              />
            </div>
            {err ? (
              <p className="mt-1.5 text-xs text-rose-300" role="alert">
                {err}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-teal-500 to-violet-600 px-6 text-sm font-semibold text-white hover:from-teal-400 hover:to-violet-500"
          >
            {t("certificateVerification.verifyBtn")}
            <ArrowRight className="ml-2 size-4" aria-hidden />
          </Button>
        </form>
      </div>
    </section>
  );
}

export default function VerificationCertificatPage({ params }) {
  const { code } = use(params);
  const { t, locale } = useTranslation();
  const { data, isLoading, isError } = useVerifierCertificat(code);

  const isSuccess = !isLoading && !isError && data?.authentique === true;
  const isFail = !isLoading && (isError || !data?.authentique);

  const months = isSuccess
    ? computeDurationMonths(data?.periode?.debut, data?.periode?.fin)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-foreground dark:bg-[#080D18]">
      <PublicVerifyHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mb-6 sm:mb-8">
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("verify-another")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("certificateVerification.backVerify")}
          </button>
        </div>

        {isLoading && (
          <div
            className="flex flex-col items-center justify-center gap-4 py-24"
            role="status"
            aria-live="polite"
            aria-label={t("certificateVerification.loadingAria")}
          >
            <div className="relative flex size-20 items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full bg-teal-500/10" />
              <Loader2 className="size-8 animate-spin text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("certificateVerification.loading")}
            </p>
          </div>
        )}

        {isSuccess && (
          <div className="space-y-8 sm:space-y-10">
            <section className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                  {t("certificateVerification.titleAuthentic")}{" "}
                  <span className="bg-gradient-to-r from-teal-500 via-sky-500 to-violet-600 bg-clip-text text-transparent">
                    {t("certificateVerification.titleAuthenticAccent")}
                  </span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t("certificateVerification.successDesc")}
                </p>

                <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 dark:border-teal-400/20 dark:bg-teal-400/10">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300">
                    <ShieldCheck className="size-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("certificateVerification.verifyStatus")}
                    </p>
                    <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                      {t("certificateVerification.statusAuthentic")}
                    </p>
                  </div>
                  <CheckCircle2
                    className="ml-2 size-5 text-teal-600 dark:text-teal-400"
                    aria-hidden
                  />
                </div>
              </div>

              <VerifyShieldVisual variant="success" />
            </section>

            <section
              className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7"
              aria-labelledby="cert-details-title"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <FileCheck className="size-5" strokeWidth={1.75} />
                </div>
                <h2
                  id="cert-details-title"
                  className="text-base font-semibold text-foreground sm:text-lg"
                >
                  {t("certificateVerification.detailsTitle")}
                </h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-teal-500/[0.04] via-sky-500/[0.04] to-violet-500/[0.06] p-5 dark:from-teal-400/[0.06] dark:via-sky-400/[0.04] dark:to-violet-400/[0.08] sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/20 to-violet-500/20 text-teal-700 dark:text-teal-300">
                      <User className="size-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t("certificateVerification.holder")}
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-foreground">
                        {data.stagiaire || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        <Building2 className="size-3.5" aria-hidden />
                        {t("certificateVerification.hostCompany")}
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {data.entreprise || "—"}
                      </p>
                    </div>

                    {(data.periode?.debut || data.periode?.fin) && (
                      <div>
                        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          <Calendar className="size-3.5" aria-hidden />
                          {t("certificateVerification.period")}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatDate(data.periode?.debut, locale)}
                          {" — "}
                          {formatDate(data.periode?.fin, locale)}
                        </p>
                        {months != null && (
                          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            <Calendar className="size-3" aria-hidden />
                            {t(
                              months === 1
                                ? "certificateVerification.durationOne"
                                : "certificateVerification.duration",
                              { months },
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card px-4 sm:px-5">
                  <InfoRow
                    icon={Hash}
                    iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
                    label={t("certificateVerification.certId")}
                    value={data.codeVerification}
                    mono
                  />
                  <InfoRow
                    icon={Calendar}
                    iconClass="bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    label={t("certificateVerification.issueDate")}
                    value={formatDate(data.dateEmission, locale)}
                  />
                  <InfoRow
                    icon={Award}
                    iconClass="bg-teal-500/10 text-teal-600 dark:text-teal-400"
                    label={t("certificateVerification.issuedBy")}
                    value={t("certificateVerification.issuerName")}
                  />
                  <InfoRow
                    icon={BadgeCheck}
                    iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    label={t("certificateVerification.currentStatus")}
                    value={
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {t("certificateVerification.statusValid")}
                      </span>
                    }
                  />
                  <InfoRow
                    icon={FileCheck}
                    iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    label={t("certificateVerification.certType")}
                    value={t("certificateVerification.certTypeValue")}
                  />
                  <InfoRow
                    icon={Hash}
                    iconClass="bg-slate-500/10 text-slate-600 dark:text-slate-300"
                    label={t("certificateVerification.verificationCode")}
                    value={data.codeVerification}
                    mono
                  />
                </div>
              </div>
            </section>

            <div className="flex items-start gap-3 rounded-2xl border border-sky-500/15 bg-sky-500/[0.06] px-4 py-4 dark:border-sky-400/15 dark:bg-sky-400/10 sm:px-5">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300">
                <Info className="size-4" strokeWidth={1.75} />
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {t("certificateVerification.trustNote")}
              </p>
            </div>
          </div>
        )}

        {isFail && (
          <div className="space-y-8">
            <section className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {t("certificateVerification.titleNotFound")}
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t("certificateVerification.errorDesc")}
                </p>
                <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <ShieldAlert className="size-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("certificateVerification.verifyStatus")}
                    </p>
                    <p className="text-sm font-semibold text-destructive">
                      {t("certificateVerification.statusInvalid")}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() =>
                      document
                        .getElementById("verify-another")
                        ?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                  >
                    <ArrowLeft className="mr-2 size-4" aria-hidden />
                    {t("certificateVerification.tryAgain")}
                  </Button>
                </div>
              </div>
              <VerifyShieldVisual variant="error" />
            </section>
          </div>
        )}

        <div id="verify-another" className="mt-12 sm:mt-16">
          <VerifyAnotherPanel />
        </div>
      </main>

      <Footer />
    </div>
  );
}
