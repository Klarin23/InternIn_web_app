"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Shield, X, ChevronRight, Loader2 } from "lucide-react";
import {
  useSecurityOverview,
  useComptesARisque,
  useRevokeUserSessions,
} from "@/lib/queries/useSecurityCentre";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  securityAlertFingerprint,
  isSecurityAlertAcknowledged,
  acknowledgeSecurityAlert,
  subscribeSecurityAlertAck,
  getSecurityAlertAckRevision,
} from "@/lib/admin/securityAlertAck";

function useAckRevision() {
  return useSyncExternalStore(
    subscribeSecurityAlertAck,
    getSecurityAlertAckRevision,
    () => 0,
  );
}

function formatRelative(iso, t) {
  if (!iso) return "";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return t("securityAlert.secsAgo", { n: sec });
  const min = Math.floor(sec / 60);
  if (min < 60) return t("securityAlert.minsAgo", { n: min });
  return new Date(iso).toLocaleString();
}

/**
 * Bannière globale Admin — visible hors /centre-securite tant que
 * l'état n'est pas « securisee » et non acknowledged pour ce fingerprint.
 */
export default function SecurityAlertBanner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const userId = user?.idUtilisateur || user?.id || user?.email;

  const { data: overview } = useSecurityOverview({ refetchInterval: 60_000 });
  const { data: risques } = useComptesARisque();
  const revokeUserMut = useRevokeUserSessions();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [pulse, setPulse] = useState(true);
  const ackRev = useAckRevision();

  const etat = overview?.etat;
  const isCritique = etat === "critique";
  const isAttention = etat === "attention";
  const hasAlert = isCritique || isAttention;

  const fingerprint = useMemo(
    () => securityAlertFingerprint(overview),
    [overview],
  );

  const acknowledged = useMemo(() => {
    void ackRev;
    return isSecurityAlertAcknowledged(userId, fingerprint);
  }, [userId, fingerprint, ackRev]);

  // Pulsation courte à l'apparition d'une nouvelle alerte
  useEffect(() => {
    if (!hasAlert || acknowledged) return;
    setPulse(true);
    const id = setTimeout(() => setPulse(false), 2400);
    return () => clearTimeout(id);
  }, [fingerprint, hasAlert, acknowledged]);

  // Ne pas afficher sur la page centre-sécurité (détail déjà là)
  // ni si securisee ou acknowledged
  if (!hasAlert || acknowledged) return null;
  if (pathname?.startsWith("/centre-securite")) return null;

  const criticalList = (Array.isArray(risques) ? risques : []).filter(
    (c) => c.niveau === "critique" || (c.score ?? 0) >= 60,
  );
  const warningList = (Array.isArray(risques) ? risques : []).filter(
    (c) =>
      !(c.niveau === "critique" || (c.score ?? 0) >= 60) &&
      (c.niveau === "important" || (c.score ?? 0) >= 30),
  );
  const criticalCount =
    overview?.kpi?.comptesSuspectsCritiques ?? criticalList.length;
  const multi = criticalCount > 1;

  const title = isCritique
    ? multi
      ? t("securityAlert.bannerTitleMulti", { n: criticalCount })
      : t("securityAlert.bannerTitleCritical")
    : t("securityAlert.bannerTitleAttention");

  const message =
    overview?.etatMessage ||
    (isCritique
      ? t("securityAlert.bannerMsgCritical")
      : t("securityAlert.bannerMsgAttention"));

  function handleAck() {
    acknowledgeSecurityAlert(userId, fingerprint);
    setDrawerOpen(false);
  }

  const selected =
    (Array.isArray(risques) ? risques : []).find(
      (c) => c.idUtilisateur === selectedId,
    ) || criticalList[0] || (Array.isArray(risques) ? risques[0] : null);

  return (
    <>
      <motion.div
        role="alert"
        aria-live="assertive"
        initial={reduce ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-[#E5E7EB] bg-white dark:border-border dark:bg-card"
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="relative mt-1.5 flex h-2 w-2 shrink-0">
              {pulse && !reduce && (
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                    isCritique ? "bg-red-500" : "bg-amber-500",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  isCritique ? "bg-red-500" : "bg-amber-500",
                )}
              />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111827] dark:text-foreground">
                {title}
              </p>
              <p className="text-xs text-[#6B7280] dark:text-muted-foreground">
                {message}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedId(criticalList[0]?.idUtilisateur || null);
                setDrawerOpen(true);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1.5 text-xs font-semibold text-[#111827] transition hover:bg-white dark:border-border dark:bg-muted dark:text-foreground"
            >
              {t("securityAlert.investigate")}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <Link
              href="/centre-securite"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#14B8A6] hover:underline"
            >
              {t("securityAlert.openCenter")}
            </Link>
            <button
              type="button"
              onClick={handleAck}
              className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F7F8FA] hover:text-[#111827] dark:hover:bg-muted dark:hover:text-foreground"
              aria-label={t("securityAlert.acknowledge")}
              title={t("securityAlert.acknowledge")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Incident drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
              aria-label={t("securityAlert.close")}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#E5E7EB] bg-white shadow-xl dark:border-border dark:bg-card"
              initial={reduce ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4 dark:border-border">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                    {t("securityAlert.drawerTitle")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#111827] dark:text-foreground">
                    {isCritique
                      ? t("securityAlert.criticalEvents", {
                          n: Math.max(criticalCount, criticalList.length, 1),
                        })
                      : t("securityAlert.attentionEvents")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F7F8FA] dark:hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Stack list */}
                <ul className="divide-y divide-[#E5E7EB] dark:divide-border">
                  {(criticalList.length
                    ? criticalList
                    : Array.isArray(risques)
                      ? risques.slice(0, 8)
                      : []
                  ).map((c) => {
                    const isCrit =
                      c.niveau === "critique" || (c.score ?? 0) >= 60;
                    const active = selectedId === c.idUtilisateur;
                    return (
                      <li key={c.idUtilisateur}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(c.idUtilisateur)}
                          className={cn(
                            "flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors",
                            active
                              ? "bg-[#F7F8FA] dark:bg-muted/40"
                              : "hover:bg-[#F7F8FA]/80 dark:hover:bg-muted/30",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              isCrit ? "bg-red-500" : "bg-amber-500",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                              {isCrit
                                ? t("securityAlert.critical")
                                : t("securityAlert.important")}
                            </p>
                            <p className="truncate text-sm font-medium text-[#111827] dark:text-foreground">
                              {c.email}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[#6B7280] dark:text-muted-foreground">
                              {[
                                c.sessionsActives != null
                                  ? `${c.sessionsActives} ${t("securityAlert.sessions")}`
                                  : null,
                                c.ipsDistinctes7j != null
                                  ? `${c.ipsDistinctes7j} IP`
                                  : null,
                                c.score != null
                                  ? `${t("securityAlert.score")} ${c.score}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#9CA3AF]" />
                        </button>
                      </li>
                    );
                  })}
                  {!risques?.length && (
                    <li className="px-5 py-6 text-sm text-[#6B7280]">
                      {overview?.etatMessage || t("securityAlert.noAccounts")}
                    </li>
                  )}
                </ul>

                {/* Detail of selected */}
                {selected && (
                  <div className="border-t border-[#E5E7EB] px-5 py-4 dark:border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                      {t("securityAlert.affectedAccount")}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#111827] dark:text-foreground">
                      {selected.email}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {selected.typeUtilisateur}
                      {selected.score != null
                        ? ` · ${t("securityAlert.score")} ${selected.score}/100`
                        : ""}
                    </p>

                    {(selected.motif ||
                      (selected.signaux || []).length > 0) && (
                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                          {t("securityAlert.whatHappened")}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#6B7280] dark:text-muted-foreground">
                          {selected.motif ||
                            (selected.signaux || [])
                              .map((s) => s.label)
                              .join(" · ")}
                        </p>
                      </div>
                    )}

                    {Array.isArray(selected.connexions) &&
                      selected.connexions.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                            {t("securityAlert.timeline")}
                          </p>
                          <ul className="mt-2 space-y-2">
                            {selected.connexions.slice(0, 5).map((cx, i) => (
                              <li
                                key={`${cx.adresseIp}-${i}`}
                                className="flex gap-2 text-xs text-[#6B7280]"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#14B8A6]" />
                                <span>
                                  {cx.dateConnexion
                                    ? formatRelative(cx.dateConnexion, t)
                                    : "—"}
                                  {cx.adresseIp ? ` · ${cx.adresseIp}` : ""}
                                  {cx.ville ? ` · ${cx.ville}` : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    <div className="mt-5 flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={revokeUserMut.isPending || !selected.idUtilisateur}
                        onClick={() => {
                          if (
                            confirm(
                              t("securityAlert.confirmRevoke", {
                                email: selected.email,
                              }),
                            )
                          ) {
                            revokeUserMut.mutate(selected.idUtilisateur);
                          }
                        }}
                      >
                        {revokeUserMut.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        {t("securityAlert.revokeSessions")}
                      </Button>
                      <Button
                        asChild
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[#E5E7EB]"
                      >
                        <Link
                          href={`/utilisateurs?id=${selected.idUtilisateur}`}
                        >
                          {t("securityAlert.viewUser")}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[#E5E7EB]"
                      >
                        <Link href="/centre-securite">
                          {t("securityAlert.openCenter")}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        type="button"
                        variant="ghost"
                        size="sm"
                      >
                        <Link href="/journal-audit">
                          {t("securityAlert.viewAudit")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#E5E7EB] p-3 dark:border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-[#E5E7EB]"
                  onClick={handleAck}
                >
                  {t("securityAlert.markAcknowledged")}
                </Button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Indicateur compact pour le header admin (popover).
 */
export function SecurityHeaderIndicator() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const { data: overview } = useSecurityOverview({ refetchInterval: 60_000 });
  const { data: risques } = useComptesARisque();

  if (user?.typeUtilisateur !== "administrateur") return null;

  const etat = overview?.etat;
  if (!etat || etat === "securisee") return null;

  const isCritique = etat === "critique";
  const criticalCount =
    overview?.kpi?.comptesSuspectsCritiques ??
    (Array.isArray(risques)
      ? risques.filter((c) => c.niveau === "critique" || (c.score ?? 0) >= 60)
          .length
      : 0);
  const warnCount =
    overview?.kpi?.comptesSuspects ??
    (Array.isArray(risques) ? risques.length : 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
        aria-label={t("securityAlert.headerAria")}
        aria-expanded={open}
      >
        <Shield className="h-4.5 w-4.5 h-4 w-4" />
        <span
          className={cn(
            "absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-card",
            isCritique ? "bg-red-500" : "bg-amber-500",
          )}
        />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label={t("securityAlert.close")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg dark:border-border dark:bg-card">
            <div className="border-b border-[#E5E7EB] px-4 py-3 dark:border-border">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                {t("securityAlert.popoverTitle")}
              </p>
              <p className="mt-1 text-sm text-[#111827] dark:text-foreground">
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {criticalCount} {t("securityAlert.critical")}
                </span>
                {warnCount > 0 && (
                  <>
                    {" · "}
                    <span className="text-amber-600 dark:text-amber-400">
                      {warnCount} {t("securityAlert.warnings")}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {(Array.isArray(risques) ? risques.slice(0, 5) : []).map((c) => (
                <Link
                  key={c.idUtilisateur}
                  href="/centre-securite"
                  onClick={() => setOpen(false)}
                  className="block border-b border-[#E5E7EB] px-4 py-2.5 last:border-0 hover:bg-[#F7F8FA] dark:border-border dark:hover:bg-muted/40"
                >
                  <p className="truncate text-xs font-medium text-[#111827] dark:text-foreground">
                    {c.email}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    {c.niveau || "—"}
                    {c.score != null ? ` · ${c.score}` : ""}
                  </p>
                </Link>
              ))}
              {!risques?.length && (
                <p className="px-4 py-3 text-xs text-[#6B7280]">
                  {overview?.etatMessage}
                </p>
              )}
            </div>
            <div className="border-t border-[#E5E7EB] p-2 dark:border-border">
              <Link
                href="/centre-securite"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-[#14B8A6] hover:bg-[#F7F8FA] dark:hover:bg-muted"
              >
                {t("securityAlert.openCenter")}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
