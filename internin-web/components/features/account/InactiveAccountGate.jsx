"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/useTranslation";

export default function InactiveAccountGate() {
  const { t } = useTranslation();

  const availableFeatures = [
    t("account.inactive.available.profile"),
    t("account.inactive.available.settings"),
    t("account.inactive.available.onboarding"),
  ];

  const lockedFeatures = [
    t("account.inactive.locked.offers"),
    t("account.inactive.locked.applications"),
    t("account.inactive.locked.interviews"),
    t("account.inactive.locked.internship"),
  ];

  return (
    <main className="min-h-full bg-gradient-to-br from-background via-background to-muted/40 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl shadow-black/5">
          {/* Header */}
          <div className="relative overflow-hidden border-b border-border/60 px-6 py-8 sm:px-10 sm:py-10">
            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                <ShieldAlert className="h-7 w-7" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {t("account.inactive.badge")}
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {t("account.inactive.title")}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {t("account.inactive.description")}
                </p>
              </div>
            </div>
          </div>

          {/* Activation progress */}
          <div className="border-b border-border/60 px-6 py-6 sm:px-10">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("account.inactive.progressTitle")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("account.inactive.progressDescription")}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                {t("account.inactive.progressStatus")}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 rounded-full bg-primary transition-all duration-500" />
            </div>
          </div>

          {/* Content */}
          <div className="grid gap-6 px-6 py-7 sm:px-10 lg:grid-cols-2">
            {/* Available */}
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {t("account.inactive.availableTitle")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t("account.inactive.availableDescription")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {availableFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2.5 rounded-xl bg-background/70 px-3 py-2.5 text-sm text-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Locked */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <LockKeyhole className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {t("account.inactive.lockedTitle")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t("account.inactive.lockedDescription")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {lockedFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2.5 rounded-xl bg-background/60 px-3 py-2.5 text-sm text-muted-foreground"
                  >
                    <LockKeyhole className="h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserRound className="h-4 w-4" />
              <span>{t("account.inactive.footer")}</span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/profil"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted"
              >
                {t("account.inactive.profileButton")}
              </Link>

              <Link
                href="/onboarding/1"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                {t("account.inactive.activateButton")}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
