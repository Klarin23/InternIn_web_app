"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { FiPlus } from "react-icons/fi";

export default function CreerOffreCard({ onClick, disabled = false }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={
        disabled ? t("entrepriseSpace.offers.publishDisabledHint") : undefined
      }
      className={`group relative flex min-h-[280px] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        disabled
          ? "cursor-not-allowed border-border bg-muted/20 opacity-60"
          : "border-border bg-card hover:border-primary/40 hover:bg-primary/[0.03]"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
          disabled
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary group-hover:bg-primary/15"
        }`}
      >
        <FiPlus className="h-5 w-5" />
      </div>

      <div className="max-w-[220px]">
        <span className="block text-sm font-semibold text-foreground">
          {t("entrepriseSpace.offers.createNewOfferTitle") ||
            "Créer une nouvelle offre"}
        </span>
        <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
          {disabled
            ? t("entrepriseSpace.offers.adminVerificationRequired")
            : t("entrepriseSpace.offers.createNewOfferHint") ||
              "Publiez une opportunité et commencez à recevoir des candidatures qualifiées."}
        </span>
      </div>

      {!disabled && (
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-opacity group-hover:opacity-90">
          <FiPlus className="h-3.5 w-3.5" />
          {t("entrepriseSpace.offers.newOfferCta") || "Nouvelle offre"}
        </span>
      )}
    </button>
  );
}
