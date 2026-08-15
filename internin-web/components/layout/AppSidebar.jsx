/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSettings, FiLogOut } from "react-icons/fi";
import { useUiStore } from "@/lib/store/useUiStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";

import { useTranslation } from "@/lib/i18n/useTranslation";

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  dot,
  dotColor,
  badgePulseColor,
  isActive,
  onClick,
}) {
  const { t } = useTranslation();
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group relative flex items-center gap-3 rounded-sm px-3.5 py-2.5 pl-4.5 text-sm transition-colors duration-200"
      style={
        isActive
          ? {
              backgroundColor: "var(--sidebar-accent)",
              color: "var(--sidebar-primary)",
              fontWeight: 600,
            }
          : { color: "var(--sidebar-foreground)" }
      }
      onMouseEnter={(e) => {
        if (!isActive)
          e.currentTarget.style.backgroundColor = "var(--sidebar-accent)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Barre verticale de l'élément actif — layoutId permet à Framer Motion
          de l'animer en douceur d'un item à l'autre au lieu de la faire
          apparaître/disparaître brutalement. */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active-bar"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full"
          style={{ backgroundColor: "var(--sidebar-primary)" }}
        />
      )}

      {dot && (
        <span
          className="h-2 w-2 shrink-0 animate-blink rounded-full"
          style={{ backgroundColor: dotColor || "var(--color-accent)" }}
          aria-label={t("sidebar.requiresAttention")}
        />
      )}

      {/* Icône : léger pivot + zoom au survol (transform CSS, pas de JS) */}
      <Icon className="h-4.5 w-4.5 shrink-0 transition-transform duration-200 ease-out group-hover:-rotate-6 group-hover:scale-110" />

      <span className="flex-1">{label}</span>

      {badge > 0 && (
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${badgePulseColor ? "animate-blink" : ""}`}
          style={
            badgePulseColor
              ? { backgroundColor: badgePulseColor, color: "#fff" }
              : isActive
                ? {
                    backgroundColor: "var(--sidebar-primary)",
                    color: "var(--sidebar-primary-foreground)",
                  }
                : {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "var(--sidebar-foreground)",
                  }
          }
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function AppSidebar({
  items,
  roleLabel,
  orgCard = null,
  userFooter = null,
  parametresHref = "/parametres",
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { mobileNavOpen, closeMobileNav } = useUiStore();
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const libelleRole = roleLabel ?? t("sidebar.brand");

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/connexion");
  }

  const body = (onLinkClick) => (
    <>
      <div className="border-b border-sidebar-border px-5 py-5">
        <Link href="/" className="text-lg font-extrabold text-white">
          <img
            src="/images/logo-dark.svg"
            alt="InternIn"
            className="h-7 w-auto"
          />
        </Link>
        <p className="mt-0.5 text-xs text-sidebar-foreground/70">
          {libelleRole}
        </p>
      </div>

      {orgCard && (
        <div className="mx-4 mt-4 flex items-center gap-2.5 rounded-md bg-white/5 p-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-sm text-xs font-bold text-white"
            style={{ backgroundColor: "var(--sidebar-primary)" }}
          >
            {orgCard.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orgCard.logoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              orgCard.name?.charAt(0) || "?"
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {orgCard.name}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {orgCard.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Zone de navigation : seule cette partie défile si la liste de liens dépasse */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {(() => {
          const hasSections = items.some((i) => i.section);
          if (!hasSections) {
            return (
              <>
                <p className="mb-2 px-3.5 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                  {t("sidebar.mainMenu")}
                </p>
                {items.map((item) => (
                  <NavLink
                    key={item.href}
                    {...item}
                    isActive={pathname === item.href || (item.href !== "/tableau-de-bord" && pathname?.startsWith(item.href))}
                    onClick={onLinkClick}
                  />
                ))}
              </>
            );
          }
          const SECTION_LABELS = {
            gestion: "Gestion",
            supervision: "Supervision",
            entreprise: "Entreprise",
          };
          const order = [];
          const groups = {};
          for (const item of items) {
            const key = item.section || "_main";
            if (!groups[key]) {
              groups[key] = [];
              order.push(key);
            }
            groups[key].push(item);
          }
          return order.map((key) => (
            <div key={key} className="mb-3">
              <p className="mb-1.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                {key === "_main" ? t("sidebar.mainMenu") : (SECTION_LABELS[key] || key)}
              </p>
              {groups[key].map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  isActive={pathname === item.href || (item.href !== "/tableau-de-bord" && pathname?.startsWith(item.href))}
                  onClick={onLinkClick}
                />
              ))}
            </div>
          ));
        })()}
      </nav>

      {/* Bloc bas fixe : soit la carte profil compacte (rôle Admin), soit les
          liens Paramètres + Déconnexion d'origine (autres rôles, inchangé) */}
      <div className="shrink-0 border-t border-sidebar-border p-4">
        {userFooter ? (
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: "var(--sidebar-primary)" }}
            >
              {userFooter.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {userFooter.name}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {userFooter.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label={t("sidebar.logout")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-sidebar-foreground/70 transition hover:bg-destructive/20 hover:text-red-300"
            >
              <FiLogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <Link
              href={parametresHref}
              onClick={onLinkClick}
              className="flex items-center gap-3 rounded-sm px-3.5 py-2.5 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-white"
            >
              <FiSettings className="h-4.5 w-4.5 shrink-0" />
              {t("sidebar.settings")}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-sm px-3.5 py-2.5 text-left text-sm text-sidebar-foreground transition hover:bg-destructive/20 hover:text-red-300"
            >
              <FiLogOut className="h-4.5 w-4.5 shrink-0" />
              {t("sidebar.logout")}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden h-screen w-65 shrink-0 flex-col bg-sidebar md:sticky md:top-0 md:flex">
        {body()}
      </aside>

      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileNav}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 flex w-65 flex-col bg-sidebar shadow-lg md:hidden"
            >
              <button
                type="button"
                onClick={closeMobileNav}
                className="absolute right-4 top-5 z-10 text-sidebar-foreground hover:text-white"
                aria-label={t("nav.closeMenu")}
              >
                <FiX className="h-5 w-5" />
              </button>
              {body(closeMobileNav)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
