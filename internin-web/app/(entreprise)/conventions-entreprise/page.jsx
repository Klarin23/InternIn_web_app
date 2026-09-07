"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FileText,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PenLine,
  Eye,
  Loader2,
  XCircle,
  Filter,
} from "lucide-react";
import {
  useConventionsEntreprise,
  useStatsConventionsEntreprise,
  useActionsRequisesConventions,
} from "@/lib/queries/useConventionsEntreprise";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AppHeader from "@/components/layout/AppHeader";

const FILTRES = [
  { id: "toutes", labelKey: "entrepriseSpace.conventions.filters.all" },
  { id: "a_completer", labelKey: "entrepriseSpace.conventions.filters.toComplete" },
  { id: "a_valider", labelKey: "entrepriseSpace.conventions.filters.toValidate" },
  { id: "a_corriger", labelKey: "entrepriseSpace.conventions.filters.toCorrect" },
  { id: "a_signer", labelKey: "entrepriseSpace.conventions.filters.toSign" },
  { id: "finalisees", labelKey: "entrepriseSpace.conventions.filters.finalized" },
  { id: "annulees", labelKey: "entrepriseSpace.conventions.filters.cancelled" },
];

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
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Douala",
    });
  } catch {
    return String(value);
  }
}

function StatCard({ label, value, accent, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className={cn(
        "rounded-md border border-border bg-card p-4 shadow-sm",
        accent,
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value ?? "—"}</p>
    </motion.div>
  );
}

function StatusBadge({ statut, label }) {
  const ui = STATUS_UI[statut] || STATUS_UI.BROUILLON;
  const Icon = ui.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        ui.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label || statut}
    </span>
  );
}

export default function ConventionsEntreprisePage() {
  const { t, locale } = useTranslation();
  const [filtre, setFiltre] = useState("toutes");
  const [recherche, setRecherche] = useState("");
  const [rechercheDebounced, setRechercheDebounced] = useState("");
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => setRechercheDebounced(recherche), 300);
    return () => clearTimeout(t);
  }, [recherche]);

  const params = useMemo(
    () => ({
      statut: filtre === "toutes" ? undefined : filtre,
      recherche: rechercheDebounced || undefined,
    }),
    [filtre, rechercheDebounced],
  );

  const { data, isLoading, isError, error } = useConventionsEntreprise(params);
  const { data: stats, isLoading: statsLoading } =
    useStatsConventionsEntreprise();
  const { data: actionsData } = useActionsRequisesConventions();

  const conventions = data?.conventions || [];
  const actions = actionsData?.actions || [];

  return (
    <>
      <AppHeader
        title={t("entrepriseSpace.conventions.page.title")}
        subtitle={t("entrepriseSpace.conventions.page.subtitle")}
      />
      <div className="w-full space-y-5 px-4 py-5 sm:px-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t("entrepriseSpace.conventions.stats.total")} value={statsLoading ? "…" : stats?.total ?? 0} delay={0} />
        <StatCard
          label={t("entrepriseSpace.conventions.stats.toComplete")}
          value={statsLoading ? "…" : stats?.aCompleter ?? 0}
          accent="border-amber-500/20"
          delay={0.03}
        />
        <StatCard
          label={t("entrepriseSpace.conventions.stats.toValidate")}
          value={statsLoading ? "…" : stats?.aValider ?? 0}
          accent="border-amber-500/20"
          delay={0.06}
        />
        <StatCard
          label={t("entrepriseSpace.conventions.stats.toSign")}
          value={statsLoading ? "…" : stats?.aSigner ?? 0}
          accent="border-violet-500/20"
          delay={0.09}
        />
        <StatCard
          label={t("entrepriseSpace.conventions.stats.finalized")}
          value={statsLoading ? "…" : stats?.finalisees ?? 0}
          accent="border-emerald-500/20"
          delay={0.12}
        />
      </div>

      {/* {t("entrepriseSpace.conventions.actions.required")} */}
      {actions.length > 0 && (
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-amber-500/25 bg-amber-500/5 p-4 sm:p-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
            <h2 className="text-sm font-semibold">
              {t("entrepriseSpace.conventions.actions.required")}
              <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800">
                {actions.length}
              </span>
            </h2>
          </div>
          <ul className="space-y-2">
            {actions.slice(0, 5).map((a) => (
              <li
                key={`${a.idConvention}-${a.type}`}
                className="flex flex-col gap-2 rounded-md border border-border bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {t("entrepriseSpace.conventions.actions.conventionOf", { name: a.stagiaireNom })}
                  </p>
                  <p className="text-xs text-muted-foreground">{t(`entrepriseSpace.conventions.actionMotifs.${a.type}`, { defaultValue: a.motif })}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href={`/conventions-entreprise/${a.idConvention}`}>
                    {t(`entrepriseSpace.conventions.actionLabels.${a.type}`, { defaultValue: a.labelAction })}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* Filtres + recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={t("entrepriseSpace.conventions.filters.searchPlaceholder")}
            aria-label={t("entrepriseSpace.conventions.filters.searchAria")}
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="mr-1 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden />
          {FILTRES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltre(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filtre === f.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50",
              )}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t("entrepriseSpace.conventions.page.loading")}
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {error?.message || t("entrepriseSpace.conventions.page.loadError")}
        </div>
      ) : conventions.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card/50 px-6 py-14 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium">{t("entrepriseSpace.conventions.page.emptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("entrepriseSpace.conventions.page.emptyDesc")}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-md border border-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("entrepriseSpace.conventions.table.intern")}</th>
                  <th className="px-4 py-3 font-medium">{t("entrepriseSpace.conventions.table.internship")}</th>
                  <th className="px-4 py-3 font-medium">{t("entrepriseSpace.conventions.table.period")}</th>
                  <th className="px-4 py-3 font-medium">{t("entrepriseSpace.conventions.table.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("entrepriseSpace.conventions.table.modified")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("entrepriseSpace.conventions.table.action")}</th>
                </tr>
              </thead>
              <tbody>
                {conventions.map((c, i) => (
                  <motion.tr
                    key={c.idConvention}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2) }}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 font-medium">
                      {c.stagiaire?.nomComplet || "—"}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-muted-foreground">
                      {c.stage?.intitulePoste || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(c.stage?.dateDebut, locale)}
                      {c.stage?.dateFinPrevue
                        ? ` → ${formatDate(c.stage.dateFinPrevue, locale)}`
                        : ""}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        statut={c.statut}
                        label={t(`entrepriseSpace.conventions.status.${c.statut}.label`) || c.statutMeta?.label}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(c.derniereModification, locale)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/conventions-entreprise/${c.idConvention}`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          {t("entrepriseSpace.conventions.actions.view")}
                        </Link>
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {conventions.map((c) => (
              <li
                key={c.idConvention}
                className="rounded-md border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.stagiaire?.nomComplet}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.stage?.intitulePoste}
                    </p>
                  </div>
                  <StatusBadge statut={c.statut} label={t(`entrepriseSpace.conventions.status.${c.statut}.label`) || c.statutMeta?.label} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDate(c.stage?.dateDebut, locale)}
                  {c.stage?.dateFinPrevue
                    ? ` → ${formatDate(c.stage.dateFinPrevue, locale)}`
                    : ""}
                </p>
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/conventions-entreprise/${c.idConvention}`}>
                      {t("entrepriseSpace.conventions.actions.viewAgreement")}
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      </div>
    </>
  );
}