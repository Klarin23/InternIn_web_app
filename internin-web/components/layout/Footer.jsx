"use client"
import Link from "next/link";

import {FaInstagram, FaLinkedin, FaTwitter} from "react-icons/fa6"
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-muted py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xl font-extrabold text-foreground">
              Intern<span className="text-primary">In</span>
            </div>
            <p className="mt-3 max-w-70 text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
            {/* Réseaux sociaux */}
            <div className="mt-4 flex gap-2.5">
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
              >
                <FaLinkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter / X"
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
              >
                <FaTwitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
              >
                <FaInstagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h6 className="mb-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t("footer.platform")}
            </h6>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/etudiants" className="hover:text-primary">
                  {t("nav.students")}
                </Link>
              </li>
              <li>
                <Link href="/entreprises" className="hover:text-primary">
                  {t("nav.companies")}
                </Link>
              </li>
              <li>
                <Link href="/universites" className="hover:text-primary">
                  {t("nav.universities")}
                </Link>
              </li>
              <li>
                <Link href="/#comment-ca-marche" className="hover:text-primary">
                  {t("nav.howItWorks")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h6 className="mb-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t("footer.company")}
            </h6>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/a-propos" className="hover:text-primary">
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  {t("footer.careers")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h6 className="mb-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t("footer.stayInformed")}
            </h6>
            <p className="mb-3 text-sm text-muted-foreground">
              {t("footer.newsletterText")}
            </p>
            {/* Formulaire statique pour l'instant : le branchement réel (API + validation Zod)
                se fera quand lib/api et lib/schemas seront construits */}
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder={t("footer.emailPlaceholder")}
                aria-label={t("footer.emailAria")}
                className="h-11 flex-1 rounded-sm border border-border bg-background px-3.5 text-sm focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="h-11 rounded-sm bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
              >
                {t("footer.subscribe")}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
          <span>{t("footer.rights")}</span>
          <span>{t("footer.terms")}</span>
        </div>
      </div>
    </footer>
  );
}