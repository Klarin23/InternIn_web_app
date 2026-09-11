"use client";

import { FiUserPlus } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function MaitresStagePage() {
  const { t } = useTranslation();
  return (
    <>
      <AppHeader
        title={t("auditUi.university.supervisorsTitle")}
        subtitle={t("auditUi.university.supervisorsSubtitle")}
      />
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <FiUserPlus className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          {t("auditUi.university.comingSoonSupervisors")}
        </p>
        <p className="max-w-[360px] text-xs text-muted-foreground">
          {t("auditUi.university.supervisorsDescription")}
        </p>
      </div>
    </>
  );
}
