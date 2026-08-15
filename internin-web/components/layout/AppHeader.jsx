"use client";
// En-tête applicatif enrichi : fil d'Ariane, recherche globale (toujours
// fonctionnelle), ou recherche locale si onSearchChange est fourni,
// notifications, avatar. Compatible avec l'ancien usage `title="..."`.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiChevronDown,
  FiLogOut,
  FiSearch,
  FiMenu,
} from "react-icons/fi";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useUiStore } from "@/lib/store/useUiStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import RefreshButton from "@/components/refresh/RefreshButton";
import NotificationsCenter from "./NotificationsCenter";
import GlobalSearch from "./GlobalSearch";
import { useAutoRefresh, AUTO_REFRESH_INTERVALS } from "@/hooks/useAutoRefresh";

export default function AppHeader({
  title,
  subtitle,
  breadcrumb,
  avatarLabel,
  hasNotifications,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  refreshKeys,
  autoRefreshInterval = AUTO_REFRESH_INTERVALS.medium,
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const placeholderRecherche =
    searchPlaceholder ?? t("header.searchPlaceholder");
  const { user, clearSession } = useAuthStore();
  const queryClient = useQueryClient();
  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav);
  const [menuOpen, setMenuOpen] = useState(false);

  const hasRefresh = Array.isArray(refreshKeys) && refreshKeys.length > 0;
  useAutoRefresh(hasRefresh ? refreshKeys : [], autoRefreshInterval);

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
          <nav className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
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
            {hasRefresh && (
              <RefreshButton
                queryKeys={refreshKeys}
                className="flex-row items-center gap-2"
              />
            )}
          </nav>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Recherche : locale (page) si onSearchChange fourni, sinon globale */}
      <div className="hidden flex-1 justify-center lg:flex">
        {onSearchChange ? (
          <div className="flex w-full max-w-[360px] items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            <FiSearch className="h-4 w-4 flex-shrink-0" />
            <input
              type="text"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholderRecherche}
              className="w-full truncate bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              aria-label={placeholderRecherche}
            />
          </div>
        ) : (
          <GlobalSearch placeholder={placeholderRecherche} />
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {/* Recherche compacte mobile */}
        <div className="lg:hidden">
          {!onSearchChange && (
            <GlobalSearch
              className="max-w-[140px] sm:max-w-[200px]"
              placeholder={placeholderRecherche}
            />
          )}
        </div>

        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationsCenter />

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
