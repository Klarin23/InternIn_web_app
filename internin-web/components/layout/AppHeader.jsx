"use client";
// En-tête applicatif enrichi : fil d'Ariane, recherche (fonctionnelle si
// onSearchChange est fourni, sinon visuelle), notifications (fonctionnelles,
// avec polling léger — voir lib/queries/useNotifications), avatar avec
// initiales. Compatible avec l'ancien usage `title="..."` (converti
// automatiquement en fil d'Ariane à un seul élément), et avec un `subtitle`
// optionnel.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronDown,
  FiLogOut,
  FiSearch,
  FiBell,
  FiMenu,
  FiTrash2,
} from "react-icons/fi";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useUiStore } from "@/lib/store/useUiStore";
import {
  useNotifications,
  useNotificationsNonLuesCount,
  useMarquerNotificationLue,
  useMarquerToutesNotificationsLues,
  useSupprimerNotification,
  useSupprimerToutesNotifications,
} from "@/lib/queries/useNotifications";
import { useTranslation } from "@/lib/i18n/useTranslation";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

function formatDateRelative(date, maintenant, t) {
  const diffMs = maintenant - new Date(date).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return t("header.justNow");
  if (minutes < 60) return t("header.minutesAgo", { n: minutes });
  const heures = Math.round(minutes / 60);
  if (heures < 24) return t("header.hoursAgo", { n: heures });
  const jours = Math.round(heures / 24);
  return t("header.daysAgo", { n: jours });
}

// Point coloré par catégorie de notification, façon "🟢 Entreprise".
function couleurPointNotification(type) {
  if (type?.includes("rejetee")) return "bg-destructive";
  if (type?.includes("preselectionnee")) return "bg-amber-500";
  if (type?.includes("entretien")) return "bg-[#8B5CF6]";
  if (type?.includes("consultee")) return "bg-blue-500";
  return "bg-[#14b8a6]";
}

export default function AppHeader({
  title,
  subtitle,
  breadcrumb,
  avatarLabel,
  hasNotifications,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const placeholderRecherche =
    searchPlaceholder ?? t("header.searchPlaceholder");
  const { user, clearSession } = useAuthStore();
  const queryClient = useQueryClient();
  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [maintenant] = useState(() => Date.now());

  const { data: notifications } = useNotifications();
  const { data: compte } = useNotificationsNonLuesCount();
  const marquerLue = useMarquerNotificationLue();
  const marquerToutesLues = useMarquerToutesNotificationsLues();
  const supprimerNotif = useSupprimerNotification();
  const supprimerToutes = useSupprimerToutesNotifications();

  // hasNotifications reste accepté en override manuel (rétro-compatibilité),
  // sinon on se base sur le vrai compte de notifications non lues.
  const aDesNotifications = hasNotifications ?? (compte?.nonLues || 0) > 0;

  function ouvrirNotification(notif) {
    if (!notif.lu) marquerLue.mutate(notif.idNotification);
    setNotifOpen(false);
    if (notif.lien) router.push(notif.lien);
  }

  const crumbs = breadcrumb || [{ label: title }];
  const initials = avatarLabel || user?.email?.slice(0, 2).toUpperCase() || "?";

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/connexion");
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-4 border-b border-border bg-card px-4 py-3 md:px-6 transition-colors duration-300">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileNav}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm text-foreground hover:bg-muted md:hidden"
          aria-label={t("header.openMenu")}
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <nav className="flex min-w-0 items-center gap-1.5 text-sm">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5 truncate">
                {i > 0 && <span className="text-muted-foreground">/</span>}
                <span
                  className={
                    i === crumbs.length - 1
                      ? subtitle
                        ? "truncate text-xl font-bold text-foreground"
                        : "truncate font-semibold text-foreground"
                      : "truncate text-muted-foreground"
                  }
                >
                  {c.label}
                </span>
              </span>
            ))}
          </nav>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="hidden max-w-[360px] flex-1 items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground lg:flex">
        <FiSearch className="h-4 w-4 flex-shrink-0" />
        {onSearchChange ? (
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholderRecherche}
            className="w-full truncate bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        ) : (
          <span className="truncate">{placeholderRecherche}</span>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label={t("header.notifications")}
          >
            <FiBell className="h-[18px] w-[18px]" />
            {compte?.nonLues > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {compte.nonLues > 9 ? "9+" : compte.nonLues}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-[29rem] max-w-[calc(100vw-2rem)] rounded-md border border-border bg-card shadow-md transition-colors duration-300">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
                  <span className="text-sm font-semibold text-foreground">
                    {t("header.notifications")}
                  </span>
                  <div className="flex items-center gap-3">
                    {compte?.nonLues > 0 && (
                      <button
                        type="button"
                        onClick={() => marquerToutesLues.mutate()}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t("header.markAllRead")}
                      </button>
                    )}
                    {notifications && notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(t("header.deleteAllConfirm"))) {
                            supprimerToutes.mutate();
                          }
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                        {t("header.deleteAll")}
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-[45rem] overflow-y-auto">
                  {!notifications || notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                      {t("header.noNotifications")}
                    </p>
                  ) : (
                    <AnimatePresence initial={false}>
                      {notifications.map((n) => (
                        <motion.div
                          key={n.idNotification}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className={`group flex w-full items-start gap-2 border-b border-border px-4 py-3 last:border-0 hover:bg-muted ${
                            n.lu ? "" : "bg-primary/5"
                          }`}
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${couleurPointNotification(n.type)}`}
                          />
                          <button
                            type="button"
                            onClick={() => ouvrirNotification(n)}
                            className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
                          >
                            <span className="text-sm font-medium text-foreground">
                              {n.titre}
                            </span>
                            {n.message && (
                              <span className="text-xs text-muted-foreground">
                                {n.message}
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateRelative(
                                n.dateCreation,
                                maintenant,
                                t,
                              )}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              supprimerNotif.mutate(n.idNotification);
                            }}
                            className="flex-shrink-0 rounded-sm p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                            aria-label={t("header.deleteNotification")}
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full p-1 hover:bg-muted"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm ring-2 ring-primary/20">
              {initials}
            </div>
            <FiChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-border bg-card py-1.5 shadow-md transition-colors duration-300">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/5"
                >
                  <FiLogOut className="h-4 w-4" />
                  {t("header.logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
