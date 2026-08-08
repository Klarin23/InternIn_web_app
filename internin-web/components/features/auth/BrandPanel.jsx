"use client";
// Panneau de marque affiché à gauche sur toutes les pages (auth).
// Nécessite maintenant "use client" pour utiliser useTranslation (auparavant
// Server Component car purement statique/non interactif).

import { useTranslation } from "@/lib/i18n/useTranslation";

export default function BrandPanel() {
  const { t } = useTranslation();
  const stats = t("auth.brandPanel.stats");

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-[#0B4A45] via-[#0F9C8C] to-primary p-14 text-white lg:flex">
      {/* Halo violet décoratif en arrière-plan */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_85%_10%,rgba(91,61,245,0.35),transparent_60%)]" />

      <div className="relative z-10 text-xl font-extrabold">
        Intern<span className="text-primary-foreground/80">In</span>
      </div>

      <div className="relative z-10 max-w-105">
        <h2 className="mb-3.5 text-3xl font-bold text-white">
          {t("auth.brandPanel.title")}
        </h2>
        <p className="text-white/80">{t("auth.brandPanel.description")}</p>

        <div className="mt-9 flex gap-8">
          {stats.map(([num, label]) => (
            <div key={label}>
              <b className="block text-2xl font-extrabold">{num}</b>
              <span className="text-xs text-white/70">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 rounded-md border border-white/20 bg-white/10 p-5 backdrop-blur">
        <p className="mb-3 text-sm italic text-white">
          &ldquo;{t("auth.brandPanel.quote")}&rdquo;
        </p>
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=100&q=80"
            alt={t("auth.brandPanel.quoteName")}
            className="h-9 w-9 rounded-full object-cover"
          />
          <div>
            <b className="block text-xs">{t("auth.brandPanel.quoteName")}</b>
            <span className="text-xs text-white/70">
              {t("auth.brandPanel.quoteRole")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
