"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import LanguageSwitcher from "./LanguageSwitcher";
import SiteLogo from "@/components/layout/SiteLogo";

export default function Header() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const { t } = useTranslation();

  const LIENS_NAV = [
    { href: "/", label: t("nav.home") },
    { href: "/#comment-ca-marche", label: t("nav.howItWorks") },
    { href: "/etudiants", label: t("nav.students") },
    { href: "/entreprises", label: t("nav.companies") },
    { href: "/universites", label: t("nav.universities") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 md:px-10 lg:px-20">
        <SiteLogo className="h-5.5 w-auto" />

        <nav className="hidden items-center gap-8 md:flex">
          {LIENS_NAV.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" asChild className="rounded-sm">
            <Link href="/connexion">{t("nav.login")}</Link>
          </Button>
          <Button size="sm" asChild className="h-9 rounded-sm px-4">
            <Link href="/inscription">{t("nav.signup")}</Link>
          </Button>
        </div>

        {/* Bouton hamburger, visible uniquement sur petit écran. L'icône
            bascule entre menu/croix avec une rotation+fondu au lieu d'un
            changement brut. */}
        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher align="right" />
          <button
            type="button"
            onClick={() => setMenuOuvert((v) => !v)}
            className="relative flex h-10 w-10 items-center justify-center rounded-sm text-foreground"
            aria-label={menuOuvert ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={menuOuvert}
          >
            <FiMenu
              className={`absolute h-6 w-6 transition-all duration-300 ${
                menuOuvert
                  ? "rotate-90 scale-0 opacity-0"
                  : "rotate-0 scale-100 opacity-100"
              }`}
            />
            <FiX
              className={`absolute h-6 w-6 transition-all duration-300 ${
                menuOuvert
                  ? "rotate-0 scale-100 opacity-100"
                  : "-rotate-90 scale-0 opacity-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Panneau mobile : liens + actions, avec une animation d'ouverture
          fluide (fondu + glissement depuis le haut) fournie par tw-animate-css,
          déjà utilisée ailleurs dans l'app pour les dialogues. */}
      {menuOuvert && (
        <nav className="animate-in fade-in slide-in-from-top-2 border-t border-border bg-background duration-200 md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {LIENS_NAV.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                onClick={() => setMenuOuvert(false)}
                className="rounded-sm px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {lien.label}
              </Link>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-11 justify-center rounded-sm"
              >
                <Link href="/connexion" onClick={() => setMenuOuvert(false)}>
                  {t("nav.login")}
                </Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="h-11 justify-center rounded-sm"
              >
                <Link href="/inscription" onClick={() => setMenuOuvert(false)}>
                  {t("nav.signup")}
                </Link>
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
