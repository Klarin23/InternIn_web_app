"use client";

import { FiFileText } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function RapportsTab() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <FiFileText className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{t("suivi.reports.coming")}</p>
      <p className="max-w-[320px] text-xs text-muted-foreground">
        {t("suivi.reports.hint")}
      </p>
    </div>
  );
}
