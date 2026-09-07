"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  RefreshCw,
  Download,
  Eye,
  Loader2,
  XCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useAdminConventions,
  useAdminConventionsStats,
  useAdminConventionDetail,
  useApprouverConventionAdmin,
  useExportAdminConventions,
} from "@/lib/queries/useAdminConventions";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

/* Palette sémantique Admin : neutre / warning / primary / success / destructive */
const STATUT_BADGE = {
  BROUILLON:
    "border-border/60 bg-muted/40 text-muted-foreground",
  EN_ATTENTE_VALIDATION:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  EN_ATTENTE_SIGNATURE_STAGIAIRE:
    "border-primary/25 bg-primary/10 text-primary",
  EN_ATTENTE_SIGNATURE_ENTREPRISE:
    "border-primary/25 bg-primary/10 text-primary",
  VALIDEE:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REFUSEE:
    "border-destructive/25 bg-destructive/10 text-destructive",
};

function formatDate(v, tFn) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString(
      (tFn && tFn("adminConventions.localeDate")) || "fr-FR",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Africa/Douala",
      },
    );
  } catch {
    return String(v);
  }
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value ?? "—"}</p>
    </div>
  );
}

function ValidationsDots({ v }) {
  if (!v) return null;
  const doneCls = "text-emerald-600 dark:text-emerald-400 font-semibold";
  const waitCls = "text-muted-foreground";
  return (
    <div className="flex items-center gap-1.5 text-[11px]" title="Validations S/E/P">
      <span className={v.stag ? doneCls : waitCls}>
        S{v.stag ? "✓" : "·"}
      </span>
      <span className={v.ent ? doneCls : waitCls}>
        E{v.ent ? "✓" : "·"}
      </span>
      <span className={v.plat ? doneCls : waitCls}>
        P{v.plat ? "✓" : "·"}
      </span>
      <span className="text-muted-foreground">
        {v.done}/{v.total}
      </span>
    </div>
  );
}

export default function GestionConventionsPage() {
  const { t } = useTranslation();
  function statutLabel(s) {
    if (!s) return "—";
    const key = `adminConventions.statutLabels.${s}`;
    const tr = t(key);
    return tr !== key ? tr : s;
  }
  const reduce = useReducedMotion();
  const token = useAuthStore((s) => s.token);
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("tous");
  const [coherence, setCoherence] = useState("tous");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [selectedId, setSelectedId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const params = useMemo(
    () => ({
      recherche: recherche.trim() || undefined,
      statut,
      coherence,
      page,
      limit,
    }),
    [recherche, statut, coherence, page, limit],
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAdminConventions(params);
  const { data: stats } = useAdminConventionsStats();
  const { data: detail, isLoading: detailLoading } =
    useAdminConventionDetail(selectedId);
  const approuverMut = useApprouverConventionAdmin();
  const { exportRows } = useExportAdminConventions();

  const rows = data?.conventions || [];
  const pagination = data?.pagination;

  async function handleExport() {
    setExporting(true);
    try {
      const res = await exportRows({
        recherche: recherche.trim() || undefined,
        statut,
        coherence,
      });
      const list = res?.conventions || [];
      const headers = [
        t("adminConventions.colCode"),
        t("adminConventions.colStatus"),
        t("adminConventions.colStudent"),
        t("adminConventions.colCompany"),
        t("adminConventions.colInternship"),
        t("adminConventions.colStart"),
        t("adminConventions.colEnd"),
        t("adminConventions.colValidations"),
        t("adminConventions.colCoherence"),
      ];
      const lines = list.map((c) =>
        [
          c.code,
          c.statut,
          c.stagiaire?.nomComplet,
          c.entreprise?.nom,
          c.stage?.code,
          c.stage?.dateDebut,
          c.stage?.dateFinPrevue,
          `${c.validations?.done || 0}/3`,
          c.coherenceOk ? "OK" : "Anomalie",
        ]
          .map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`)
          .join(","),
      );
      const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conventions-admin-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function downloadPdf(id, lang) {
    try {
      const path = `/api/admin/conventions/${id}/pdf?lang=${lang === "en" ? "en" : "fr"}`;
      const r = await fetch(path, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!r.ok) {
        let msg = t("adminConventions.downloadFail");
        try {
          const j = await r.json();
          if (j?.error || j?.message) msg = j.error || j.message;
        } catch {
          /* réponse non JSON (PDF partiel / proxy) */
        }
        throw new Error(msg);
      }
      const blob = await r.blob();
      if (!blob || blob.size < 100) {
        throw new Error(t("adminConventions.pdfInvalid"));
      }
      const obj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = obj;
      a.download = `Convention_${String(id).slice(0, 8)}_V1_${String(lang).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(obj);
    } catch (err) {
      console.error(err);
      if (typeof window !== "undefined") {
        window.alert(err?.message || t("adminConventions.downloadFail"));
      }
    }
  }

  return (
    <>
      <AppHeader
        title={t("adminConventions.title")}
        subtitle={t("adminConventions.subtitle")}
        refreshKeys={["adminConventions", "adminConventionsStats"]}
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isFetching && "animate-spin")} />
            Actualiser
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {exporting ? t("adminConventions.exporting") : t("adminConventions.export")}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label={t("adminConventions.total")} value={stats?.total} />
          <StatCard label={t("adminConventions.pending")} value={stats?.enAttente} />
          <StatCard label={t("adminConventions.partial")} value={stats?.partielles} />
          <StatCard label={t("adminConventions.validated")} value={stats?.validees} />
          <StatCard label={t("adminConventions.refused")} value={stats?.refusees} />
          <StatCard label={t("adminConventions.anomalies")} value={stats?.anomalies} />
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={recherche}
              onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
              placeholder={t("adminConventions.searchPlaceholder")}
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
          <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
            <option value="tous">{t("adminConventions.statusAll")}</option>
            <option value="BROUILLON">{t("adminConventions.statusBrouillon")}</option>
            <option value="EN_ATTENTE_VALIDATION">{t("adminConventions.statusEnAttenteValidation")}</option>
            <option value="EN_ATTENTE_SIGNATURE_STAGIAIRE">{t("adminConventions.statusSignatureStagiaire")}</option>
            <option value="EN_ATTENTE_SIGNATURE_ENTREPRISE">{t("adminConventions.statusSignatureEntreprise")}</option>
            <option value="VALIDEE">{t("adminConventions.statusValidee")}</option>
            <option value="REFUSEE">{t("adminConventions.statusRefusee")}</option>
          </select>
          <select value={coherence} onChange={(e) => { setCoherence(e.target.value); setPage(1); }} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
            <option value="tous">{t("adminConventions.coherenceAll")}</option>
            <option value="ok">{t("adminConventions.coherenceOk")}</option>
            <option value="anomalie">{t("adminConventions.coherenceAnomalie")}</option>
          </select>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setRecherche(""); setStatut("tous"); setCoherence("tous"); setPage(1); }}>
            Réinitialiser
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Chargement des conventions…
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <XCircle className="mx-auto h-6 w-6 text-destructive" />
            <p className="mt-2 text-sm text-destructive">{error?.message || "Impossible de charger les conventions."}</p>
            <Button type="button" size="sm" className="mt-3" onClick={() => refetch()}>Réessayer</Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-14 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">Aucune convention trouvée</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Convention</th>
                    <th className="px-4 py-3 font-medium">{t("adminConventions.colStudent")}</th>
                    <th className="px-4 py-3 font-medium">{t("adminConventions.colCompany")}</th>
                    <th className="px-4 py-3 font-medium">Période</th>
                    <th className="px-4 py-3 font-medium">{t("adminConventions.colStatus")}</th>
                    <th className="px-4 py-3 font-medium">{t("adminConventions.colValidations")}</th>
                    <th className="px-4 py-3 font-medium">Alertes</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.idConvention} className="border-b border-border last:border-0 transition hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold">{c.code}</p>
                        <p className="text-[11px] text-muted-foreground">V{c.version}{c.numeroOffre != null ? ` · OF#${c.numeroOffre}` : ""}</p>
                      </td>
                      <td className="px-4 py-3">{c.stagiaire?.nomComplet}</td>
                      <td className="px-4 py-3">{c.entreprise?.nom}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.stage?.dateDebut, t)} → {formatDate(c.stage?.dateFinPrevue, t)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", STATUT_BADGE[c.statut] || STATUT_BADGE.BROUILLON)}>
                          {c.statutMeta?.label || c.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3"><ValidationsDots v={c.validations} /></td>
                      <td className="px-4 py-3">
                        {c.coherenceOk ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {c.alertes?.length || 1}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(c.idConvention)}>
                          <Eye className="mr-1 h-3.5 w-3.5" />{t("adminConventions.view")}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 lg:hidden">
              {rows.map((c) => (
                <li key={c.idConvention} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="font-mono text-xs font-semibold">{c.code}</p>
                  <p className="mt-1 text-sm font-medium">{c.stagiaire?.nomComplet}</p>
                  <p className="text-xs text-muted-foreground">{c.entreprise?.nom}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(c.stage?.dateDebut, t)} → {formatDate(c.stage?.dateFinPrevue, t)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", STATUT_BADGE[c.statut] || STATUT_BADGE.BROUILLON)}>
                      {c.statutMeta?.label || c.statut}
                    </span>
                    <ValidationsDots v={c.validations} />
                  </div>
                  <Button type="button" size="sm" variant="outline" className="mt-3 w-full" onClick={() => setSelectedId(c.idConvention)}>{t("adminConventions.view")}</Button>
                </li>
              ))}
            </ul>

            {pagination && (
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="h-8 rounded-md border border-border bg-background px-2 text-xs">
                    {[25, 50, 100].map((n) => (<option key={n} value={n}>{n} / page</option>))}
                  </select>
                  <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Préc.</Button>
                  <span className="text-xs tabular-nums">{pagination.page} / {pagination.totalPages}</span>
                  <Button type="button" size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Suiv.</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <button type="button" className="absolute inset-0" aria-label={t("adminConventions.close")} onClick={() => setSelectedId(null)} />
          <motion.aside
            initial={reduce ? false : { x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-border bg-background shadow-xl"
          >
            <div className="border-b border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Convention 360°</p>
              {detailLoading || !detail ? (
                <p className="mt-2 text-sm text-muted-foreground">Chargement…</p>
              ) : (
                <>
                  <h2 className="mt-1 font-mono text-lg font-semibold">{detail.convention.code}</h2>
                  <span className={cn("mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", STATUT_BADGE[detail.convention.statut] || STATUT_BADGE.BROUILLON)}>
                    {detail.convention.statutMeta?.label}
                  </span>
                </>
              )}
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
              {detail && (
                <>
                  <section>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t("adminConventions.partyStudent")}</p>
                    <p className="font-medium">{detail.stagiaire?.nomComplet || "—"}</p>
                  </section>
                  <section>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t("adminConventions.partyCompany")}</p>
                    <p className="font-medium">{detail.entreprise?.nom || "—"}</p>
                  </section>
                  <section>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Stage</p>
                    <p className="font-medium">{detail.stage?.intitulePoste || "—"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(detail.stage?.dateDebut, t)} → {formatDate(detail.stage?.dateFinPrevue, t)}</p>
                    {detail.stage?.idStage && (
                      <Link href={`/gestion-stages/${detail.stage.idStage}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        {t("adminConventions.openFull")} <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </section>
                  <section>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t("adminConventions.validations")}</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>{t("adminConventions.partyStudent")} : {detail.validations?.stag ? `✓ ${t("adminConventions.validatedMark")}` : `— ${t("adminConventions.pendingMark")}`}</li>
                      <li>{t("adminConventions.partyCompany")} : {detail.validations?.ent ? `✓ ${t("adminConventions.validatedMark")}` : `— ${t("adminConventions.pendingMark")}`}</li>
                      <li>{t("adminConventions.partyPlatform")} : {detail.validations?.plat ? `✓ ${t("adminConventions.validatedMark")}` : `— ${t("adminConventions.pendingMark")}`}</li>
                    </ul>
                  </section>
                  <section>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t("adminConventions.coherenceAll")}</p>
                    {detail.coherence?.ok ? (
                      <p className="mt-1 text-xs text-primary">{t("adminConventions.coherenceOkMsg")}</p>
                    ) : (
                      <ul className="mt-1 list-inside list-disc text-xs text-foreground">
                        {(detail.coherence?.alertes || []).map((a) => (<li key={a}>{a}</li>))}
                      </ul>
                    )}
                  </section>
                  {detail.historique?.length > 0 && (
                    <section>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t("adminConventions.history")}</p>
                      <ol className="mt-2 space-y-2 border-l border-border pl-3">
                        {detail.historique.map((h, i) => (
                          <li key={i} className="text-xs">
                            <p className="font-medium">{h.label}</p>
                            <p className="text-muted-foreground">{formatDate(h.date, t)}</p>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t("adminConventions.documents")}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => downloadPdf(selectedId, "fr")}>{t("adminConventions.downloadFr")}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => downloadPdf(selectedId, "en")}>{t("adminConventions.downloadEn")}</Button>
                    </div>
                  </section>
                  {!detail.convention.approuveeParPlateforme && (
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      disabled={approuverMut.isPending}
                      onClick={() => approuverMut.mutate({ id: selectedId, motif: t("adminConventions.approveMotif") })}
                    >
                      {approuverMut.isPending ? t("adminConventions.approving") : t("adminConventions.approvePlatform")}
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="border-t border-border p-3">
              <Button type="button" variant="ghost" className="w-full" onClick={() => setSelectedId(null)}>{t("adminConventions.close")}</Button>
            </div>
          </motion.aside>
        </div>
      )}
    </>
  );
}
