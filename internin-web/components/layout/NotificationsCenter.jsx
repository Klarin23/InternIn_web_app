"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FiBell,
  FiCheck,
  FiTrash2,
  FiX,
  FiLoader,
  FiInbox,
  FiChevronRight,
} from "react-icons/fi";
import {
  useNotifications,
  useNotificationsNonLuesCount,
  useMarquerNotificationLue,
  useMarquerToutesNotificationsLues,
  useSupprimerNotification,
} from "@/lib/queries/useNotifications";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useToastStore } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";
import {
  getNotifMeta,
  TONE_CLASS,
  TONE_DOT,
  formatNotifDate,
} from "@/lib/notifications/notifMeta";

export default function NotificationsCenter() {
  const router = useRouter();
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const showToast = useToastStore((s) => s.showToast);
  const [open, setOpen] = useState(false);
  const [ring, setRing] = useState(false);
  const prevCount = useRef(null);

  const { data: liste, isLoading, isError } = useNotifications();
  const { data: compte } = useNotificationsNonLuesCount();
  const marquerLue = useMarquerNotificationLue();
  const marquerToutes = useMarquerToutesNotificationsLues();
  const supprimer = useSupprimerNotification();

  const notifications = Array.isArray(liste) ? liste : liste?.notifications || [];
  const nonLues = compte?.nonLues ?? 0;

  useEffect(() => {
    if (prevCount.current === null) {
      prevCount.current = nonLues;
      return;
    }
    if (nonLues > prevCount.current && !reduceMotion) {
      setRing(true);
      const id = setTimeout(() => setRing(false), 700);
      prevCount.current = nonLues;
      return () => clearTimeout(id);
    }
    prevCount.current = nonLues;
  }, [nonLues, reduceMotion]);

  function handleOpenNotif(n) {
    if (!n.lu) marquerLue.mutate(n.idNotification);
    setOpen(false);
    if (n.lien) router.push(n.lien);
  }

  function handleMarkAll() {
    if (nonLues === 0) return;
    marquerToutes.mutate(undefined, {
      onSuccess: () => {
        showToast?.({
          message: "Toutes les notifications ont été marquées comme lues",
          variant: "success",
        });
      },
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground",
          open && "bg-muted text-foreground",
        )}
        aria-label={t("header.notifications") || "Notifications"}
        aria-expanded={open}
      >
        <motion.span
          animate={
            ring && !reduceMotion
              ? { rotate: [0, -12, 12, -8, 8, 0], scale: [1, 1.08, 1] }
              : { rotate: 0, scale: 1 }
          }
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="inline-flex"
        >
          <FiBell className="h-5 w-5" />
        </motion.span>
        <AnimatePresence>
          {nonLues > 0 && (
            <motion.span
              key={nonLues}
              initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm dark:text-black"
            >
              {nonLues > 9 ? "9+" : nonLues}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={
                reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.98 }
              }
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed inset-x-3 top-14 z-50 flex max-h-[min(70vh,520px)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px]"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Notifications
                  </h2>
                  {nonLues > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {nonLues} non lue{nonLues > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {nonLues > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAll}
                      disabled={marquerToutes.isPending}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-50"
                    >
                      <FiCheck className="h-3.5 w-3.5" />
                      Tout lire
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted sm:hidden"
                    onClick={() => setOpen(false)}
                    aria-label="Fermer"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Chargement…
                  </div>
                ) : isError ? (
                  <div className="px-4 py-10 text-center text-sm text-destructive">
                    Impossible de charger les notifications.
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <FiInbox className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Aucune notification
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vous serez informé ici des événements importants.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {notifications.slice(0, 20).map((n, idx) => {
                      const meta = getNotifMeta(n.type);
                      return (
                        <motion.li
                          key={n.idNotification}
                          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.22,
                            delay: reduceMotion ? 0 : Math.min(idx, 8) * 0.03,
                          }}
                        >
                          <div
                            className={cn(
                              "group flex items-start gap-2.5 px-3 py-3 transition hover:bg-muted/40",
                              !n.lu && "bg-primary/[0.03]",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenNotif(n)}
                              className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                            >
                              <span
                                className={cn(
                                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
                                  TONE_CLASS[meta.tone] || TONE_CLASS.info,
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    TONE_DOT[meta.tone] || TONE_DOT.info,
                                  )}
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-start gap-1.5">
                                  {!n.lu && (
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                  )}
                                  <span
                                    className={cn(
                                      "text-sm leading-snug text-foreground",
                                      !n.lu ? "font-semibold" : "font-medium",
                                    )}
                                  >
                                    {n.titre}
                                  </span>
                                </span>
                                {n.message && (
                                  <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                                    {n.message}
                                  </span>
                                )}
                                <span className="mt-1.5 flex items-center gap-2">
                                  <span className="text-[11px] text-muted-foreground">
                                    {formatNotifDate(n.dateCreation, t)}
                                  </span>
                                  {n.lien && (
                                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                                      {meta.label}
                                      <FiChevronRight className="h-3 w-3" />
                                    </span>
                                  )}
                                </span>
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                supprimer.mutate(n.idNotification);
                              }}
                              className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                              aria-label="Supprimer"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="border-t border-border/60 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push("/notifications");
                  }}
                  className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold text-primary transition hover:bg-primary/5"
                >
                  Voir toutes les notifications
                  <FiChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

