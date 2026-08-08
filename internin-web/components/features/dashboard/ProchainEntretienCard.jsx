"use client";
import Link from "next/link";
import {
  FiCalendar,
  FiClock,
  FiVideo,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

function initiale(nom) {
  return (nom?.charAt(0) || "?").toUpperCase();
}

export default function ProchainEntretienCard({ entretien }) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";

  const MODE_INFO = {
    video: { label: t("dashboard.nextInterview.modes.video"), icon: FiVideo },
    telephone: {
      label: t("dashboard.nextInterview.modes.telephone"),
      icon: FiPhone,
    },
    presentiel: {
      label: t("dashboard.nextInterview.modes.presentiel"),
      icon: FiMapPin,
    },
  };

  if (!entretien) {
    return (
      <div className="rounded-[20px] border border-border bg-card p-6 shadow-[0_2px_10px_-4px_rgba(17,24,39,0.08)] transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(17,24,39,0.12)]">
        <h3 className="mb-3 text-sm font-bold text-foreground">
          {t("dashboard.nextInterview.title")}
        </h3>
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("dashboard.nextInterview.noneScheduled")}
        </p>
      </div>
    );
  }

  const mode = MODE_INFO[entretien.modeEntretien] || MODE_INFO.video;
  const ModeIcon = mode.icon;
  const date = new Date(entretien.dateHeure);

  return (
    <div className="overflow-hidden rounded-md bg-[#0F172A] text-white">
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {initiale(entretien.nomEntreprise)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {entretien.nomEntreprise}
            </p>
            <p className="truncate text-xs text-white/60">
              {entretien.titreOffre}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-white/80">
          <p className="flex items-center gap-2">
            <FiCalendar className="h-3.5 w-3.5 flex-shrink-0" />
            {date.toLocaleDateString(dateLocale, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="flex items-center gap-2">
            <FiClock className="h-3.5 w-3.5 flex-shrink-0" />
            {date.toLocaleTimeString(dateLocale, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="flex items-center gap-2">
            <ModeIcon className="h-3.5 w-3.5 flex-shrink-0" />
            {mode.label}
          </p>
        </div>
      </div>

      <Link
        href="/entretiens"
        className="flex items-center justify-center bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        {t("dashboard.nextInterview.viewDetails")}
      </Link>
    </div>
  );
}
