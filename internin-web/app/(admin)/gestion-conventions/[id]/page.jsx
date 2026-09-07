"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Circle,
  FileText,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAdminConventionDetail } from "@/lib/queries/useAdminConventions";
import { useAuthStore } from "@/lib/store/useAuthStore";

function formatDate(v, tFn) {
  if (!v) return "—";
  try {
    return new Date(
      typeof v === "string" && v.length <= 10 ? v + "T12:00:00Z" : v,
    ).toLocaleDateString((tFn && tFn("adminConventions.localeDate")) || "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Douala",
    });
  } catch {
    return String(v);
  }
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function ConventionAdminDetailPage({ params }) {
  const { t } = useTranslation();
  const resolved = typeof params?.then === "function" ? use(params) : params;
  const id = resolved?.id;
  const token = useAuthStore((s) => s.token);
  const { data, isLoading, isError, error } = useAdminConventionDetail(id);

  async function downloadPdf(lang) {
    try {
      const res = await fetch(
        `/api/admin/conventions/${id}/pdf?lang=${lang === "en" ? "en" : "fr"}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || j.message || `${t("adminConventions.downloadFail")}`);
      }
      const blob = await res.blob();
      if (!blob || blob.size < 100) {
        throw new Error(`${t("adminConventions.pdfInvalid")}`);
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Convention_${data?.convention?.code || id}_V1_${lang.toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      if (typeof window !== "undefined") {
        window.alert(err?.message || `${t("adminConventions.downloadFail")}`);
      }
    }
  }

  if (isLoading) {
    return (
      <>
        <AppHeader title={t("adminConventions.detailTitle")} subtitle={t("adminConventions.loading")} />
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement…
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <AppHeader title={t("adminConventions.detailTitle")} subtitle={t("adminConventions.notFound")} />
        <div className="space-y-4 px-4 py-5 sm:px-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/gestion-conventions">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <p className="text-sm text-destructive">
            {error?.message || `${t("adminConventions.notFoundMsg")}`}
          </p>
        </div>
      </>
    );
  }

  const { convention, stagiaire, entreprise, stage, coherence, timeline, superviseur } =
    data;
  const v = convention.validations;

  return (
    <>
      <AppHeader
        title={t("adminConventions.detailTitle")}
        subtitle={convention.code}
        refreshKeys={["adminConvention"]}
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/gestion-conventions">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t("adminConventions.back")}
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => downloadPdf("fr")}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {t("adminConventions.downloadFr")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => downloadPdf("en")}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {t("adminConventions.downloadEn")}
            </Button>
            {stage?.idStage && (
              <Button asChild size="sm" className="bg-primary text-primary-foreground">
                <Link href={`/gestion-stages/${stage.idStage}`}>{t("adminConventions.stage360")}</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-primary/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tabular-nums text-primary">
                {convention.code}
              </p>
              <h1 className="mt-1 text-xl font-semibold">
                {stage?.intitulePoste || t("adminConventions.agreementTitle")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("adminConventions.versionCreated", { version: convention.version })}{" "}
                {formatDate(convention.dateCreation, t)}
              </p>
            </div>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {convention.statutLabel}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {convention.statutDescription}
          </p>
        </div>

        {!coherence.ok && (
          <div className="rounded-xl border border-warning/30 bg-accent p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-800" />
              <div>
                <p className="text-sm font-semibold text-accent-foreground">
                  {t("adminConventions.anomalyCount", { n: coherence.issues.length })}
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-accent-foreground/90">
                  {coherence.issues.map((i) => (
                    <li key={i.code}>{i.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Section title={t("adminConventions.partyStudent")}>
            <p className="font-medium">
              {stagiaire?.prenom} {stagiaire?.nom}
            </p>
            <p className="text-xs text-muted-foreground">{stagiaire?.email}</p>
          </Section>
          <Section title={t("adminConventions.partyCompany")}>
            <p className="font-medium">{entreprise?.nom}</p>
            <p className="text-xs text-muted-foreground">{entreprise?.ville}</p>
            {superviseur && (
              <p className="mt-2 text-xs text-muted-foreground">
                Superviseur : {superviseur.nom}
                {superviseur.fonction ? ` — ${superviseur.fonction}` : ""}
              </p>
            )}
          </Section>
          <Section title={t("adminConventions.internship")}>
            <p className="font-medium">{stage?.intitulePoste || "—"}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(stage?.dateDebut, t)} → {formatDate(stage?.dateFinPrevue, t)}
            </p>
            {stage?.code && (
              <p className="mt-1 text-xs font-mono text-muted-foreground">
                {stage.code}
              </p>
            )}
          </Section>
          <Section title={t("adminConventions.validations")}>
            <ul className="space-y-2 text-sm">
              {[
                ["Entreprise", v?.ent, v?.dateEntreprise],
                ["Stagiaire", v?.stag, v?.dateStagiaire],
                ["Plateforme", v?.plat, null],
              ].map(([label, ok, date]) => (
                <li key={label} className="flex items-center gap-2">
                  {ok ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>
                    {label}
                    {ok && date ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({formatDate(date, t)})
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              {v?.done}/{v?.total} validations
            </p>
          </Section>
        </div>

        <Section title={t("adminConventions.documents")}>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => downloadPdf("fr")}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Convention FR
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => downloadPdf("en")}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Convention EN
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Générés à la demande à partir des mêmes données dynamiques.
          </p>
        </Section>

        <Section title={t("adminConventions.timeline")}>
          <ol className="relative ml-2 space-y-0 border-l border-border">
            {(timeline || []).map((ev) => (
              <li key={ev.id} className="relative pb-4 pl-4 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background",
                    ev.done ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
                <p className="text-sm font-medium">{ev.label}</p>
                {ev.date && (
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(ev.date, t)}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </>
  );
}
