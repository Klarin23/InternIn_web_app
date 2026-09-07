"use client";

import AppHeader from "@/components/layout/AppHeader";
import { use } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  User,
  FileText,
  Target,
  CheckCircle2,
  Circle,
  Loader2,
  Calendar,
  Shield,
  Activity,
  ClipboardList,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { useStageSupervisionDetail } from "@/lib/queries/useSupervisionStages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUT_STYLE = {
  a_venir: "border-info/25 bg-info/5 text-info",
  actif: "border-success/25 bg-success/5 text-success",
  termine: "bg-muted text-muted-foreground border-border",
  interrompu: "border-destructive/25 bg-destructive/5 text-destructive",
};
const STATUT_LABEL_KEYS = {
  a_venir: "adminStages.statusAVenir",
  actif: "adminStages.statusActif",
  termine: "adminStages.statusTermine",
  interrompu: "adminStages.statusInterrompu",
};
const ALERTE_STYLE = {
  critique: "border-destructive/25 bg-destructive/5 text-destructive",
  important: "border-warning/25 bg-warning/5 text-warning",
  attention: "border-secondary-foreground/20 bg-secondary text-secondary-foreground",
  information: "border-info/25 bg-info/5 text-info",
};

/* Palette par section du dossier — l'icône et le titre de chaque bloc
   prennent la couleur du contexte (succès, alerte, information…), sans
   décoration supplémentaire, pour rester lisible et sobre. */
const TONE_STYLES = {
  primary: { iconBg: "bg-primary/10 text-primary", text: "text-primary" },
  success: { iconBg: "bg-success/10 text-success", text: "text-success" },
  warning: { iconBg: "bg-warning/10 text-warning", text: "text-warning" },
  info: { iconBg: "bg-info/10 text-info", text: "text-info" },
  destructive: { iconBg: "bg-destructive/10 text-destructive", text: "text-destructive" },
  secondary: { iconBg: "bg-secondary text-secondary-foreground", text: "text-secondary-foreground" },
  muted: { iconBg: "bg-muted text-muted-foreground", text: "text-foreground" },
};

const NAV_DEFS = [
  { id: "identite", labelKey: "adminStages.tabIdentity" },
  { id: "convention", labelKey: "adminStages.tabConvention" },
  { id: "objectifs", labelKey: "adminStages.tabObjectives" },
  { id: "activites", labelKey: "adminStages.tabActivities" },
  { id: "evaluations", labelKey: "adminStages.tabEvaluations" },
  { id: "timeline", labelKey: "adminStages.tabJourney" },
  { id: "anomalies", labelKey: "adminStages.tabAnomalies" },
  { id: "audit", labelKey: "adminStages.tabAudit" },
];

function formatDate(v, tFn) {
  if (!v) return "—";
  try {
    const d = new Date(
      typeof v === "string" && v.length <= 10 ? v + "T12:00:00Z" : v,
    );
    return d.toLocaleDateString((tFn && tFn("adminStages.localeDate")) || "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Douala",
    });
  } catch {
    return String(v);
  }
}

function Section({ id, title, icon: Icon, children, tone = "primary" }) {
  const th = TONE_STYLES[tone] || TONE_STYLES.primary;

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <h2 className={cn("mb-3 flex items-center gap-2 text-sm font-semibold", th.text)}>
        {Icon && (
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              th.iconBg,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}

function HealthItem({ ok, label, detail }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2",
        ok ? "border-success/20 bg-success/5" : "border-warning/25 bg-warning/5",
      )}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        {detail && (
          <p className="text-xs text-muted-foreground">{detail}</p>
        )}
      </div>
    </div>
  );
}

export default function Stage360Page({ params }) {
  const { t } = useTranslation();
  const NAV = NAV_DEFS.map((s) => ({ ...s, label: t(s.labelKey) }));
  const resolved = typeof params?.then === "function" ? use(params) : params;
  const id = resolved?.id;
  const reduce = useReducedMotion();

  const { data, isLoading, isError, error, refetch, isFetching } =
    useStageSupervisionDetail(id);

  if (isLoading) {
    return (
      <>
        <AppHeader title={t("adminStages.detailTitle")} subtitle={t("adminStages.loading")} />
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t("adminStages.loadingDossier")}
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <AppHeader title={t("adminStages.detailTitle")} subtitle={t("adminStages.notFound")} />
        <div className="space-y-4 px-4 py-5 sm:px-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/gestion-stages">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t("adminStages.back")}
            </Link>
          </Button>
          <p className="text-sm text-destructive">
            {error?.message || t("adminStages.stageNotFound")}
          </p>
          <Button type="button" size="sm" onClick={() => refetch()}>
            {t("adminStages.retry")}
          </Button>
        </div>
      </>
    );
  }

  const {
    stage,
    progression,
    alertes = [],
    stagiaire,
    entreprise,
    universite,
    superviseur,
    convention,
    objectifs = [],
    taches,
    tachesListe = [],
    journal = [],
    evaluations = [],
    timeline = [],
    audit = [],
  } = data;

  const convOk =
    convention?.accepteeParStagiaire &&
    convention?.accepteeParEntreprise &&
    convention?.approuveeParPlateforme;

  return (
    <>
      <AppHeader
        title={t("adminStages.detailTitle")}
        subtitle={stage?.code || t("adminStages.adminFile")}
        refreshKeys={["adminStageSupervision"]}
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/gestion-stages">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t("adminStages.backToList")}
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            {convention?.idConvention && (
              <Button asChild size="sm" variant="outline">
                <Link href="/gestion-conventions">
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Conventions
                </Link>
              </Button>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href="/journal-audit">{t("adminStages.tabAudit")}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/centre-controle">{t("adminStages.controlCenter") || "Control center"}</Link>
            </Button>
          </div>
        </div>

        {/* Header dossier */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold text-primary">
                {stage.code}
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight">
                {stage.intitulePoste || t("adminStages.stageLabel")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {stagiaire?.prenom} {stagiaire?.nom}
                {entreprise?.nom ? ` · ${entreprise.nom}` : ""}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(stage.dateDebut, t)} → {formatDate(stage.dateFinPrevue, t)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                  STATUT_STYLE[stage.statut] || STATUT_STYLE.a_venir,
                )}
              >
                {(STATUT_LABEL_KEYS[stage.statut] ? t(STATUT_LABEL_KEYS[stage.statut]) : stage.statut) || stage.statut}
              </span>
              {progression?.percent != null && (
                <div className="text-right">
                  <p className="text-2xl font-semibold tabular-nums text-primary">
                    {progression?.percent ?? 0}%
                  </p>
                  <p className="text-[11px] text-muted-foreground">Progression</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Nav interne */}
        <nav className="flex gap-1 overflow-x-auto pb-1">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Santé */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <HealthItem
            ok={!!convOk}
            label={t("adminStages.tabConvention")}
            detail={
              convOk
                ? t("adminStages.validatedFull")
                : `${t("adminStages.pending")} · S${convention?.accepteeParStagiaire ? "✓" : "·"} E${convention?.accepteeParEntreprise ? "✓" : "·"} P${convention?.approuveeParPlateforme ? "✓" : "·"}`
            }
          />
          <HealthItem
            ok={objectifs.length > 0}
            label={t("adminStages.tabObjectives")}
            detail={
              objectifs.length
                ? `${objectifs.filter((o) => o.statut === "realise").length}/${objectifs.length} ${t("adminStages.completedCount") || "done"}`
                : t("adminStages.noObjective")
            }
          />
          <HealthItem
            ok={(taches?.terminees || 0) + (journal?.length || 0) > 0}
            label={t("adminStages.tabActivities")}
            detail={
              journal[0]
                ? `${t("adminStages.lastActivityPrefix", { date: formatDate(journal[0].dateActivite || journal[0].dateCreation, t) })}`
                : t("adminStages.noActivity")
            }
          />
          <HealthItem
            ok={!alertes.length}
            label={t("adminStages.anomaliesTitle")}
            detail={
              alertes.length
                ? `${alertes.length} alerte(s)`
                : t("adminStages.noAnomaly")
            }
          />
        </div>

        {/* Identité 3 cartes */}
        <div id="identite" className="grid scroll-mt-24 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-primary">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                <User className="h-3.5 w-3.5" />
              </span>
              {t("adminStages.partyStudent")}
            </p>
            <p className="truncate font-semibold">
              {stagiaire?.prenom} {stagiaire?.nom}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {stagiaire?.email || "—"}
            </p>
            {stagiaire?.telephone && (
              <p className="text-xs text-muted-foreground">
                {stagiaire.telephone}
              </p>
            )}
            {universite?.nom && (
              <p className="mt-2 text-xs text-muted-foreground">
                {universite.nom}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-secondary-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Building2 className="h-3.5 w-3.5" />
              </span>
              {t("adminStages.partyCompany")}</p>
            <p className="truncate font-semibold">{entreprise?.nom || "—"}</p>
            {entreprise?.ville && (
              <p className="text-xs text-muted-foreground">{entreprise.ville}</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-success">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-success/10 text-success">
                <Shield className="h-3.5 w-3.5" />
              </span>
              {t("adminStages.partySupervision")}
            </p>
            {superviseur ? (
              <>
                <p className="truncate font-semibold">{superviseur.nom}</p>
                <p className="text-xs text-muted-foreground">
                  {superviseur.fonction || t("adminStages.supervisor")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {superviseur.email || "—"}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("adminStages.noSupervisor")}
              </p>
            )}
          </div>
        </div>

        <Section id="convention" title={t("adminStages.conventionTitle")} icon={FileText} tone="info">
          {convention ? (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-3">
                <span className="font-mono text-xs">
                  {convention.idConvention?.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("adminStages.statusPrefix", { status: convention.statut || "—" })}
                </span>
              </div>
              <ul className="grid gap-1 text-xs sm:grid-cols-3">
                <li className={convention.accepteeParStagiaire ? "text-success" : "text-muted-foreground"}>
                  {t("adminStages.partyStudent")} :{" "}
                  {convention.accepteeParStagiaire ? `✓ ${t("adminStages.validated")}` : `— ${t("adminStages.pending")}`}
                </li>
                <li className={convention.accepteeParEntreprise ? "text-success" : "text-muted-foreground"}>
                  {t("adminStages.partyCompany")} :{" "}
                  {convention.accepteeParEntreprise
                    ? `✓ ${t("adminStages.validated")}`
                    : `— ${t("adminStages.pending")}`}
                </li>
                <li className={convention.approuveeParPlateforme ? "text-success" : "text-muted-foreground"}>
                  {t("adminStages.partyPlatform")} :{" "}
                  {convention.approuveeParPlateforme
                    ? `✓ ${t("adminStages.validated")}`
                    : `— ${t("adminStages.pending")}`}
                </li>
              </ul>
              <Button asChild size="sm" variant="outline">
                <Link href="/gestion-conventions">
                  {t("adminStages.viewConventions")} <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("adminStages.noConvention")}
            </p>
          )}
        </Section>

        <Section id="objectifs" title={t("adminStages.tabObjectives")} icon={Target} tone="success">
          {!objectifs.length ? (
            <p className="text-sm text-muted-foreground">
              {t("adminStages.noObjective")}.
            </p>
          ) : (
            <ul className="space-y-2">
              {objectifs.map((o) => (
                <li
                  key={o.idObjectif}
                  className="flex items-start justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <p className="min-w-0 flex-1">{o.description}</p>
                  <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                    {o.statut}
                    {o.percent != null ? ` · ${o.percent}%` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section id="activites" title={t("adminStages.activitiesTitle")} icon={Activity} tone="warning">
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{t("adminStages.tasks", { n: taches?.total ?? 0 })}</span>
            <span>{t("adminStages.tasksDone", { n: taches?.terminees ?? 0 })}</span>
            <span>{t("adminStages.journalEntries", { n: journal.length })}</span>
          </div>
          {!journal.length && !tachesListe.length ? (
            <p className="text-sm text-muted-foreground">
              {t("adminStages.noActivityRecorded")}
            </p>
          ) : (
            <ul className="space-y-2">
              {journal.slice(0, 10).map((j) => (
                <li
                  key={j.idEntree}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <p className="font-medium">{j.titre}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {j.description}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDate(j.dateActivite || j.dateCreation, t)} ·{" "}
                    {j.statut || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          id="evaluations"
          title={t("adminStages.evaluationsTitle")}
          icon={ClipboardList}
          tone="secondary"
        >
          {!evaluations.length ? (
            <p className="text-sm text-muted-foreground">
              {t("adminStages.noEvaluation")}
            </p>
          ) : (
            <ul className="space-y-2">
              {evaluations.map((e) => (
                <li
                  key={e.idEvaluation}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span>{t("adminStages.weekLabel", { n: e.numeroSemaine })}</span>
                  <span className="text-xs text-muted-foreground">
                    {e.statut}
                    {e.dateSoumission
                      ? ` · ${formatDate(e.dateSoumission, t)}`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section id="timeline" title={t("adminStages.journeyTitle")} icon={Calendar}>
          <ol className="relative space-y-3 border-l border-border pl-4">
            {timeline.map((ev) => (
              <li key={ev.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[1.3rem] top-1 flex h-4 w-4 items-center justify-center rounded-full border bg-card",
                    ev.done
                      ? "border-success text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {ev.done ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Circle className="h-2.5 w-2.5" />
                  )}
                </span>
                <p className="text-sm font-medium">
                  {t(`adminStages.timeline.${ev.id}`) !== `adminStages.timeline.${ev.id}`
                    ? t(`adminStages.timeline.${ev.id}`)
                    : ev.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(ev.date, t)}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="anomalies"
          title={t("adminStages.anomaliesTitle")}
          icon={AlertTriangle}
          tone="destructive"
        >
          {!alertes.length ? (
            <p className="text-sm text-muted-foreground">
              {t("adminStages.noAnomalyDetected")}
            </p>
          ) : (
            <ul className="space-y-2">
              {alertes.map((a, i) => (
                <li
                  key={i}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    ALERTE_STYLE[a.niveau] || ALERTE_STYLE.attention,
                  )}
                >
                  <p className="font-medium">{a.titre || a.message || a.type}</p>
                  {a.message && a.titre && (
                    <p className="text-xs opacity-90">{a.message}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link href="/centre-controle">{t("adminStages.openControlCenter") || "Open control center"}</Link>
          </Button>
        </Section>

        <Section id="audit" title={t("adminStages.auditTitle")} icon={BookOpen} tone="muted">
          {!audit.length ? (
            <p className="text-sm text-muted-foreground">
              {t("adminStages.noAudit")}
            </p>
          ) : (
            <ul className="space-y-2">
              {audit.map((a) => (
                <li
                  key={a.idJournal}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <p className="font-medium">{a.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.typeEntite}
                    {a.motif ? ` · ${a.motif}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(a.dateCreation, t)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link href="/journal-audit">{t("adminStages.viewAuditLog")}</Link>
          </Button>
        </Section>
      </div>
    </>
  );
}
