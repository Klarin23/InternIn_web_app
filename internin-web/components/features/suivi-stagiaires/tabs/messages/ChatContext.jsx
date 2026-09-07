"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatDateRange } from "./messageUtils";

export default function ChatContext({ stage }) {
  const { t, locale } = useTranslation();
  const range = formatDateRange(
    stage?.dateDebut,
    stage?.dateFinPrevue || stage?.dateFinReelle,
    locale,
  );

  return (
    <div className="border-b border-border/50 bg-muted/30 px-4 py-2 sm:px-5">
      <p className="text-[11px] text-muted-foreground">
        {t("suivi.msg.linked")}
        {stage?.titrePoste ? (
          <>
            {" · "}
            <span className="font-medium text-foreground/80">
              {t("suivi.msg.stageLabel")} {stage.titrePoste}
            </span>
          </>
        ) : null}
        {range ? (
          <>
            {" · "}
            <span>{range}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
