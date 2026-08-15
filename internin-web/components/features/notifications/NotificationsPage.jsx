"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { FiCheck, FiChevronRight, FiInbox, FiLoader, FiTrash2 } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import {
  useNotifications,
  useMarquerNotificationLue,
  useMarquerToutesNotificationsLues,
  useSupprimerNotification,
  useSupprimerToutesNotifications,
} from "@/lib/queries/useNotifications";
import { useToastStore } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";
import { getNotifMeta, TONE_CLASS, TONE_DOT, formatNotifDate } from "@/lib/notifications/notifMeta";

const FILTRES = [
  { id: "toutes", label: "Toutes" },
  { id: "non_lues", label: "Non lues" },
  { id: "lues", label: "Lues" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const showToast = useToastStore((s) => s.showToast);
  const [filtre, setFiltre] = useState("toutes");
  const { data: liste, isLoading, isError } = useNotifications();
  const marquerLue = useMarquerNotificationLue();
  const marquerToutes = useMarquerToutesNotificationsLues();
  const supprimer = useSupprimerNotification();
  const supprimerToutes = useSupprimerToutesNotifications();
  const notifications = Array.isArray(liste) ? liste : liste?.notifications || [];
  const filtered = useMemo(() => {
    if (filtre === "non_lues") return notifications.filter((n) => !n.lu);
    if (filtre === "lues") return notifications.filter((n) => n.lu);
    return notifications;
  }, [notifications, filtre]);
  const nonLues = notifications.filter((n) => !n.lu).length;

  function openNotif(n) {
    if (!n.lu) marquerLue.mutate(n.idNotification);
    if (n.lien) router.push(n.lien);
  }

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: "Notifications" }]}
        subtitle="Historique de vos alertes"
        refreshKeys={["notifications", "notificationsNonLuesCount"]}
      />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? "s" : ""}` : "Tout est à jour"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {nonLues > 0 && (
              <button
                type="button"
                onClick={() =>
                  marquerToutes.mutate(undefined, {
                    onSuccess: () =>
                      showToast?.({ message: "Toutes marquées comme lues", variant: "success" }),
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold shadow-sm hover:bg-muted"
              >
                <FiCheck className="h-3.5 w-3.5" /> Tout marquer comme lu
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Supprimer toutes les notifications ?")) supprimerToutes.mutate();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5"
              >
                <FiTrash2 className="h-3.5 w-3.5" /> Tout supprimer
              </button>
            )}
          </div>
        </div>

        <div className="mb-5">
          <div className="inline-flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
            {FILTRES.map((f) => {
              const actif = filtre === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltre(f.id)}
                  className={cn(
                    "relative z-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors",
                    actif ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {actif && (
                    <motion.span
                      layoutId={reduceMotion ? undefined : "filtre-pill-notif"}
                      className="absolute inset-0 -z-10 rounded-lg bg-primary shadow-sm"
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                  )}
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <FiLoader className="h-5 w-5 animate-spin" /> Chargement…
            </div>
          ) : isError ? (
            <p className="px-4 py-12 text-center text-sm text-destructive">Erreur de chargement.</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <FiInbox className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Aucune notification</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {filtered.map((n, idx) => {
                const meta = getNotifMeta(n.type);
                return (
                  <motion.li
                    key={n.idNotification}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : Math.min(idx, 10) * 0.025 }}
                    className={cn(
                      "group flex items-start gap-3 px-4 py-3.5 transition hover:bg-muted/40",
                      !n.lu && "bg-primary/[0.03]",
                    )}
                  >
                    <button type="button" onClick={() => openNotif(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                      <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", TONE_CLASS[meta.tone])}>
                        <span className={cn("h-2.5 w-2.5 rounded-full", TONE_DOT[meta.tone])} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          {!n.lu && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          <span className={cn("text-sm text-foreground", !n.lu ? "font-semibold" : "font-medium")}>{n.titre}</span>
                        </span>
                        {n.message && <span className="mt-0.5 block text-xs text-muted-foreground">{n.message}</span>}
                        <span className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                          {formatNotifDate(n.dateCreation)}
                          {n.lien && (
                            <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
                              {meta.label} <FiChevronRight className="h-3 w-3" />
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                    <button type="button" onClick={() => supprimer.mutate(n.idNotification)} className="rounded-lg p-2 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100" aria-label="Supprimer">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

