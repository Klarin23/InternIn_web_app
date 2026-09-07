"use client";

import AppHeader from "@/components/layout/AppHeader";
import SupervisionCalendar from "@/components/features/dashboard-superviseur/SupervisionCalendar";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function CalendrierSupervisionPage() {
  const { t } = useTranslation();
  return (
    <>
      <AppHeader
        breadcrumb={[{ label: t("calendar.title") }]}
        subtitle={t("calendar.subtitle")}
        refreshKeys={["calendrierSupervision"]}
      />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("calendar.heading")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("calendar.description")}
          </p>
        </div>
        <SupervisionCalendar />
      </div>
    </>
  );
}
